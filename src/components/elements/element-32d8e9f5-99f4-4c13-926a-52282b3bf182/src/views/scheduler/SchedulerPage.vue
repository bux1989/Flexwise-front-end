<template>
    <div class="scheduler-page">
        <h1 class="scheduler-title">Course Scheduler</h1>

        <SchedulerToolbar
            :teachers="teachers"
            :classes="classes"
            :rooms="rooms"
            @open-publish-dialog="showPublishDialog = true"
        />

        <div class="scheduler-content">
            <div class="scheduler-grid">
                <!-- Period Grid View -->
                <PeriodGrid
                    v-if="viewMode === 'period'"
                    :days="days"
                    :courses="courses"
                    :rooms="rooms"
                    :teachers="teachers"
                    :classes="classes"
                    :schoolId="schoolId"
                    :draftId="draftId"
                    @add-entry="openEntryForm"
                    @show-period-details="showPeriodDetail"
                />

                <!-- Time Grid View -->
                <TimeGrid
                    v-else
                    :days="days"
                    :courses="courses"
                    :rooms="rooms"
                    :teachers="teachers"
                    @add-entry="openEntryForm"
                />
            </div>

            <div class="draft-panel">
                <div class="draft-panel-header">
                    <h2>Draft Entries</h2>
                    <span class="entry-count">{{ entries.length }} entries</span>
                </div>

                <div class="draft-entries">
                    <div v-for="(entry, index) in entries" :key="index" class="draft-entry">
                        <div class="entry-day">{{ getDayName(entry.day_id) }}</div>
                        <div class="entry-time">
                            <template v-if="entry.schedule_type === 'period'">
                                {{ getPeriodName(entry.period_id) }}
                            </template>
                            <template v-else>
                                {{ formatTime(entry.start_time) }} - {{ formatTime(entry.end_time) }}
                            </template>
                        </div>
                        <div class="entry-title">
                            {{ getEntryTitle(entry) }}
                        </div>
                        <div class="entry-actions">
                            <button
                                class="edit-entry"
                                @click="openEntryForm({ isEdit: true, entry })"
                                aria-label="Edit entry"
                            >
                                Edit
                            </button>
                            <button class="remove-entry" @click="removeEntry(index)" aria-label="Remove entry">
                                ×
                            </button>
                        </div>
                    </div>

                    <div v-if="entries.length === 0" class="no-entries">
                        No entries in this draft yet. Click on the grid to add entries.
                    </div>
                </div>
            </div>
        </div>

        <!-- Entry Form Dialog -->
        <div v-if="showEntryForm" class="entry-form-overlay" @click="closeEntryForm">
            <div class="entry-form" @click.stop>
                <div class="entry-form-header">
                    <h2>{{ isEditingEntry ? 'Edit Entry' : 'Add Entry' }}</h2>
                    <button class="close-button" @click="closeEntryForm">×</button>
                </div>

                <div class="entry-form-content">
                    <div v-if="conflicts.length > 0" class="conflicts-warning">
                        <h3>Conflicts Detected</h3>
                        <ul>
                            <li v-for="(conflict, index) in conflicts" :key="index">
                                {{ conflict.message || 'Scheduling conflict' }}
                            </li>
                        </ul>
                    </div>

                    <div class="form-group">
                        <label for="entry-type">Schedule Type</label>
                        <select id="entry-type" v-model="entryForm.schedule_type" disabled>
                            <option value="period">Period</option>
                            <option value="adhoc">Time</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="entry-day">Day</label>
                        <select id="entry-day" v-model="entryForm.day_id">
                            <option v-for="day in days" :key="day.id" :value="day.id">
                                {{ day.name }}
                            </option>
                        </select>
                    </div>

                    <template v-if="entryForm.schedule_type === 'period'">
                        <div class="form-group">
                            <label for="entry-period">Period</label>
                            <select id="entry-period" v-model="entryForm.period_id">
                                <option v-for="period in periods" :key="period.id" :value="period.id">
                                    {{ period.name }} ({{ formatTime(period.start_time) }} -
                                    {{ formatTime(period.end_time) }})
                                </option>
                            </select>
                        </div>
                    </template>

                    <template v-else>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="entry-start-time">Start Time</label>
                                <input type="time" id="entry-start-time" v-model="entryForm.start_time" step="900" />
                            </div>

                            <div class="form-group">
                                <label for="entry-end-time">End Time</label>
                                <input type="time" id="entry-end-time" v-model="entryForm.end_time" step="900" />
                            </div>
                        </div>
                    </template>

                    <div class="form-group">
                        <label for="entry-course">Course</label>
                        <select id="entry-course" v-model="entryForm.course_id">
                            <option value="">Select Course</option>
                            <option v-for="course in courses" :key="course.id" :value="course.id">
                                {{ course.name }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="entry-class">Class</label>
                        <select id="entry-class" v-model="entryForm.class_id">
                            <option value="">Select Class</option>
                            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                                {{ cls.name }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Teachers</label>
                        <div class="teacher-checkboxes">
                            <div v-for="teacher in teachers" :key="teacher.id" class="teacher-checkbox">
                                <input
                                    type="checkbox"
                                    :id="`teacher-${teacher.id}`"
                                    :value="teacher.id"
                                    v-model="entryForm.teacher_ids"
                                />
                                <label :for="`teacher-${teacher.id}`">{{ teacher.name }}</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="entry-room">Room</label>
                        <select id="entry-room" v-model="entryForm.room_id">
                            <option value="">Select Room</option>
                            <option v-for="room in rooms" :key="room.id" :value="room.id">
                                {{ room.name }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="entry-meeting-name">Meeting Name (optional)</label>
                        <input
                            type="text"
                            id="entry-meeting-name"
                            v-model="entryForm.meeting_name"
                            placeholder="Enter meeting name"
                        />
                    </div>

                    <div class="form-group">
                        <label for="entry-notes">Notes (optional)</label>
                        <textarea
                            id="entry-notes"
                            v-model="entryForm.notes"
                            placeholder="Enter any additional notes"
                            rows="3"
                        ></textarea>
                    </div>
                </div>

                <div class="entry-form-footer">
                    <button class="cancel-button" @click="closeEntryForm">Cancel</button>
                    <button class="save-button" @click="saveEntry" :disabled="!isEntryFormValid">
                        {{ isEditingEntry ? 'Update' : 'Add' }} Entry
                    </button>
                </div>
            </div>
        </div>

        <!-- Publish Dialog -->
        <PublishDialog v-if="showPublishDialog" @close="showPublishDialog = false" />

        <!-- Period Details Dialog -->
        <div v-if="showPeriodDetails" class="entry-form-overlay" @click="closePeriodDetails">
            <div class="entry-form" @click.stop>
                <div class="entry-form-header">
                    <h2 v-if="selectedPeriodDetails">
                        {{ selectedPeriodDetails.day?.name }} - {{ selectedPeriodDetails.period?.name }}
                    </h2>
                    <button class="close-button" @click="closePeriodDetails">×</button>
                </div>

                <div class="entry-form-content" v-if="selectedPeriodDetails">
                    <div class="period-info">
                        <p>
                            <strong>Time:</strong> {{ formatTime(selectedPeriodDetails.period?.start_time) }} -
                            {{ formatTime(selectedPeriodDetails.period?.end_time) }}
                        </p>
                    </div>

                    <div class="assignments-section">
                        <h3>Assigned Courses ({{ selectedPeriodDetails.assignments?.length || 0 }})</h3>

                        <div v-if="selectedPeriodDetails.assignments?.length > 0" class="assignment-list">
                            <div
                                v-for="(assignment, index) in selectedPeriodDetails.assignments"
                                :key="index"
                                class="assignment-item"
                                :style="{
                                    borderLeft: `4px solid ${getAssignmentDisplay(assignment).courseColor}`,
                                }"
                            >
                                <div class="assignment-course">
                                    <span class="course-name">{{ getAssignmentDisplay(assignment).courseName }}</span>
                                    <span v-if="getAssignmentDisplay(assignment).className" class="class-name">
                                        - {{ getAssignmentDisplay(assignment).className }}
                                    </span>
                                </div>
                                <div v-if="getAssignmentDisplay(assignment).teacherName" class="assignment-teacher">
                                    <strong>Teacher:</strong> {{ getAssignmentDisplay(assignment).teacherName }}
                                </div>
                                <div v-if="getAssignmentDisplay(assignment).roomName" class="assignment-room">
                                    <strong>Room:</strong> {{ getAssignmentDisplay(assignment).roomName }}
                                </div>
                                <div class="assignment-actions">
                                    <button
                                        class="edit-entry"
                                        @click="openEntryForm({ isEdit: true, entry: assignment })"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        class="remove-entry"
                                        @click="
                                            removeCourseFromSlot({
                                                dayId: selectedPeriodDetails.dayId,
                                                periodId: selectedPeriodDetails.periodId,
                                            })
                                        "
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-else class="no-assignments">No courses assigned to this period yet.</div>
                    </div>

                    <div class="available-courses-section">
                        <h3>Available Courses</h3>
                        <div class="course-list">
                            <button
                                v-for="course in courses"
                                :key="course.id"
                                class="course-button"
                                :style="{
                                    backgroundColor: course.color || '#f0f0f0',
                                    color: course.color ? '#fff' : '#333',
                                }"
                                @click="
                                    assignCourseToSlot(
                                        {
                                            dayId: selectedPeriodDetails.dayId,
                                            periodId: selectedPeriodDetails.periodId,
                                        },
                                        course.id
                                    )
                                "
                            >
                                {{ course.name }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useSchedulerStore } from '../../pinia/scheduler';
import SchedulerToolbar from '../../components/scheduler/SchedulerToolbar.vue';
import PeriodGrid from '../../components/scheduler/PeriodGrid.vue';
import TimeGrid from '../../components/scheduler/TimeGrid.vue';
import PublishDialog from '../../components/scheduler/PublishDialog.vue';

export default {
    name: 'SchedulerPage',
    components: {
        SchedulerToolbar,
        PeriodGrid,
        TimeGrid,
        PublishDialog,
    },
    props: {
        schoolId: {
            type: String,
            required: true,
        },
        draftId: {
            type: String,
            required: true,
        },
        publishedBy: {
            type: String,
            default: null,
        },
        periods: {
            type: Array,
            default: () => [],
        },
        courses: {
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
        rooms: {
            type: Array,
            default: () => [],
        },
        schoolDays: {
            type: Array,
            default: () => [],
        },
        draftSchedules: {
            type: Array,
            default: () => [],
        },
        liveSchedules: {
            type: Array,
            default: () => [],
        },
    },
    setup(props, { emit }) {
        const store = useSchedulerStore();

        // Use props data instead of mock data
        const days = computed(() => props.schoolDays || []);
        const courses = computed(() => props.courses || []);
        const teachers = computed(() => props.teachers || []);
        const classes = computed(() => props.classes || []);
        const rooms = computed(() => props.rooms || []);
        const periods = computed(() => props.periods || []);

        // UI state
        const showEntryForm = ref(false);
        const showPublishDialog = ref(false);
        const isEditingEntry = ref(false);
        const entryForm = ref(createEmptyEntry());
        const conflicts = ref([]);
        const showPeriodDetails = ref(false);
        const selectedPeriodDetails = ref(null);

        // Store state
        const viewMode = computed(() => store.viewMode);
        const entries = computed(() => props.draftSchedules || []);

        // Initialize store with props data
        onMounted(() => {
            store.initialize(props.schoolId, props.draftId, props.publishedBy, {
                periods: props.periods,
                courses: props.courses,
                teachers: props.teachers,
                classes: props.classes,
                rooms: props.rooms,
                schoolDays: props.schoolDays,
                draftSchedules: props.draftSchedules,
                liveSchedules: props.liveSchedules,
            });
        });

        // Watch for props changes and emit updates
        watch(
            entries,
            newEntries => {
                emit('update-draft-schedules', newEntries);
            },
            { deep: true }
        );

        // Watch for prop changes and update store
        watch(
            () => [
                props.periods,
                props.courses,
                props.teachers,
                props.classes,
                props.rooms,
                props.schoolDays,
                props.draftSchedules,
                props.liveSchedules,
            ],
            ([periods, courses, teachers, classes, rooms, schoolDays, draftSchedules, liveSchedules]) => {
                store.updateData({
                    periods,
                    courses,
                    teachers,
                    classes,
                    rooms,
                    schoolDays,
                    draftSchedules,
                    liveSchedules,
                });
            },
            { deep: true }
        );

        // Form validation
        const isEntryFormValid = computed(() => {
            const form = entryForm.value;

            // Basic validation
            if (form.schedule_type === 'period' && !form.period_id) return false;
            if (form.schedule_type === 'adhoc' && (!form.start_time || !form.end_time)) return false;
            if (!form.course_id && !form.meeting_name) return false;
            if (!form.teacher_ids.length) return false;
            if (!form.room_id) return false;

            return true;
        });

        // Helper functions
        function createEmptyEntry() {
            return {
                schedule_type: 'period',
                day_id: 1, // Monday
                period_id: null,
                start_time: null,
                end_time: null,
                course_id: '',
                subject_id: null,
                class_id: '',
                teacher_ids: [],
                room_id: '',
                meeting_name: '',
                notes: '',
            };
        }

        function formatTime(timeString) {
            if (!timeString) return '';
            const parts = timeString.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
            return timeString;
        }

        function getDayName(dayId) {
            const day = days.value.find(d => d.id === dayId);
            return day ? day.name : '';
        }

        function getPeriodName(periodId) {
            const period = periods.value.find(p => p.id === periodId);
            return period ? period.name : '';
        }

        function getEntryTitle(entry) {
            if (entry.meeting_name) return entry.meeting_name;
            if (entry.course_id) {
                const course = courses.value.find(c => c.id === entry.course_id);
                return course ? course.name : '';
            }
            return 'Untitled';
        }

        async function openEntryForm(options) {
            const {
                isEdit,
                entry,
                conflicts: entryConflicts,
                period,
                dayId,
                periodId,
                startTime,
                endTime,
                assignmentData,
            } = options;

            isEditingEntry.value = isEdit;
            conflicts.value = entryConflicts || [];

            if (isEdit && entry) {
                // Edit existing entry
                entryForm.value = { ...entry };
            } else if (assignmentData) {
                // Handle assignment data from modal workflow
                const newEntry = createEmptyEntry();

                // Set basic schedule data
                newEntry.day_id = assignmentData.dayId;
                newEntry.period_id = assignmentData.periodId;
                newEntry.schedule_type = 'period';

                // Set course data
                newEntry.course_id = assignmentData.courseId;
                newEntry.course_name = assignmentData.courseName;

                // Set teacher data
                newEntry.teacher_ids = assignmentData.teacherIds;
                if (assignmentData.primaryTeacherId) {
                    newEntry.primary_teacher_id = assignmentData.primaryTeacherId;
                }

                // Set room data
                if (assignmentData.roomId) {
                    newEntry.room_id = assignmentData.roomId;
                }

                // Generate unique draft ID
                newEntry.id =
                    assignmentData.draftId || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

                // Add to entries directly without showing form
                if (store.addEntry) {
                    store.addEntry(newEntry);
                } else {
                    entries.value.push(newEntry);
                }

                return; // Don't show the form
            } else {
                // Create new entry (for old workflow)
                entryForm.value = createEmptyEntry();

                if (dayId !== undefined) {
                    entryForm.value.day_id = dayId;
                }

                if (period) {
                    entryForm.value.schedule_type = 'period';
                    entryForm.value.period_id = periodId;
                    entryForm.value.start_time = period.start_time;
                    entryForm.value.end_time = period.end_time;
                } else if (startTime && endTime) {
                    entryForm.value.schedule_type = 'adhoc';
                    entryForm.value.start_time = startTime;
                    entryForm.value.end_time = endTime;
                }
            }

            showEntryForm.value = true;
        }

        function closeEntryForm() {
            showEntryForm.value = false;
            entryForm.value = createEmptyEntry();
            conflicts.value = [];
        }

        async function saveEntry() {
            // Check for conflicts first if available
            if (store.checkPlacement) {
                const checkData = {
                    schedule_type: entryForm.value.schedule_type,
                    day_id: entryForm.value.day_id,
                    period_id: entryForm.value.schedule_type === 'period' ? entryForm.value.period_id : null,
                    start_time: entryForm.value.start_time,
                    end_time: entryForm.value.end_time,
                    teacher_ids: entryForm.value.teacher_ids,
                    class_id: entryForm.value.class_id,
                    room_id: entryForm.value.room_id,
                };

                const result = await store.checkPlacement(checkData);

                if (result.conflicts && result.conflicts.length > 0) {
                    conflicts.value = result.conflicts;
                    return;
                }
            }

            // Save the entry by updating the draft schedules array
            const updatedEntries = [...entries.value];

            if (isEditingEntry.value) {
                // Update existing entry
                const index = updatedEntries.findIndex(
                    e =>
                        e.day_id === entryForm.value.day_id &&
                        e.period_id === entryForm.value.period_id &&
                        e.start_time === entryForm.value.start_time &&
                        e.end_time === entryForm.value.end_time
                );
                if (index !== -1) {
                    updatedEntries[index] = { ...entryForm.value };
                }
            } else {
                // Add new entry
                updatedEntries.push({ ...entryForm.value });
            }

            emit('update-draft-schedules', updatedEntries);
            closeEntryForm();
        }

        function removeEntry(index) {
            const updatedEntries = [...entries.value];
            updatedEntries.splice(index, 1);
            emit('update-draft-schedules', updatedEntries);
        }

        // Course assignment functions
        function assignCourseToSlot(slotInfo, courseId) {
            const { dayId, periodId, startTime, endTime } = slotInfo;

            const newEntry = {
                schedule_type: periodId ? 'period' : 'adhoc',
                day_id: dayId,
                period_id: periodId || null,
                start_time: startTime || (periodId ? periods.value.find(p => p.id === periodId)?.start_time : null),
                end_time: endTime || (periodId ? periods.value.find(p => p.id === periodId)?.end_time : null),
                course_id: courseId,
                class_id: '',
                teacher_ids: [],
                room_id: '',
                meeting_name: '',
                notes: '',
                subject_id: null,
            };

            const updatedEntries = [...entries.value, newEntry];
            emit('update-draft-schedules', updatedEntries);
        }

        function removeCourseFromSlot(slotInfo) {
            const { dayId, periodId, startTime, endTime } = slotInfo;

            const updatedEntries = entries.value.filter(entry => {
                // Remove entry matching the slot
                const dayMatch = entry.day_id === dayId;
                const periodMatch = periodId
                    ? entry.period_id === periodId
                    : entry.start_time === startTime && entry.end_time === endTime;
                return !(dayMatch && periodMatch);
            });

            emit('update-draft-schedules', updatedEntries);
        }

        function getCoursesForSlot(slotInfo) {
            const { dayId, periodId, startTime, endTime } = slotInfo;

            return entries.value.filter(entry => {
                const dayMatch = entry.day_id === dayId;
                const periodMatch = periodId
                    ? entry.period_id === periodId
                    : entry.start_time === startTime && entry.end_time === endTime;
                return dayMatch && periodMatch;
            });
        }

        // Period details functionality
        function showPeriodDetail({ dayId, periodId }) {
            const period = periods.value.find(p => p.id === periodId);
            const day = days.value.find(d => d.id === dayId);
            const assignments = getCoursesForSlot({ dayId, periodId });

            selectedPeriodDetails.value = {
                period,
                day,
                assignments,
                dayId,
                periodId,
            };
            showPeriodDetails.value = true;
        }

        function closePeriodDetails() {
            showPeriodDetails.value = false;
            selectedPeriodDetails.value = null;
        }

        function getAssignmentDisplay(assignment) {
            const course = courses.value.find(c => c.id === assignment.course_id);
            const courseClass = classes.value.find(c => c.id === assignment.class_id);
            const teacher = assignment.teacher_ids
                .map(id => teachers.value.find(t => t.id === id)?.name)
                .filter(Boolean)
                .join(', ');
            const room = rooms.value.find(r => r.id === assignment.room_id);

            return {
                courseName: course?.name || 'Unknown Course',
                courseColor: course?.color || '#e0e0e0',
                className: courseClass?.name || '',
                classColor: courseClass?.color || '',
                teacherName: teacher || '',
                roomName: room?.name || '',
                ...assignment,
            };
        }

        return {
            days,
            courses,
            teachers,
            classes,
            rooms,
            viewMode,
            periods,
            entries,
            showEntryForm,
            showPublishDialog,
            isEditingEntry,
            entryForm,
            conflicts,
            isEntryFormValid,
            showPeriodDetails,
            selectedPeriodDetails,
            formatTime,
            getDayName,
            getPeriodName,
            getEntryTitle,
            openEntryForm,
            closeEntryForm,
            saveEntry,
            removeEntry,
            assignCourseToSlot,
            removeCourseFromSlot,
            getCoursesForSlot,
            showPeriodDetail,
            closePeriodDetails,
            getAssignmentDisplay,
        };
    },
};
</script>

<style scoped>
.scheduler-page {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
}

.scheduler-title {
    margin-bottom: 20px;
    color: #333;
}

.scheduler-content {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.scheduler-grid {
    flex: 1;
    min-width: 0; /* Prevent flex item from overflowing */
}

.draft-panel {
    width: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    display: flex;
    flex-direction: column;
}

.draft-panel-header {
    padding: 12px;
    border-bottom: 1px solid #ddd;
    background-color: #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.draft-panel-header h2 {
    margin: 0;
    font-size: 1.1rem;
}

.entry-count {
    font-size: 0.9rem;
    color: #666;
}

.draft-entries {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.draft-entry {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 8px;
    background-color: #f9f9f9;
    position: relative;
}

.entry-day {
    font-weight: 500;
    margin-bottom: 4px;
}

.entry-time {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 4px;
}

.entry-title {
    font-weight: 500;
}

.entry-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
}

.edit-entry {
    padding: 2px 6px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 0.8em;
    cursor: pointer;
}

.remove-entry {
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
}

.no-entries {
    padding: 20px;
    text-align: center;
    color: #999;
    font-style: italic;
}

/* Entry Form Dialog */
.entry-form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.entry-form {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.entry-form-header {
    padding: 16px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 1;
}

.entry-form-header h2 {
    margin: 0;
    font-size: 1.2rem;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
}

.entry-form-content {
    padding: 16px;
}

.conflicts-warning {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
}

.conflicts-warning h3 {
    margin-top: 0;
    color: #ff4d4f;
    font-size: 1rem;
}

.conflicts-warning ul {
    margin-bottom: 0;
    padding-left: 20px;
}

.form-group {
    margin-bottom: 16px;
}

.form-row {
    display: flex;
    gap: 16px;
}

.form-row .form-group {
    flex: 1;
}

label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
}

select,
input[type='text'],
input[type='time'],
textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.teacher-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
}

.teacher-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
}

.teacher-checkbox label {
    margin-bottom: 0;
    font-weight: normal;
}

.entry-form-footer {
    padding: 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    position: sticky;
    bottom: 0;
    background-color: white;
}

.cancel-button {
    padding: 8px 16px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
}

.save-button {
    padding: 8px 16px;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.save-button:disabled {
    background-color: #a0aee9;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .scheduler-content {
        flex-direction: column;
    }

    .draft-panel {
        width: 100%;
    }

    .form-row {
        flex-direction: column;
        gap: 16px;
    }
}

/* Period Details Dialog */
.period-info {
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 16px;
}

.assignments-section {
    margin-bottom: 24px;
}

.assignments-section h3 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #333;
}

.assignment-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.assignment-item {
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 4px;
    position: relative;
    border: 1px solid #e0e0e0;
}

.assignment-course {
    font-weight: 500;
    margin-bottom: 4px;
}

.course-name {
    color: #333;
}

.class-name {
    color: #666;
    font-weight: normal;
}

.assignment-teacher,
.assignment-room {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 2px;
}

.assignment-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
}

.no-assignments {
    padding: 20px;
    text-align: center;
    color: #999;
    font-style: italic;
    border: 2px dashed #ddd;
    border-radius: 4px;
}

.available-courses-section h3 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #333;
}

.course-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
}

.course-button {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
    transition: opacity 0.2s;
}

.course-button:hover {
    opacity: 0.8;
}
</style>
