/**
 * Simple reactive state management for scheduler without external dependencies
 * Uses Vue's built-in reactivity system for browser compatibility
 */
import { ref, computed, reactive } from 'vue';

// Create reactive state
const state = reactive({
    schoolId: null,
    draftId: null,
    publishedBy: null,
    viewMode: 'period',
    periods: [],
    entries: [],
    selectedTeacherIds: [],
    selectedClassId: null,
    selectedRoomId: null,
    isLoading: false,
    error: null,
    isDraftSaved: true,
});

// Centralized filter function
function applyFiltersToEntries(entriesArray) {
    let filtered = [...entriesArray];

    // Apply teacher filter
    if (state.selectedTeacherIds.length > 0) {
        filtered = filtered.filter(entry => {
            return entry.teacher_ids && entry.teacher_ids.some(id => state.selectedTeacherIds.includes(id));
        });
    }

    // Apply class filter
    if (state.selectedClassId) {
        filtered = filtered.filter(entry => entry.class_id === state.selectedClassId);
    }

    // Apply room filter
    if (state.selectedRoomId) {
        filtered = filtered.filter(entry => entry.room_id === state.selectedRoomId);
    }

    return filtered;
}

// Computed properties
const filteredEntries = computed(() => {
    return applyFiltersToEntries(state.entries);
});

const periodEntries = computed(() => {
    return filteredEntries.value.filter(entry => entry.schedule_type === 'period');
});

const adhocEntries = computed(() => {
    return filteredEntries.value.filter(entry => entry.schedule_type === 'adhoc');
});

// Actions
const actions = {
    initialize(school, draft, publisher = null, data = {}) {
        state.schoolId = school;
        state.draftId = draft;
        state.publishedBy = publisher;

        // Load data from props
        if (data.periods) state.periods = [...data.periods];
        if (data.draftSchedules) state.entries = [...data.draftSchedules];
    },

    updateData(data) {
        // Update store with new prop data
        if (data.periods) state.periods = [...data.periods];
        if (data.draftSchedules) state.entries = [...data.draftSchedules];
    },

    upsertEntry(entry) {
        const index = state.entries.findIndex(
            e =>
                e.day_id === entry.day_id &&
                e.period_id === entry.period_id &&
                e.start_time === entry.start_time &&
                e.end_time === entry.end_time
        );

        if (index !== -1) {
            // Update existing entry
            state.entries[index] = { ...entry };
        } else {
            // Add new entry
            state.entries.push({ ...entry });
        }

        state.isDraftSaved = false;
    },

    removeEntry(index) {
        if (index >= 0 && index < state.entries.length) {
            state.entries.splice(index, 1);
            state.isDraftSaved = false;
        }
    },

    setViewMode(mode) {
        if (mode === 'period' || mode === 'time') {
            state.viewMode = mode;
        }
    },

    toggleTeacher(teacherId) {
        const index = state.selectedTeacherIds.indexOf(teacherId);
        if (index === -1) {
            state.selectedTeacherIds.push(teacherId);
        } else {
            state.selectedTeacherIds.splice(index, 1);
        }
    },

    setSelectedClass(classId) {
        state.selectedClassId = classId;
    },

    setSelectedRoom(roomId) {
        state.selectedRoomId = roomId;
    },

    clearFilters() {
        state.selectedTeacherIds = [];
        state.selectedClassId = null;
        state.selectedRoomId = null;
    },

    async persistDraft() {
        state.isLoading = true;
        state.error = null;

        try {
            // Mock implementation since we're using props data
            await new Promise(resolve => setTimeout(resolve, 1000));
            state.isDraftSaved = true;
            return true;
        } catch (err) {
            state.error = 'Failed to save draft';
            console.error(state.error, err);
            return false;
        } finally {
            state.isLoading = false;
        }
    },

    async publish() {
        if (!state.isDraftSaved) {
            await actions.persistDraft();
        }

        state.isLoading = true;
        state.error = null;

        try {
            // Mock implementation
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, message: 'Published successfully' };
        } catch (err) {
            state.error = 'Failed to publish schedule';
            console.error(state.error, err);
            return { success: false, message: state.error };
        } finally {
            state.isLoading = false;
        }
    },
};

// Export the scheduler store interface
export function useSchedulerStore() {
    return {
        // State
        schoolId: computed(() => state.schoolId),
        draftId: computed(() => state.draftId),
        publishedBy: computed(() => state.publishedBy),
        viewMode: computed(() => state.viewMode),
        periods: computed(() => state.periods),
        entries: computed(() => state.entries),
        selectedTeacherIds: computed(() => state.selectedTeacherIds),
        selectedClassId: computed(() => state.selectedClassId),
        selectedRoomId: computed(() => state.selectedRoomId),
        isLoading: computed(() => state.isLoading),
        error: computed(() => state.error),
        isDraftSaved: computed(() => state.isDraftSaved),

        // Computed
        filteredEntries,
        periodEntries,
        adhocEntries,

        // Actions
        ...actions,
    };
}
