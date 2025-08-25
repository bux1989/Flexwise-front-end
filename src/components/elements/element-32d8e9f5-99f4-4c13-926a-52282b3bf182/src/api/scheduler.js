// Browser-compatible HTTP client using fetch API
const API_BASE_URL = '/api';

// Simple fetch wrapper to replace axios
const api = {
    get: async url => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return { data: await response.json() };
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    },
    post: async (url, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return { data: await response.json() };
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    },
};

// Mock data for development when API is unavailable
const mockPeriods = [
    { id: '1', name: 'Period 1', start_time: '08:00', end_time: '09:00' },
    { id: '2', name: 'Period 2', start_time: '09:15', end_time: '10:15' },
    { id: '3', name: 'Period 3', start_time: '10:30', end_time: '11:30' },
    { id: '4', name: 'Period 4', start_time: '11:45', end_time: '12:45' },
    { id: '5', name: 'Period 5', start_time: '13:30', end_time: '14:30' },
    { id: '6', name: 'Period 6', start_time: '14:45', end_time: '15:45' },
    { id: '7', name: 'Period 7', start_time: '16:00', end_time: '17:00' },
];

export default {
    // Flag to toggle mock mode when API is unavailable
    useMockData: false,

    // Toggle mock mode
    setMockMode(useMode) {
        this.useMockData = useMode;
    },

    // Get schedule periods for a school
    async getSchedulePeriods(schoolId) {
        if (this.useMockData) {
            return { data: mockPeriods };
        }

        try {
            return await api.get(`/schedule-periods?school_id=${schoolId}`);
        } catch (error) {
            console.error('Error fetching schedule periods:', error);
            throw error;
        }
    },

    // Save draft entries
    async saveDraftEntries(schoolId, draftId, entries) {
        if (this.useMockData) {
            return { data: { success: true, message: 'Draft saved successfully' } };
        }

        try {
            return await api.post(`/schedule-drafts/${schoolId}/entries`, {
                draft_id: draftId,
                entries,
            });
        } catch (error) {
            console.error('Error saving draft entries:', error);
            throw error;
        }
    },

    // Check if a slot is available
    async checkSlot(schoolId, draftId, slotData) {
        if (this.useMockData) {
            // Mock response with no conflicts
            return { data: { conflicts: [] } };
        }

        try {
            return await api.post(`/schedule-drafts/${schoolId}/check-slot`, {
                draft_id: draftId,
                ...slotData,
            });
        } catch (error) {
            console.error('Error checking slot availability:', error);
            throw error;
        }
    },

    // Publish a draft schedule
    async publishDraft(schoolId, draftId, publishedBy) {
        if (this.useMockData) {
            return { data: { success: true, message: 'Schedule published successfully' } };
        }

        try {
            return await api.post(`/schedule-drafts/${schoolId}/publish`, {
                draft_id: draftId,
                published_by: publishedBy,
            });
        } catch (error) {
            console.error('Error publishing draft:', error);
            throw error;
        }
    },
};
