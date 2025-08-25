/**
 * Centralized filter composable for scheduler components
 * Manages all filtering logic in one place
 */
import { ref, computed } from 'vue';
import { useSchedulerStore } from '../state/schedulerState';

export function useSchedulerFilters() {
    const store = useSchedulerStore();

    // Computed filter state from store
    const selectedTeacherIds = computed(() => store.selectedTeacherIds?.value || []);
    const selectedClassId = computed(() => store.selectedClassId?.value || null);
    const selectedRoomId = computed(() => store.selectedRoomId?.value || null);

    // Filter actions (delegated to store)
    function toggleTeacher(teacherId) {
        store.toggleTeacher(teacherId);
    }

    function setSelectedClass(classId) {
        store.setSelectedClass(classId);
    }

    function setSelectedRoom(roomId) {
        store.setSelectedRoom(roomId);
    }

    function clearFilters() {
        store.clearFilters();
    }

    // Filter utilities
    function isTeacherSelected(teacherId) {
        const teacherIds = selectedTeacherIds.value || [];
        return teacherIds.includes(teacherId);
    }

    function hasActiveFilters() {
        const teacherIds = selectedTeacherIds.value || [];
        const classId = selectedClassId.value;
        const roomId = selectedRoomId.value;
        return teacherIds.length > 0 || classId !== null || roomId !== null;
    }

    function getActiveFiltersCount() {
        let count = 0;
        const teacherIds = selectedTeacherIds.value || [];
        const classId = selectedClassId.value;
        const roomId = selectedRoomId.value;
        if (teacherIds.length > 0) count++;
        if (classId !== null) count++;
        if (roomId !== null) count++;
        return count;
    }

    // Entry filtering utilities
    function applyFilters(entries) {
        if (!entries || !Array.isArray(entries)) return [];

        let filtered = [...entries];
        const teacherIds = selectedTeacherIds.value || [];
        const classId = selectedClassId.value;
        const roomId = selectedRoomId.value;

        // Apply teacher filter
        if (teacherIds.length > 0) {
            filtered = filtered.filter(entry => {
                return entry.teacher_ids && entry.teacher_ids.some(id => teacherIds.includes(id));
            });
        }

        // Apply class filter
        if (classId) {
            filtered = filtered.filter(entry => entry.class_id === classId);
        }

        // Apply room filter
        if (roomId) {
            filtered = filtered.filter(entry => entry.room_id === roomId);
        }

        return filtered;
    }

    return {
        // State
        selectedTeacherIds,
        selectedClassId,
        selectedRoomId,

        // Actions
        toggleTeacher,
        setSelectedClass,
        setSelectedRoom,
        clearFilters,

        // Utilities
        isTeacherSelected,
        hasActiveFilters,
        getActiveFiltersCount,
        applyFilters,
    };
}
