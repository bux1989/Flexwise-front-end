import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import schedulerApi from '../api/scheduler';

export const useSchedulerStore = defineStore('scheduler', () => {
    // State
    const schoolId = ref(null);
    const draftId = ref(null);
    const publishedBy = ref(null);
    const viewMode = ref('period'); // 'period' or 'time'
    const periods = ref([]);
    const entries = ref([]);
    const selectedTeacherIds = ref([]);
    const selectedClassId = ref(null);
    const selectedRoomId = ref(null);
    const isLoading = ref(false);
    const error = ref(null);
    const useMockMode = ref(false);
    const lastCheckResult = ref(null);
    const isDraftSaved = ref(true);

    // Centralized filter function
    function applyFiltersToEntries(entriesArray) {
        let filtered = [...entriesArray];

        // Apply teacher filter
        if (selectedTeacherIds.value.length > 0) {
            filtered = filtered.filter(entry => {
                return entry.teacher_ids && entry.teacher_ids.some(id => selectedTeacherIds.value.includes(id));
            });
        }

        // Apply class filter
        if (selectedClassId.value) {
            filtered = filtered.filter(entry => entry.class_id === selectedClassId.value);
        }

        // Apply room filter
        if (selectedRoomId.value) {
            filtered = filtered.filter(entry => entry.room_id === selectedRoomId.value);
        }

        return filtered;
    }

    // Getters using centralized filter logic
    const filteredEntries = computed(() => {
        return applyFiltersToEntries(entries.value);
    });

    const periodEntries = computed(() => {
        return filteredEntries.value.filter(entry => entry.schedule_type === 'period');
    });

    const adhocEntries = computed(() => {
        return filteredEntries.value.filter(entry => entry.schedule_type === 'adhoc');
    });

    // Actions
    function initialize(school, draft, publisher = null, data = {}) {
        schoolId.value = school;
        draftId.value = draft;
        publishedBy.value = publisher;

        // Load data from props instead of API
        if (data.periods) periods.value = data.periods;
        if (data.draftSchedules) entries.value = data.draftSchedules;

        // Disable mock mode since we're using prop data
        useMockMode.value = false;
        schedulerApi.setMockMode(false);
    }

    function updateData(data) {
        // Update store with new prop data
        if (data.periods) periods.value = data.periods;
        if (data.draftSchedules) entries.value = data.draftSchedules;
    }

    async function loadPeriods() {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await schedulerApi.getSchedulePeriods(schoolId.value);
            periods.value = response.data;
        } catch (err) {
            error.value = 'Failed to load schedule periods';
            console.error(error.value, err);
        } finally {
            isLoading.value = false;
        }
    }

    async function checkPlacement(payload) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await schedulerApi.checkSlot(schoolId.value, draftId.value, payload);
            lastCheckResult.value = response.data;
            return response.data;
        } catch (err) {
            error.value = 'Failed to check slot availability';
            console.error(error.value, err);
            return { conflicts: [] };
        } finally {
            isLoading.value = false;
        }
    }

    function upsertEntry(entry) {
        const index = entries.value.findIndex(
            e =>
                e.day_id === entry.day_id &&
                e.period_id === entry.period_id &&
                e.start_time === entry.start_time &&
                e.end_time === entry.end_time
        );

        if (index !== -1) {
            // Update existing entry
            entries.value[index] = { ...entry };
        } else {
            // Add new entry
            entries.value.push({ ...entry });
        }

        isDraftSaved.value = false;
    }

    function removeEntry(index) {
        if (index >= 0 && index < entries.value.length) {
            entries.value.splice(index, 1);
            isDraftSaved.value = false;
        }
    }

    async function persistDraft() {
        isLoading.value = true;
        error.value = null;

        try {
            await schedulerApi.saveDraftEntries(schoolId.value, draftId.value, entries.value);
            isDraftSaved.value = true;
            return true;
        } catch (err) {
            error.value = 'Failed to save draft';
            console.error(error.value, err);
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function publish() {
        if (!isDraftSaved.value) {
            await persistDraft();
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await schedulerApi.publishDraft(schoolId.value, draftId.value, publishedBy.value);
            return response.data;
        } catch (err) {
            error.value = 'Failed to publish schedule';
            console.error(error.value, err);
            return { success: false, message: error.value };
        } finally {
            isLoading.value = false;
        }
    }

    function setViewMode(mode) {
        if (mode === 'period' || mode === 'time') {
            viewMode.value = mode;
        }
    }

    function toggleTeacher(teacherId) {
        const index = selectedTeacherIds.value.indexOf(teacherId);
        if (index === -1) {
            selectedTeacherIds.value.push(teacherId);
        } else {
            selectedTeacherIds.value.splice(index, 1);
        }
    }

    function setSelectedClass(classId) {
        selectedClassId.value = classId;
    }

    function setSelectedRoom(roomId) {
        selectedRoomId.value = roomId;
    }

    function clearFilters() {
        selectedTeacherIds.value = [];
        selectedClassId.value = null;
        selectedRoomId.value = null;
    }

    function toggleMockMode() {
        useMockMode.value = !useMockMode.value;
        schedulerApi.setMockMode(useMockMode.value);
    }

    return {
        // State
        schoolId,
        draftId,
        publishedBy,
        viewMode,
        periods,
        entries,
        selectedTeacherIds,
        selectedClassId,
        selectedRoomId,
        isLoading,
        error,
        useMockMode,
        lastCheckResult,
        isDraftSaved,

        // Getters
        filteredEntries,
        periodEntries,
        adhocEntries,

        // Actions
        initialize,
        updateData,
        loadPeriods,
        checkPlacement,
        upsertEntry,
        removeEntry,
        persistDraft,
        publish,
        setViewMode,
        toggleTeacher,
        setSelectedClass,
        setSelectedRoom,
        clearFilters,
        toggleMockMode,
    };
});
