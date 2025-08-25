/**
 * Shared grid logic composable for scheduler components
 * Centralizes common functionality between PeriodGrid and TimeGrid
 */
import { computed } from 'vue';
import { useSchedulerStore } from '../state/schedulerState';

export function useGridLogic(props) {
    const store = useSchedulerStore();

    // Core data access
    const periods = computed(() => store.periods?.value || []);
    const entries = computed(() => store.filteredEntries?.value || []);

    // Entry utilities
    function hasEntry(dayId, periodId, scheduleType = 'period') {
        const entriesArray = entries.value || [];
        return entriesArray.some(
            entry => entry.day_id === dayId && entry.period_id === periodId && entry.schedule_type === scheduleType
        );
    }

    function getEntry(dayId, periodId, scheduleType = 'period') {
        const entriesArray = entries.value || [];
        return entriesArray.find(
            entry => entry.day_id === dayId && entry.period_id === periodId && entry.schedule_type === scheduleType
        );
    }

    function removeEntry(dayId, periodId, scheduleType = 'period') {
        const entry = getEntry(dayId, periodId, scheduleType);
        if (entry) {
            const entriesArray = entries.value || [];
            const index = entriesArray.indexOf(entry);
            if (index !== -1) {
                store.removeEntry(index);
            }
        }
    }

    // Entry data formatters
    function getEntryCourseName(dayId, periodId, scheduleType = 'period') {
        const entry = getEntry(dayId, periodId, scheduleType);
        if (!entry || !entry.course_id) return '';

        const course = props.courses?.find(c => c.id === entry.course_id);
        return course?.name || course?.course_name || course?.title || '';
    }

    function getEntryRoomName(dayId, periodId, scheduleType = 'period') {
        const entry = getEntry(dayId, periodId, scheduleType);
        if (!entry || !entry.room_id) return '';

        const room = props.rooms?.find(r => r.id === entry.room_id);
        return room?.name || '';
    }

    function getEntryTeacherNames(dayId, periodId, scheduleType = 'period') {
        const entry = getEntry(dayId, periodId, scheduleType);
        if (!entry) return '';

        // First try to use direct teacher_names if available
        if (entry.teacher_names && Array.isArray(entry.teacher_names) && entry.teacher_names.length > 0) {
            return entry.teacher_names.join(', ');
        }

        // Fallback to looking up teacher names by IDs
        const teacherIds = entry.staff_ids || entry.teacher_ids;
        if (!teacherIds || !teacherIds.length) return '';

        const teacherNames = teacherIds
            .map(id => {
                const teacher = props.teachers?.find(t => t.id === id);
                return teacher ? teacher.name : '';
            })
            .filter(name => name);

        return teacherNames.join(', ');
    }

    function getEntryColor(dayId, periodId, scheduleType = 'period') {
        const entry = getEntry(dayId, periodId, scheduleType);
        if (!entry || !entry.course_id) return '#e0e0e0';

        const course = props.courses?.find(c => c.id === entry.course_id);
        return course?.color || course?.subject_color || '#1890ff';
    }

    // Time formatting utility
    function formatTime(timeString) {
        if (!timeString) return '';

        // Simple time formatting (HH:MM)
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return timeString;
    }

    // Course normalization and availability
    function normalizeCourse(course, index) {
        return {
            id: course.id || `course-${index}`,
            name: course.name || course.course_name || course.title,
            course_name: course.course_name || course.name || course.title,
            course_code: course.course_code,
            subject_name: course.subject_name,
            description: course.description,
            color: course.color || course.subject_color,
            possibleSlots: course.possibleSlots || course.possible_slots || [],
            is_for_year_groups: course.is_for_year_groups || course.isForYearGroups || [],
        };
    }

    function getAvailableCoursesForSlot(dayId, periodId) {
        if (!props.courses) return [];

        // Normalize courses to use possibleSlots with dayId parsing
        const normalizedCourses = props.courses.map((course, idx) => normalizeCourse(course, idx));

        // Filter courses that are available for this specific day/period using dayId
        let availableCourses = normalizedCourses.filter(course => {
            // If course has no time slot restrictions, it's available anywhere
            if (!course.possibleSlots || course.possibleSlots.length === 0) {
                return true;
            }

            // Check if this day/period combination is in the course's possible slots
            const isAvailable = course.possibleSlots.some(slot => {
                return slot.dayId === dayId && slot.periodId === periodId;
            });

            return isAvailable;
        });

        return availableCourses;
    }

    // Entry data formatters for direct entry objects (used by TimeGrid)
    function getEntryRoomNameFromEntry(entry) {
        if (!entry || !entry.room_id) return '';
        const room = props.rooms?.find(r => r.id === entry.room_id);
        return room?.name || '';
    }

    function getEntryTeacherNamesFromEntry(entry) {
        if (!entry) return '';

        // First try to use direct teacher_names if available
        if (entry.teacher_names && Array.isArray(entry.teacher_names) && entry.teacher_names.length > 0) {
            return entry.teacher_names.join(', ');
        }

        // Fallback to looking up teacher names by IDs
        const teacherIds = entry.staff_ids || entry.teacher_ids;
        if (!teacherIds || !teacherIds.length) return '';

        const teacherNames = teacherIds
            .map(id => {
                const teacher = props.teachers?.find(t => t.id === id);
                return teacher ? teacher.name : '';
            })
            .filter(name => name);

        return teacherNames.join(', ');
    }

    function getEntryTitleFromEntry(entry) {
        if (!entry) return 'Untitled';
        if (entry.meeting_name) return entry.meeting_name;
        if (entry.course_id) {
            const course = props.courses?.find(c => c.id === entry.course_id);
            return course?.name || course?.course_name || course?.title || '';
        }
        return 'Untitled';
    }

    return {
        // State
        periods,
        entries,

        // Entry utilities
        hasEntry,
        getEntry,
        removeEntry,

        // Entry formatters (day/period based)
        getEntryCourseName,
        getEntryRoomName,
        getEntryTeacherNames,
        getEntryColor,

        // Entry formatters (direct entry object based)
        getEntryRoomNameFromEntry,
        getEntryTeacherNamesFromEntry,
        getEntryTitleFromEntry,

        // Utilities
        formatTime,
        normalizeCourse,
        getAvailableCoursesForSlot,
    };
}
