<template>
    <div class="scheduler-toolbar">
        <div class="view-toggle">
            <button :class="{ active: viewMode === 'period' }" @click="setViewMode('period')" aria-label="Period view">
                Period View
            </button>
            <button :class="{ active: viewMode === 'time' }" @click="setViewMode('time')" aria-label="Time view">
                Time View
            </button>
        </div>

        <div class="filters">
            <div class="filter-group">
                <label>Teachers:</label>
                <div class="teacher-chips">
                    <div
                        v-for="teacher in teachers"
                        :key="teacher.id"
                        :class="['teacher-chip', { selected: isTeacherSelected(teacher.id) }]"
                        @click="toggleTeacher(teacher.id)"
                    >
                        {{ teacher.name }}
                    </div>
                </div>
            </div>

            <div class="filter-group">
                <label for="class-select">Class:</label>
                <select id="class-select" v-model="selectedClass" @change="onClassChange">
                    <option value="">All Classes</option>
                    <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                        {{ cls.name }}
                    </option>
                </select>
            </div>

            <div class="filter-group">
                <label for="room-select">Room:</label>
                <select id="room-select" v-model="selectedRoom" @change="onRoomChange">
                    <option value="">All Rooms</option>
                    <option v-for="room in rooms" :key="room.id" :value="room.id">
                        {{ room.name }}
                    </option>
                </select>
            </div>

            <button class="clear-filters" @click="clearFilters" aria-label="Clear all filters">Clear Filters</button>
        </div>

        <div class="actions">
            <button
                class="save-button"
                @click="saveDraft"
                :disabled="isDraftSaved || isLoading"
                aria-label="Save draft"
            >
                {{ isLoading ? 'Saving...' : 'Save Draft' }}
            </button>

            <button
                class="publish-button"
                @click="openPublishDialog"
                :disabled="!isDraftSaved || isLoading"
                aria-label="Publish schedule"
            >
                Publish
            </button>

            <div class="mock-toggle">
                <input type="checkbox" id="mock-mode" v-model="mockMode" @change="toggleMockMode" />
                <label for="mock-mode">Mock Mode</label>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useSchedulerStore } from '../../pinia/scheduler';

export default {
    name: 'SchedulerToolbar',
    props: {
        teachers: {
            type: Array,
            default: () => [
                { id: 't1', name: 'Mr. Smith' },
                { id: 't2', name: 'Mrs. Johnson' },
                { id: 't3', name: 'Dr. Williams' },
                { id: 't4', name: 'Ms. Brown' },
            ],
        },
        classes: {
            type: Array,
            default: () => [
                { id: 'c1', name: 'Class 1A' },
                { id: 'c2', name: 'Class 2B' },
                { id: 'c3', name: 'Class 3C' },
            ],
        },
        rooms: {
            type: Array,
            default: () => [
                { id: 'r1', name: 'Room 101' },
                { id: 'r2', name: 'Room 102' },
                { id: 'r3', name: 'Lab 1' },
                { id: 'r4', name: 'Gym' },
            ],
        },
    },
    emits: ['open-publish-dialog'],
    setup(props, { emit }) {
        const store = useSchedulerStore();

        const selectedClass = ref('');
        const selectedRoom = ref('');
        const mockMode = ref(store.useMockMode);

        const viewMode = computed(() => store.viewMode);
        const isDraftSaved = computed(() => store.isDraftSaved);
        const isLoading = computed(() => store.isLoading);

        function setViewMode(mode) {
            store.setViewMode(mode);
        }

        function isTeacherSelected(teacherId) {
            return store.selectedTeacherIds.includes(teacherId);
        }

        function toggleTeacher(teacherId) {
            store.toggleTeacher(teacherId);
        }

        function onClassChange() {
            store.setSelectedClass(selectedClass.value || null);
        }

        function onRoomChange() {
            store.setSelectedRoom(selectedRoom.value || null);
        }

        function clearFilters() {
            store.clearFilters();
            selectedClass.value = '';
            selectedRoom.value = '';
        }

        function saveDraft() {
            store.persistDraft();
        }

        function openPublishDialog() {
            emit('open-publish-dialog');
        }

        function toggleMockMode() {
            store.toggleMockMode();
        }

        return {
            viewMode,
            selectedClass,
            selectedRoom,
            mockMode,
            isDraftSaved,
            isLoading,
            setViewMode,
            isTeacherSelected,
            toggleTeacher,
            onClassChange,
            onRoomChange,
            clearFilters,
            saveDraft,
            openPublishDialog,
            toggleMockMode,
        };
    },
};
</script>

<style scoped>
.scheduler-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
    gap: 12px;
}

.view-toggle {
    display: flex;
    gap: 8px;
}

.view-toggle button {
    padding: 8px 16px;
    border: 1px solid #ccc;
    background-color: #fff;
    cursor: pointer;
    border-radius: 4px;
}

.view-toggle button.active {
    background-color: #4a6cf7;
    color: white;
    border-color: #4a6cf7;
}

.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.teacher-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.teacher-chip {
    padding: 4px 8px;
    background-color: #eee;
    border-radius: 16px;
    font-size: 0.9em;
    cursor: pointer;
    user-select: none;
}

.teacher-chip.selected {
    background-color: #4a6cf7;
    color: white;
}

select {
    padding: 6px;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.clear-filters {
    padding: 6px 12px;
    background-color: transparent;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
}

.actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.save-button,
.publish-button {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.save-button {
    background-color: #fff;
    border: 1px solid #4a6cf7;
    color: #4a6cf7;
}

.save-button:disabled {
    border-color: #ccc;
    color: #999;
    cursor: not-allowed;
}

.publish-button {
    background-color: #4a6cf7;
    border: 1px solid #4a6cf7;
    color: white;
}

.publish-button:disabled {
    background-color: #ccc;
    border-color: #ccc;
    cursor: not-allowed;
}

.mock-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9em;
    color: #666;
}

@media (max-width: 768px) {
    .scheduler-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .view-toggle,
    .filters,
    .actions {
        width: 100%;
    }
}
</style>
