<template>
    <div class="period-grid" role="grid" aria-label="Weekly schedule by period">
        <!-- Header row with days -->
        <div class="period-grid-header" role="row">
            <div class="period-header-cell period-label-cell" role="columnheader">Period</div>
            <div
                v-for="(day, index) in days"
                :key="day.id"
                class="period-header-cell"
                role="columnheader"
                :aria-colindex="index + 1"
            >
                {{ day.name }}
            </div>
        </div>

        <!-- Grid rows for each period -->
        <div
            v-for="(period, periodIndex) in periods"
            :key="period.id"
            class="period-grid-row"
            role="row"
            :aria-rowindex="periodIndex + 1"
        >
            <!-- Period label -->
            <div class="period-label-cell" role="rowheader">
                <div class="period-name">{{ period.name }}</div>
                <div class="period-time">{{ formatTime(period.start_time) }} - {{ formatTime(period.end_time) }}</div>
            </div>

            <!-- Cells for each day -->
            <div
                v-for="day in days"
                :key="`${period.id}-${day.id}`"
                class="period-cell"
                :class="{ 'has-entry': hasEntry(day.id, period.id) }"
                role="gridcell"
                tabindex="0"
                @click="handleCellClick(day.id, period.id, period)"
                @keydown.enter="handleCellClick(day.id, period.id, period)"
                @dblclick="showPeriodDetails(day.id, period.id)"
            >
                <template v-if="getEntry(day.id, period.id)">
                    <div class="entry-content" :style="{ borderLeft: `4px solid ${getEntryColor(day.id, period.id)}` }">
                        <div class="entry-course">{{ getEntryCourseName(day.id, period.id) }}</div>
                        <div class="entry-details">
                            <span class="entry-room">{{ getEntryRoomName(day.id, period.id) }}</span>
                            <span class="entry-teachers">{{ getEntryTeacherNames(day.id, period.id) }}</span>
                        </div>
                        <button
                            class="remove-entry"
                            @click.stop="removeEntry(day.id, period.id)"
                            aria-label="Remove entry"
                        >
                            ×
                        </button>
                        <button
                            class="detail-entry"
                            @click.stop="showPeriodDetails(day.id, period.id)"
                            aria-label="View period details"
                            title="Double-click for details"
                        >
                            📋
                        </button>
                    </div>
                </template>
                <div v-else class="empty-cell">
                    <span class="add-icon">+</span>
                    <span class="add-text">Click to add course</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Course Selection Modal -->
    <CourseSelectionModal
        v-if="showCourseSelectionModal && modalSlotData"
        :dayId="modalSlotData.dayId"
        :dayName="modalSlotData.dayName"
        :periodId="modalSlotData.periodId"
        :periodName="modalSlotData.periodName"
        :availableCourses="modalSlotData.availableCourses"
        @submit="handleCourseSelection"
        @cancel="handleCourseSelectionCancel"
    />

    <!-- Teacher/Room Selection Modal -->
    <TeacherRoomSelectionModal
        v-if="showTeacherRoomModal && modalCourseData"
        :courseId="modalCourseData.courseId"
        :courseName="modalCourseData.courseName"
        :dayId="modalCourseData.dayId"
        :periodId="modalCourseData.periodId"
        :draftId="draftId"
        :schoolId="schoolId"
        :teachers="teachers"
        :rooms="rooms"
        @submit="handleTeacherRoomSubmit"
        @cancel="handleTeacherRoomCancel"
    />
</template>

<script>
import { ref } from 'vue';
import { useGridLogic } from '../../composables/useGridLogic';
import { useSchedulerState } from '../../composables/useSchedulerState';
import CourseSelectionModal from './CourseSelectionModal.vue';
import TeacherRoomSelectionModal from './TeacherRoomSelectionModal.vue';

export default {
    name: 'PeriodGrid',
    components: {
        CourseSelectionModal,
        TeacherRoomSelectionModal,
    },
    props: {
        days: {
            type: Array,
            default: () => [],
        },
        courses: {
            type: Array,
            default: () => [],
        },
        rooms: {
            type: Array,
            default: () => [],
        },
        teachers: {
            type: Array,
            default: () => [],
        },
        classes: {
            type: Array,
            default: () => [],
        },
        schoolId: {
            type: String,
            required: true,
        },
        draftId: {
            type: String,
            required: true,
        },
    },
    emits: ['add-entry', 'show-period-details'],
    setup(props, { emit }) {
        // Use new composables
        const { periods, entries, removeEntry: storeRemoveEntry } = useSchedulerState();

        const {
            hasEntry,
            getEntry,
            getEntryCourseName,
            getEntryRoomName,
            getEntryTeacherNames,
            getEntryColor,
            formatTime,
            getAvailableCoursesForSlot,
        } = useGridLogic(props);

        // Modal state
        const showCourseSelectionModal = ref(false);
        const showTeacherRoomModal = ref(false);
        const modalCourseData = ref(null);
        const modalSlotData = ref(null);

        async function handleCellClick(dayId, periodId, period) {
            const existingEntry = getEntry(dayId, periodId);

            if (existingEntry) {
                // If entry exists, emit event to edit it (keep existing behavior)
                emit('add-entry', {
                    isEdit: true,
                    entry: existingEntry,
                    period,
                });
            } else {
                // Open course selection modal for empty cells
                openCourseSelectionModal(dayId, periodId, period);
            }
        }

        function removeEntry(dayId, periodId) {
            const entry = getEntry(dayId, periodId);
            if (entry) {
                const index = entries.value.indexOf(entry);
                if (index !== -1) {
                    storeRemoveEntry(index);
                }
            }
        }

        function showPeriodDetails(dayId, periodId) {
            emit('show-period-details', { dayId, periodId });
        }

        // Modal handlers
        function openCourseSelectionModal(dayId, periodId, period) {
            const day = props.days.find(d => d.id === dayId);
            const availableCourses = getAvailableCoursesForSlot(dayId, periodId);

            modalSlotData.value = {
                dayId,
                periodId,
                dayName: day ? day.name : `Day ${dayId}`,
                periodName: period.name,
                period,
                availableCourses,
            };

            showCourseSelectionModal.value = true;
        }

        function handleCourseSelection(courseData) {
            showCourseSelectionModal.value = false;

            // Store the course data and open teacher/room selection
            modalCourseData.value = {
                courseId: courseData.courseId,
                courseName: courseData.courseName,
                courseCode: courseData.courseCode,
                dayId: courseData.dayId,
                periodId: courseData.periodId,
            };

            showTeacherRoomModal.value = true;
        }

        function handleCourseSelectionCancel() {
            showCourseSelectionModal.value = false;
            modalSlotData.value = null;
        }

        function handleTeacherRoomSubmit(data) {
            showTeacherRoomModal.value = false;
            modalCourseData.value = null;

            // Emit the final assignment data to be added to the schedule
            emit('add-entry', {
                isEdit: false,
                assignmentData: data,
                conflicts: [],
            });
        }

        function handleTeacherRoomCancel() {
            showTeacherRoomModal.value = false;
            modalCourseData.value = null;
        }

        return {
            periods,
            formatTime,
            hasEntry,
            getEntry,
            getEntryCourseName,
            getEntryRoomName,
            getEntryTeacherNames,
            getEntryColor,
            handleCellClick,
            removeEntry,
            showPeriodDetails,
            // Modal state
            showCourseSelectionModal,
            showTeacherRoomModal,
            modalCourseData,
            modalSlotData,
            // Modal handlers
            handleCourseSelection,
            handleCourseSelectionCancel,
            handleTeacherRoomSubmit,
            handleTeacherRoomCancel,
        };
    },
};
</script>

<style scoped>
.period-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.period-grid-header {
    display: flex;
    background-color: #f5f5f5;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
}

.period-header-cell {
    flex: 1;
    padding: 12px;
    text-align: center;
    border-right: 1px solid #ddd;
}

.period-header-cell:last-child {
    border-right: none;
}

.period-grid-row {
    display: flex;
    border-bottom: 1px solid #ddd;
}

.period-grid-row:last-child {
    border-bottom: none;
}

.period-label-cell {
    width: 120px;
    padding: 12px;
    background-color: #f9f9f9;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.period-name {
    font-weight: 500;
}

.period-time {
    font-size: 0.85em;
    color: #666;
    margin-top: 4px;
}

.period-cell {
    flex: 1;
    min-height: 80px;
    border-right: 1px solid #ddd;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
}

.period-cell:last-child {
    border-right: none;
}

.period-cell:hover {
    background-color: #f0f7ff;
}

.empty-cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #ccc;
    gap: 4px;
}

.add-icon {
    font-size: 24px;
    opacity: 0.5;
}

.add-text {
    font-size: 0.75em;
    opacity: 0.7;
}

.has-entry {
    background-color: #e6f7ff;
}

.entry-content {
    padding: 8px;
    height: 100%;
    position: relative;
}

.entry-course {
    font-weight: 500;
    margin-bottom: 4px;
}

.entry-details {
    font-size: 0.85em;
    color: #666;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.remove-entry {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #ff4d4f;
    color: white;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.detail-entry {
    position: absolute;
    top: 4px;
    right: 28px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #1890ff;
    color: white;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.entry-content:hover .remove-entry,
.entry-content:hover .detail-entry {
    opacity: 1;
}
</style>
