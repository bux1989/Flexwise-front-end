<template>
    <div class="assignment-view-content">
        <!-- Main Assignment Info -->
        <div class="info-section">
            <h4>📅 Schedule Details</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>Day:</label>
                    <span>{{ dayName }}</span>
                </div>
                <div class="info-item">
                    <label>Period:</label>
                    <span>{{ periodInfo }}</span>
                </div>
                <div class="info-item">
                    <label>Time:</label>
                    <span>{{ timeRange }}</span>
                </div>
                <div class="info-item">
                    <label>Room:</label>
                    <span>{{ roomName }}</span>
                </div>
            </div>
        </div>

        <!-- Course/Subject Information -->
        <div class="info-section">
            <h4>📚 {{ isCourse ? 'Course' : 'Subject' }} Information</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>{{ isCourse ? 'Course Name:' : 'Subject Name:' }}</label>
                    <span class="primary-name">{{ primaryName }}</span>
                </div>
                <div v-if="assignment.subject_name && isCourse" class="info-item">
                    <label>Subject:</label>
                    <span>{{ assignment.subject_name }}</span>
                </div>
                <div v-if="assignment.course_id" class="info-item">
                    <label>Course ID:</label>
                    <span class="course-id">{{ assignment.course_id }}</span>
                </div>
            </div>
        </div>

        <!-- Class/Grade Information -->
        <div class="info-section">
            <h4>👥 {{ hasClass ? 'Class' : 'Grade' }} Information</h4>
            <div class="info-grid">
                <div v-if="hasClass" class="info-item">
                    <label>Class:</label>
                    <span>{{ assignment.class_name }}</span>
                </div>
                <div v-if="hasGrades" class="info-item">
                    <label>{{ hasClass ? 'Grade Level:' : 'Grades:' }}</label>
                    <span>{{ gradesDisplay }}</span>
                </div>
                <div v-if="assignment.enrolled_students_count !== undefined" class="info-item">
                    <label>Enrolled Students:</label>
                    <span class="enrollment-count">{{ assignment.enrolled_students_count || 0 }}</span>
                </div>
            </div>
        </div>

        <!-- Teacher Information -->
        <div class="info-section">
            <h4>👨‍🏫 Teaching Staff</h4>
            <div class="teacher-list">
                <div v-if="teacherNames.length > 0" class="teachers-container">
                    <div v-for="(teacher, index) in teacherNames" :key="index" class="teacher-item">
                        <span class="teacher-name">{{ teacher }}</span>
                    </div>
                </div>
                <div v-else class="no-teachers">
                    <span class="empty-text">No teachers assigned</span>
                </div>
            </div>
        </div>

        <!-- Schedule Validity -->
        <div v-if="hasValidityInfo" class="info-section">
            <h4>📆 Schedule Period</h4>
            <div class="info-grid">
                <div v-if="assignment.start_date" class="info-item">
                    <label>Start Date:</label>
                    <span>{{ formatDate(assignment.start_date) }}</span>
                </div>
                <div v-if="assignment.end_date" class="info-item">
                    <label>End Date:</label>
                    <span>{{ formatDate(assignment.end_date) }}</span>
                </div>
                <div v-if="assignment.valid_from" class="info-item">
                    <label>Valid From:</label>
                    <span>{{ formatDate(assignment.valid_from) }}</span>
                </div>
                <div v-if="assignment.valid_until" class="info-item">
                    <label>Valid Until:</label>
                    <span>{{ formatDate(assignment.valid_until) }}</span>
                </div>
            </div>
        </div>

        <!-- Additional Information -->
        <div v-if="hasAdditionalInfo" class="info-section">
            <h4>ℹ️ Additional Information</h4>
            <div class="info-grid">
                <div v-if="assignment.meeting_name" class="info-item">
                    <label>Meeting:</label>
                    <span>{{ assignment.meeting_name }}</span>
                </div>
                <div v-if="assignment.notes" class="info-item">
                    <label>Notes:</label>
                    <span>{{ assignment.notes }}</span>
                </div>
                <div v-if="assignment.block_number" class="info-item">
                    <label>Block Number:</label>
                    <span>{{ assignment.block_number }}</span>
                </div>
                <div v-if="assignment.group_label" class="info-item">
                    <label>Group:</label>
                    <span>{{ assignment.group_label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'AssignmentViewModal',
    props: {
        assignment: { type: Object, required: true },
        periods: { type: Array, default: () => [] },
        schoolDays: { type: Array, default: () => [] },
    },
    emits: ['close'],
    setup(props, { emit }) {
        // Course vs lesson detection
        const isCourse = computed(() => !!(props.assignment.course_id && props.assignment.course_name));

        // Primary name (course name for courses, subject name for lessons)
        const primaryName = computed(() => {
            if (isCourse.value) {
                return props.assignment.course_name;
            }
            return props.assignment.subject_name || 'Unknown Subject';
        });

        // Display title and subtitle (removed - now handled by parent modal)

        // Day information
        const dayName = computed(() => {
            return (
                props.assignment.day_name_en ||
                props.assignment.day_name_de ||
                getDayNameById(props.assignment.day_id) ||
                `Day ${props.assignment.day_id}`
            );
        });

        // Period information
        const periodInfo = computed(() => {
            const period = props.periods.find(p => p.id === props.assignment.period_id);
            if (period) {
                return period.name || period.period_label || `Period ${props.assignment.period_id}`;
            }
            return props.assignment.period_label || `Period ${props.assignment.period_id}`;
        });

        // Time range
        const timeRange = computed(() => {
            const start = formatTime(props.assignment.start_time);
            const end = formatTime(props.assignment.end_time);
            if (start && end) {
                return `${start} - ${end}`;
            }
            return start || end || 'Time not specified';
        });

        // Room information
        const roomName = computed(() => {
            return props.assignment.scheduled_room_name || props.assignment.room_name || 'Room not assigned';
        });

        // Class information
        const hasClass = computed(() => !!(props.assignment.class_id && props.assignment.class_name));

        // Grades information
        const hasGrades = computed(() => {
            return !!(props.assignment.year_groups && props.assignment.year_groups.length > 0);
        });

        const gradesDisplay = computed(() => {
            if (hasGrades.value) {
                return props.assignment.year_groups.join(', ');
            }
            if (hasClass.value) {
                // Extract grade from class name if possible
                const className = props.assignment.class_name;
                const gradeMatch = className.match(/(\d+)/);
                return gradeMatch ? `Grade ${gradeMatch[1]}` : className;
            }
            return 'Not specified';
        });

        // Teacher information
        const teacherNames = computed(() => {
            if (props.assignment.teacher_names && Array.isArray(props.assignment.teacher_names)) {
                return props.assignment.teacher_names;
            }
            if (props.assignment.teacher_names && typeof props.assignment.teacher_names === 'string') {
                return [props.assignment.teacher_names];
            }
            return [];
        });

        // Validity information check
        const hasValidityInfo = computed(() => {
            return !!(
                props.assignment.start_date ||
                props.assignment.end_date ||
                props.assignment.valid_from ||
                props.assignment.valid_until
            );
        });

        // Additional information check
        const hasAdditionalInfo = computed(() => {
            return !!(
                props.assignment.meeting_name ||
                props.assignment.notes ||
                props.assignment.block_number ||
                props.assignment.group_label
            );
        });

        // Helper functions
        function getDayNameById(dayId) {
            const day = props.schoolDays.find(d => d.id === dayId);
            return day?.name || null;
        }

        function formatTime(timeStr) {
            if (!timeStr) return '';
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}`;
            }
            return timeStr;
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            } catch (e) {
                return dateStr;
            }
        }

        return {
            isCourse,
            primaryName,
            dayName,
            periodInfo,
            timeRange,
            roomName,
            hasClass,
            hasGrades,
            gradesDisplay,
            teacherNames,
            hasValidityInfo,
            hasAdditionalInfo,
            formatDate,
        };
    },
};
</script>

<style scoped>
.assignment-view-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
    max-height: 500px;
    overflow-y: auto;
    padding: 8px;
}

.info-section {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
}

.info-section h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
    color: #495057;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 6px;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: start;
}

@media (max-width: 500px) {
    .info-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: white;
    padding: 8px 10px;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.info-item label {
    font-weight: 600;
    font-size: 12px;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-item span {
    font-size: 14px;
    color: #212529;
    word-break: break-word;
}

.primary-name {
    font-weight: 600 !important;
    color: #007cba !important;
    font-size: 15px !important;
}

.course-id {
    font-family: monospace;
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px !important;
}

.enrollment-count {
    font-weight: 600 !important;
    color: #28a745 !important;
}

.teacher-list {
    background: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    padding: 8px;
}

.teachers-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.teacher-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #007cba;
}

.teacher-name {
    font-size: 14px;
    font-weight: 500;
    color: #212529;
}

.no-teachers {
    text-align: center;
    padding: 12px;
}

.empty-text {
    color: #6c757d;
    font-style: italic;
    font-size: 13px;
}
</style>
