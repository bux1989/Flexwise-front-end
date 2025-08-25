/**
 * Normalized state access composable for scheduler components
 * Provides consistent access to scheduler state across components
 */
import { computed } from 'vue';
import { useSchedulerStore } from '../state/schedulerState';

export function useSchedulerState() {
    const store = useSchedulerStore();

    // Core state - store now returns computed refs, so we access the value directly
    const schoolId = computed(() => store.schoolId?.value || null);
    const draftId = computed(() => store.draftId?.value || null);
    const publishedBy = computed(() => store.publishedBy?.value || null);
    const viewMode = computed(() => store.viewMode?.value || 'period');
    const isLoading = computed(() => store.isLoading?.value || false);
    const error = computed(() => store.error?.value || null);
    const isDraftSaved = computed(() => store.isDraftSaved?.value || true);

    // Data state
    const periods = computed(() => store.periods?.value || []);
    const entries = computed(() => store.entries?.value || []);
    const filteredEntries = computed(() => store.filteredEntries?.value || []);
    const periodEntries = computed(() => store.periodEntries?.value || []);
    const adhocEntries = computed(() => store.adhocEntries?.value || []);

    // Filter state
    const selectedTeacherIds = computed(() => store.selectedTeacherIds?.value || []);
    const selectedClassId = computed(() => store.selectedClassId?.value || null);
    const selectedRoomId = computed(() => store.selectedRoomId?.value || null);

    // Computed derived state
    const isReadOnly = computed(() => !!publishedBy.value);
    const hasEntries = computed(() => (entries.value || []).length > 0);
    const hasFilteredEntries = computed(() => (filteredEntries.value || []).length > 0);
    const isPeriodView = computed(() => viewMode.value === 'period');
    const isTimeView = computed(() => viewMode.value === 'time');

    // Filter utilities
    const hasActiveFilters = computed(() => {
        const teacherIds = selectedTeacherIds.value || [];
        const classId = selectedClassId.value;
        const roomId = selectedRoomId.value;
        return teacherIds.length > 0 || classId !== null || roomId !== null;
    });

    const activeFiltersCount = computed(() => {
        let count = 0;
        const teacherIds = selectedTeacherIds.value || [];
        const classId = selectedClassId.value;
        const roomId = selectedRoomId.value;
        if (teacherIds.length > 0) count++;
        if (classId !== null) count++;
        if (roomId !== null) count++;
        return count;
    });

    // Actions (direct delegation to store)
    const actions = {
        initialize: store.initialize,
        updateData: store.updateData,
        upsertEntry: store.upsertEntry,
        removeEntry: store.removeEntry,
        persistDraft: store.persistDraft,
        publish: store.publish,
        setViewMode: store.setViewMode,
        toggleTeacher: store.toggleTeacher,
        setSelectedClass: store.setSelectedClass,
        setSelectedRoom: store.setSelectedRoom,
        clearFilters: store.clearFilters,
    };

    return {
        // Core state
        schoolId,
        draftId,
        publishedBy,
        viewMode,
        isLoading,
        error,
        isDraftSaved,

        // Data state
        periods,
        entries,
        filteredEntries,
        periodEntries,
        adhocEntries,

        // Filter state
        selectedTeacherIds,
        selectedClassId,
        selectedRoomId,

        // Computed state
        isReadOnly,
        hasEntries,
        hasFilteredEntries,
        isPeriodView,
        isTimeView,
        hasActiveFilters,
        activeFiltersCount,

        // Actions
        ...actions,
    };
}
