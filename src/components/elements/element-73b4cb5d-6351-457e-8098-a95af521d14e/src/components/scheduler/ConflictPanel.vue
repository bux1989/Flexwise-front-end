<template>
    <div v-if="visible" class="conflict-panel">
        <div class="panel-header">
            <h3>⚠️ Schedule Conflicts ({{ conflicts.length }})</h3>
            <button @click="$emit('close')" class="close-btn">×</button>
        </div>
        <div class="panel-body">
            <div v-if="conflicts.length === 0" class="no-conflicts">
                <p>✅ No conflicts detected in the current schedule</p>
            </div>
            <div v-else>
                <div v-for="conflict in conflicts" :key="conflict.id" class="conflict-item">
                    <div class="conflict-header">
                        <span class="conflict-type">{{ conflict.type || 'Schedule Conflict' }}</span>
                        <span class="conflict-severity">{{ conflict.severity || 'Medium' }}</span>
                    </div>
                    <div class="conflict-details">
                        <p><strong>Day:</strong> {{ getDayName(conflict.day_id) }}</p>
                        <p><strong>Period:</strong> {{ getPeriodName(conflict.period_id) }}</p>
                        <p><strong>Issue:</strong> {{ conflict.description || 'Resource conflict detected' }}</p>
                    </div>
                    <div class="conflict-actions">
                        <button @click="navigateToConflict(conflict)" class="btn btn-sm btn-outline">
                            View Details
                        </button>
                        <button
                            @click="applyAutoSuggestion(conflict)"
                            class="btn btn-sm btn-primary"
                            v-if="conflict.auto_resolvable"
                        >
                            Auto-resolve
                        </button>
                        <button @click="ignoreConflict(conflict)" class="btn btn-sm btn-secondary">Ignore</button>
                    </div>
                </div>
                <div class="panel-footer" v-if="hasAutoResolvableConflicts">
                    <button @click="autoResolveAll" class="btn btn-primary">🤖 Auto-resolve All Conflicts</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ConflictPanel',
    props: {
        visible: { type: Boolean, default: false },
        conflicts: { type: Array, default: () => [] },
        courses: { type: Array, default: () => [] },
        teachers: { type: Array, default: () => [] },
        classes: { type: Array, default: () => [] },
        rooms: { type: Array, default: () => [] },
        periods: { type: Array, default: () => [] },
        schoolDays: { type: Array, default: () => [] },
    },
    emits: ['close', 'navigate-to-conflict', 'apply-suggestion', 'ignore-conflict', 'auto-resolve-all'],
    computed: {
        hasAutoResolvableConflicts() {
            return this.conflicts.some(conflict => conflict.auto_resolvable);
        },
    },
    methods: {
        getDayName(dayId) {
            const day = this.schoolDays.find(d => d.id === dayId || d.day_id === dayId);
            return day?.name || `Day ${dayId}`;
        },
        getPeriodName(periodId) {
            const period = this.periods.find(p => p.id === periodId);
            return period?.name || period?.label || `Period ${periodId}`;
        },
        navigateToConflict(conflict) {
            console.log('🔍 [ConflictPanel] Navigating to conflict:', conflict);
            this.$emit('navigate-to-conflict', conflict);
        },
        applyAutoSuggestion(conflict) {
            console.log('🤖 [ConflictPanel] Applying auto-suggestion for conflict:', conflict);
            this.$emit('apply-suggestion', {
                conflictId: conflict.id,
                suggestion: conflict.suggestion || 'auto-resolve',
            });
        },
        ignoreConflict(conflict) {
            console.log('❌ [ConflictPanel] Ignoring conflict:', conflict);
            this.$emit('ignore-conflict', conflict);
        },
        autoResolveAll() {
            console.log('🤖 [ConflictPanel] Auto-resolving all conflicts');
            this.$emit('auto-resolve-all');
        },
    },
};
</script>

<style scoped>
.conflict-panel {
    background: white;
    border: 1px solid #ff4d4f;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
    max-height: 80vh;
    overflow-y: auto;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #fff2f0;
    border-bottom: 1px solid #ffccc7;
    border-radius: 6px 6px 0 0;
}

.panel-header h3 {
    margin: 0;
    color: #cf1322;
    font-size: 1.1em;
}

.close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #cf1322;
    padding: 4px 8px;
}

.close-btn:hover {
    background: rgba(207, 19, 34, 0.1);
    border-radius: 4px;
}

.panel-body {
    padding: 16px 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.no-conflicts {
    text-align: center;
    color: #52c41a;
    padding: 20px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 4px;
}

.conflict-item {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 12px;
}

.conflict-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.conflict-type {
    font-weight: 600;
    color: #cf1322;
    font-size: 0.9em;
}

.conflict-severity {
    background: #ff4d4f;
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.75em;
    font-weight: 500;
}

.conflict-details {
    margin-bottom: 12px;
    font-size: 0.9em;
}

.conflict-details p {
    margin: 4px 0;
    color: #333;
}

.conflict-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.btn {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    transition: all 0.2s;
}

.btn-sm {
    padding: 3px 6px;
    font-size: 0.75em;
}

.btn-outline {
    background: white;
    color: #007cba;
    border-color: #007cba;
}

.btn-outline:hover {
    background: #007cba;
    color: white;
}

.btn-primary {
    background: #007cba;
    color: white;
    border-color: #007cba;
}

.btn-primary:hover {
    background: #005a85;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    border-color: #6c757d;
}

.btn-secondary:hover {
    background: #545b62;
}

.panel-footer {
    padding: 12px 20px;
    border-top: 1px solid #ffccc7;
    background: #fff7f7;
    text-align: center;
}

.panel-footer .btn {
    padding: 8px 16px;
    font-size: 0.9em;
}
</style>
