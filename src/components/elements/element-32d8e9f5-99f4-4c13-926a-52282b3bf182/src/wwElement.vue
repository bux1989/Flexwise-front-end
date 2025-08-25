<template>
    <div class="course-scheduler-wrapper">
        <!-- Header -->
        <div class="scheduler-header">
            <h2>Course Scheduler</h2>
            <div class="scheduler-controls">
                <div class="mode-indicator" :class="{ 'read-only': isReadOnly }">
                    {{ isReadOnly ? 'Published Schedule (Read-Only)' : 'Planning Mode' }}
                </div>

                <div class="header-actions" v-if="!isReadOnly">
                    <button @click="undo" :disabled="!canUndo" class="btn">↶ Undo</button>
                    <button @click="showConflicts = !showConflicts" class="btn" :class="{ active: showConflicts }">
                        ⚠️ Conflicts ({{ safeLength(allConflicts) }})
                    </button>
                    <button @click="showStatistics = !showStatistics" class="btn" :class="{ active: showStatistics }">
                        📊 Statistics
                    </button>
                </div>

                <div class="header-actions" v-if="isReadOnly">
                    <button @click="showStatistics = !showStatistics" class="btn" :class="{ active: showStatistics }">
                        📊 Statistics
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Scheduler Grid -->
        <div class="scheduler-content">
            <SchedulerGrid
                :periods="periods"
                :school-days="schoolDays"
                :courses="courses"
                :teachers="teachers"
                :classes="classes"
                :rooms="rooms"
                :subjects="subjects"
                :draft-schedules="draftSchedules"
                :live-schedules="liveSchedules"
                :conflicts="allConflicts"
                :can-undo="canUndo"
                :is-saving="isSaving"
                :is-read-only="isReadOnly"
                :is-live-mode="isLiveMode"
                :show-statistics="showStatistics"
                :parent-emit="$emit"
                :emit-drop-events="true"
                @cell-click="handleCellClick"
                @assignment-details="handleAssignmentDetails"
                @course-edit="handleCourseEdit"
                @scheduler-drop="handleSchedulerDrop"
                @scheduler-drag-start="handleSchedulerDragStart"
                @scheduler-drag-end="handleSchedulerDragEnd"
                @undo-last="undo"
                @save-draft="saveDraft"
                @update-assignments="updateAssignments"
            />
        </div>

        <!-- Assignment Modal -->
        <AssignmentModal
            :visible="showAssignmentModal"
            :day-id="selectedCell.dayId"
            :period-id="selectedCell.periodId"
            :period="selectedCell.period"
            :courses="availableCoursesForSlot"
            :teachers="teachers"
            :classes="classes"
            :rooms="rooms"
            :subjects="subjects"
            :school-days="schoolDays"
            :existing-assignments="selectedCell.assignments"
            :conflicts="selectedCell.conflicts"
            :is-read-only="isReadOnly"
            :pre-selected-course="selectedCell.preSelectedCourse"
            @close="closeAssignmentModal"
            @add-assignment="addAssignment"
            @edit-assignment="editAssignment"
            @remove-assignment="removeAssignment"
        />

        <!-- Conflict Panel -->
        <div v-if="showConflicts && safeLength(allConflicts) > 0" class="conflicts-sidebar">
            <ConflictPanel
                :visible="showConflicts"
                :conflicts="allConflicts"
                :courses="courses"
                :teachers="teachers"
                :classes="classes"
                :rooms="rooms"
                :periods="periods"
                :school-days="schoolDays"
                @close="showConflicts = false"
                @navigate-to-conflict="navigateToConflict"
                @apply-suggestion="applySuggestion"
                @ignore-conflict="ignoreConflict"
                @auto-resolve-all="autoResolveConflicts"
            />
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import SchedulerGrid from './components/scheduler/SchedulerGrid.vue';
import AssignmentModal from './components/scheduler/AssignmentModal.vue';
import ConflictPanel from './components/scheduler/ConflictPanel.vue';

// Minimal imports; you said filtering is external
import { toArray, nonEmpty, normalizePeriods, normalizeCourse } from './utils/arrayUtils.js';
import { emitSchedulerRemoveEvent } from './utils/events.js';
import { detectConflicts } from './utils/conflictDetection.js';
import { useSchedulerStore } from './state/schedulerState';

export default {
    name: 'CourseScheduler',
    components: { SchedulerGrid, AssignmentModal, ConflictPanel },
    props: {
        content: {
            type: Object,
            required: true,
            default: () => ({
                periods: [],
                courses: [],
                teachers: [],
                classes: [],
                rooms: [],
                schoolDays: [],
                draftSchedules: [],
                liveSchedules: [],
                subjects: [],
                emitDropEvents: false,
                mode: 'planner',
            }),
        },
        draftSchedules: { type: [Array, Object], default: () => [] },
        draftSchedule: { type: [Array, Object], default: () => [] },
        wwElementState: { type: Object, required: true },
    },
    setup(props, { emit }) {
        const safeLength = v => (Array.isArray(v) ? v.length : 0);

        const store = useSchedulerStore();
        watch(
            () => props.content,
            newContent => {
                if (newContent && store?.initialize) {
                    store.initialize(null, null, null, {
                        periods: toArray(newContent.periods),
                        draftSchedules: toArray(newContent.draftSchedules),
                    });
                }
            },
            { immediate: true, deep: true }
        );

        // UI state
        const showAssignmentModal = ref(false);
        const showConflicts = ref(false);
        const showStatistics = ref(true);
        const isSaving = ref(false);

        // Undo
        const undoStack = ref([]);
        const maxUndoSteps = 10;

        // Selected cell
        const selectedCell = ref({
            dayId: null,
            periodId: null,
            period: null,
            assignments: [],
            conflicts: [],
            preSelectedCourse: null,
        });

        // Data (already filtered upstream)
        const periods = computed(() => {
            const normalized = normalizePeriods(props.content.periods);
            return nonEmpty(normalized) ? normalized : [];
        });
        const courses = computed(() =>
            toArray(props.content.courses).map((course, idx) => normalizeCourse(course, idx))
        );
        const teachers = computed(() => toArray(props.content.teachers));
        const classes = computed(() => toArray(props.content.classes));
        const rooms = computed(() => toArray(props.content.rooms));
        const subjects = computed(() => toArray(props.content.subjects));

        const schoolDays = computed(() => {
            const validatedDays = toArray(props.content.schoolDays);
            if (!nonEmpty(validatedDays)) return [];
            const defaultDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return validatedDays.map((day, index) => {
                const dayName = day.name || day.name_en || day.day_name || defaultDayNames[index] || `Day ${index + 1}`;
                return {
                    ...day,
                    id: day.day_id || day.id,
                    name: dayName,
                    date: day.date || day.day_date || null,
                    is_active: day.is_active !== undefined ? day.is_active : true,
                    day_number: day.day_number || index + 1,
                    day_id: day.day_id || day.id,
                };
            });
        });

        // Prefer direct draft props; fallback to content
        const draftSchedules = computed(() => {
            const propA = toArray(props.draftSchedules);
            const propB = toArray(props.draftSchedule);
            const fromProp = nonEmpty(propA) ? propA : propB;
            const source = nonEmpty(fromProp) ? fromProp : toArray(props.content.draftSchedules);

            // Minimal normalization + dedupe
            const normalized = source
                .filter(v => v && typeof v === 'object')
                .map(n => {
                    const fallbackId = `${n.class_id ?? ''}:${n.day_id ?? ''}:${n.period_id ?? ''}`;
                    const id = String(n.id ?? fallbackId);
                    return {
                        ...n,
                        id,
                        isDraft: n.isDraft === false ? false : true,
                        day_id: Number(n.day_id ?? 0),
                        period_id: String(n.period_id ?? ''),
                    };
                });

            const byId = new Map();
            for (const item of normalized) byId.set(item.id, item);
            return Array.from(byId.values());
        });

        const liveSchedules = computed(() => toArray(props.content.liveSchedules));

        // Flags
        const isReadOnly = computed(() => false);
        const isLiveMode = computed(() => props.content.mode === 'live');
        const canUndo = computed(() => safeLength(undoStack.value) > 0);

        // Conflicts
        const allConflicts = computed(() => detectConflicts(draftSchedules.value));

        // Courses available for selected slot (leave as-is; upstream filtering already applied)
        const availableCoursesForSlot = computed(() => courses.value);

        // Methods
        function saveToUndoStack() {
            undoStack.value.push(JSON.stringify(draftSchedules.value));
            if (safeLength(undoStack.value) > maxUndoSteps) undoStack.value.shift();
        }

        function handleCellClick({ dayId, periodId, period, preSelectedCourse }) {
            if (isReadOnly.value) return;

            const assignments = draftSchedules.value.filter(a => a.day_id === dayId && a.period_id === periodId);
            const conflicts = allConflicts.value.filter(c => c.day_id === dayId && c.period_id === periodId);

            selectedCell.value = {
                dayId,
                periodId,
                period,
                assignments,
                conflicts,
                preSelectedCourse,
            };
            showAssignmentModal.value = true;
        }

        function closeAssignmentModal() {
            showAssignmentModal.value = false;
            selectedCell.value = {
                dayId: null,
                periodId: null,
                period: null,
                assignments: [],
                conflicts: [],
                preSelectedCourse: null,
            };
        }

        function addAssignment(newAssignment) {
            saveToUndoStack();
            updateDraftSchedules([...draftSchedules.value, newAssignment]);
            closeAssignmentModal();
        }

        function editAssignment(assignment) {
            closeAssignmentModal();
            emit('edit-assignment-requested', assignment);
        }

        function removeAssignment(assignmentToRemove) {
            saveToUndoStack();

            if (props.content.emitDropEvents) {
                emitSchedulerRemoveEvent(emit, {
                    dayId: assignmentToRemove.day_id,
                    periodId: assignmentToRemove.period_id,
                    assignmentId: assignmentToRemove.id,
                    courseId: assignmentToRemove.course_id,
                    courseName: assignmentToRemove.course_name || assignmentToRemove.display_cell || '',
                });
            }

            const updated = draftSchedules.value.filter(
                a =>
                    !(
                        a.day_id === assignmentToRemove.day_id &&
                        a.period_id === assignmentToRemove.period_id &&
                        a.course_id === assignmentToRemove.course_id &&
                        a.class_id === assignmentToRemove.class_id
                    )
            );
            updateDraftSchedules(updated);
        }

        function updateDraftSchedules(newSchedules) {
            emit('trigger-event', {
                name: 'updateDraftSchedules',
                event: { draftSchedules: newSchedules },
            });
        }

        function undo() {
            if (!safeLength(undoStack.value)) return;
            const prev = JSON.parse(undoStack.value.pop());
            updateDraftSchedules(prev);
        }

        async function saveDraft() {
            if (isReadOnly.value) return;

            isSaving.value = true;
            try {
                emit('trigger-event', {
                    name: 'saveDraft',
                    event: {
                        schedules: draftSchedules.value,
                        timestamp: new Date().toISOString(),
                        action: 'save_draft',
                    },
                });

                emit('save-draft-external', {
                    schedules: draftSchedules.value,
                    timestamp: new Date().toISOString(),
                });

                await new Promise(r => setTimeout(r, 500));
                console.log('💾 Draft saved');
            } catch (e) {
                console.error('❌ saveDraft failed:', e);
            } finally {
                isSaving.value = false;
            }
        }

        function handleAssignmentDetails(assignment) {
            emit('trigger-event', {
                name: 'scheduler:assignment-details',
                event: {
                    assignment,
                    courseId: assignment.course_id || '',
                    courseName: assignment.course_name || assignment.display_cell || '',
                    courseCode: assignment.course_code || '',
                    teacherIds: assignment.teacher_ids || [],
                    roomId: assignment.room_id || null,
                    dayId: assignment.day_id || 0,
                    periodId: assignment.period_id || '',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        function handleCourseEdit(courseData) {
            emit('trigger-event', {
                name: 'scheduler:course-edit',
                event: {
                    courseId: courseData.courseId || '',
                    courseName: courseData.courseName || '',
                    courseCode: courseData.courseCode || '',
                    source: courseData.source || 'inline-editor',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // WeWeb Events passthrough
        function handleSchedulerDrop(eventData) {
            const safeEventData = {
                dayId: eventData?.dayId || 0,
                periodId: eventData?.periodId || '',
                courseId: eventData?.courseId || '',
                courseName: eventData?.courseName || '',
                courseCode: eventData?.courseCode || '',
                teacherIds: Array.isArray(eventData?.teacherIds) ? eventData.teacherIds : [],
                primaryTeacherId: eventData?.primaryTeacherId || null,
                roomId: eventData?.roomId || null,
                source: eventData?.source || 'drag-drop',
                timestamp: eventData?.timestamp || new Date().toISOString(),
                ...(eventData?.fromDayId !== undefined && { fromDayId: eventData.fromDayId }),
                ...(eventData?.fromPeriodId !== undefined && { fromPeriodId: eventData.fromPeriodId }),
                ...(eventData?.action !== undefined && { action: eventData.action }),
            };

            try {
                emit('trigger-event', { name: 'scheduler:drop', event: safeEventData });
            } catch (error) {
                console.error('❌ scheduler:drop emission failed:', error);
            }
        }

        function handleSchedulerDragStart(eventData) {
            const safeEventData = {
                courseId: eventData?.courseId || '',
                courseName: eventData?.courseName || '',
                courseCode: eventData?.courseCode || '',
                source: eventData?.source || 'drag-start',
                timestamp: eventData?.timestamp || new Date().toISOString(),
            };

            try {
                emit('trigger-event', { name: 'scheduler:drag-start', event: safeEventData });
            } catch (error) {
                console.error('❌ scheduler:drag-start emission failed:', error);
            }
        }

        function handleSchedulerDragEnd(eventData) {
            const safeEventData = {
                courseId: eventData?.courseId || '',
                courseName: eventData?.courseName || '',
                courseCode: eventData?.courseCode || '',
                success: eventData?.success !== undefined ? eventData.success : false,
                source: eventData?.source || 'drag-end',
                timestamp: eventData?.timestamp || new Date().toISOString(),
            };

            try {
                emit('trigger-event', { name: 'scheduler:drag-end', event: safeEventData });
            } catch (error) {
                console.error('❌ scheduler:drag-end emission failed:', error);
            }
        }

        function updateAssignments(payload) {
            if (payload.action === 'move' && payload.assignment) {
                const updated = [...draftSchedules.value];
                const idx = updated.findIndex(a => a.id === payload.assignment.id);
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        day_id: payload.toDayId,
                        period_id: payload.toPeriodId,
                        day_name_de: schoolDays.value.find(d => d.id === payload.toDayId)?.name_de,
                        day_name_en: schoolDays.value.find(d => d.id === payload.toDayId)?.name_en,
                    };
                    undoStack.value.push(JSON.stringify(draftSchedules.value));
                    updateDraftSchedules(updated);
                } else {
                    console.warn('⚠️ Move: assignment not found:', payload.assignment.id);
                }
            } else {
                updateDraftSchedules(payload);
            }
        }

        function navigateToConflict(conflict) {
            selectedCell.value = {
                dayId: conflict.day_id,
                periodId: conflict.period_id,
                period: periods.value.find(p => p.id === conflict.period_id),
                assignments: draftSchedules.value.filter(
                    a => a.day_id === conflict.day_id && a.period_id === conflict.period_id
                ),
                conflicts: [conflict],
                preSelectedCourse: null,
            };
            showAssignmentModal.value = true;
            showConflicts.value = false;
        }

        function applySuggestion(suggestion) {
            emit('trigger-event', { name: 'applySuggestion', event: { suggestion } });
        }

        function ignoreConflict(conflict) {
            emit('trigger-event', { name: 'ignoreConflict', event: { conflictId: conflict.id } });
        }

        function autoResolveConflicts() {
            emit('trigger-event', {
                name: 'autoResolveConflicts',
                event: { conflicts: allConflicts.value.filter(c => c.auto_resolvable) },
            });
        }

        // Auto-save (debounced)
        let saveTimeout;
        watch(
            draftSchedules,
            () => {
                if (isReadOnly.value) return;
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => saveDraft(), 2000);
            },
            { deep: true }
        );

        onMounted(() => {
            console.log('🚀 Course Scheduler mounted');
        });

        // Keep store hints in sync when external draft props change
        watch(
            () => [props.draftSchedules, props.draftSchedule],
            () => {
                if (store?.initialize) {
                    store.initialize(null, null, null, {
                        periods: toArray(props.content.periods),
                        draftSchedules: draftSchedules.value,
                    });
                }
            },
            { immediate: true, deep: true }
        );

        return {
            // Data
            periods,
            courses,
            teachers,
            classes,
            rooms,
            schoolDays,
            draftSchedules,
            liveSchedules,
            subjects,

            // State
            showAssignmentModal,
            showConflicts,
            showStatistics,
            isSaving,
            selectedCell,

            // Flags
            isReadOnly,
            isLiveMode,
            canUndo,

            // Derived
            allConflicts,
            availableCoursesForSlot,

            // Methods
            handleCellClick,
            closeAssignmentModal,
            addAssignment,
            editAssignment,
            removeAssignment,
            updateAssignments,
            undo,
            saveDraft,
            handleAssignmentDetails,
            handleCourseEdit,
            handleSchedulerDrop,
            handleSchedulerDragStart,
            handleSchedulerDragEnd,
            navigateToConflict,
            applySuggestion,
            ignoreConflict,
            autoResolveConflicts,

            // Utils
            safeLength,
        };
    },
};
</script>

<style lang="scss" scoped>
.course-scheduler-wrapper {
    width: 100%;
    min-height: 500px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
}

.scheduler-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 6px 6px 0 0;

    h2 {
        margin: 0;
        color: #333;
        font-size: 1.1em;
    }

    .scheduler-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .mode-indicator {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: 500;
        background: #e6f7ff;
        color: #1890ff;

        &.read-only {
            background: #fff2f0;
            color: #ff4d4f;
        }
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn {
        background: #eef1f5;
        color: #333;
        border: 1px solid #dcdfe6;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
    }

    .btn.active {
        background: #fff0f0;
        border-color: #ffcccc;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.scheduler-content {
    padding: 12px 0;
}

.conflicts-sidebar {
    position: fixed;
    top: 80px;
    right: 16px;
    width: 360px;
    max-height: calc(100vh - 100px);
    overflow: auto;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 6px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    padding: 12px;
}

/* Make the circled “Grade Slots” area (inner stats) a bit bigger.
   This assumes the inner block has .grade-stats. If it doesn't,
   add that class in SchedulerGrid (see snippet below). */
::v-deep(.grade-stats),
::v-deep(.grade-stats table),
::v-deep(.grade-stats td),
::v-deep(.grade-stats th),
::v-deep(.grade-stats input) {
    font-size: 13.5px; /* slightly larger */
    line-height: 1.25;
}

/* Responsive tweaks */
@media (max-width: 900px) {
    .conflicts-sidebar {
        position: static;
        width: 100%;
        max-height: none;
        box-shadow: none;
    }
}
</style>
