<template>
    <!-- Modal Backdrop -->
    <div class="modal-backdrop" @click="cancelEdit"></div>

    <div class="inline-editor" @click.stop>
        <!-- Assignment Info (Read-only) -->
        <div class="editor-field info-field">
            <label>Course:</label>
            <span class="course-info">{{ assignment.course_name || assignment.display_cell || 'Unknown Course' }}</span>
        </div>

        <!-- Teacher Selection -->
        <div class="editor-field teacher-selection">
            <label>Teachers:</label>
            <div class="teacher-list-container">
                <div class="teacher-search">
                    <input
                        v-model="teacherSearchTerm"
                        type="text"
                        placeholder="Search teachers..."
                        class="search-input"
                    />
                </div>
                <div class="teacher-list">
                    <div
                        v-for="teacher in filteredTeachers"
                        :key="teacher.id"
                        class="teacher-item"
                        :class="{
                            selected: selectedTeachers.includes(teacher.id),
                            primary: primaryTeacherId === teacher.id,
                        }"
                        @click="toggleTeacher(teacher.id)"
                    >
                        <div class="teacher-info">
                            <span class="teacher-name">{{
                                teacher.name || `${teacher.first_name} ${teacher.last_name}`
                            }}</span>
                        </div>
                        <div class="teacher-controls">
                            <button
                                v-if="selectedTeachers.includes(teacher.id)"
                                @click.stop="setPrimaryTeacher(teacher.id)"
                                class="primary-btn"
                                :class="{ active: primaryTeacherId === teacher.id }"
                                title="Set as primary teacher"
                            >
                                {{ primaryTeacherId === teacher.id ? '★' : '☆' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Room Selection -->
        <div class="editor-field">
            <label>Room:</label>
            <select v-model="editableAssignment.room_id" class="editor-select">
                <option value="">Select Room</option>
                <option v-for="room in rooms" :key="room.id" :value="room.id">
                    {{ room.name || room.room_name }}
                </option>
            </select>
        </div>

        <!-- Action Buttons -->
        <div class="editor-actions">
            <button @click="saveChanges" class="save-btn" :disabled="!isValid">✅ Save</button>
            <button @click="cancelEdit" class="cancel-btn">❌ Cancel</button>
            <button @click="deleteAssignment" class="delete-btn" title="Delete assignment">🗑️ Delete</button>
            <button @click="editCourse" class="edit-course-btn" title="Edit full course details">📝 Edit Course</button>
        </div>
    </div>
</template>

<script>
import { computed, ref, watch } from 'vue';

export default {
    name: 'InlineAssignmentEditor',
    props: {
        assignment: { type: Object, required: true },
        courses: { type: Array, default: () => [] },
        teachers: { type: Array, default: () => [] },
        classes: { type: Array, default: () => [] },
        rooms: { type: Array, default: () => [] },
        subjects: { type: Array, default: () => [] },
    },
    emits: ['save', 'cancel', 'delete', 'edit-course'],
    setup(props, { emit }) {
        // Create editable copy of assignment
        const editableAssignment = ref({ ...props.assignment });

        // Teacher search and selection
        const teacherSearchTerm = ref('');

        // Handle both teacher_ids and staff_ids field names for compatibility
        const teacherIds = props.assignment.teacher_ids || props.assignment.staff_ids || [];
        const selectedTeachers = ref([...teacherIds]);
        const primaryTeacherId = ref(
            props.assignment.primaryTeacherId || (teacherIds.length > 0 ? teacherIds[0] : null)
        );

        // Filtered teachers based on search
        const filteredTeachers = computed(() => {
            if (!teacherSearchTerm.value) return props.teachers;

            const searchLower = teacherSearchTerm.value.toLowerCase();
            return props.teachers.filter(teacher => {
                const name = teacher.name || `${teacher.first_name} ${teacher.last_name}`;
                return name.toLowerCase().includes(searchLower);
            });
        });

        // Watch for teacher selection changes
        watch(
            selectedTeachers,
            newTeachers => {
                // Update both possible field names for compatibility
                editableAssignment.value.teacher_ids = [...newTeachers];
                editableAssignment.value.staff_ids = [...newTeachers];

                // If primary teacher is no longer selected, clear it
                if (primaryTeacherId.value && !newTeachers.includes(primaryTeacherId.value)) {
                    primaryTeacherId.value = null;
                }

                // If only one teacher selected, make them primary
                if (newTeachers.length === 1) {
                    primaryTeacherId.value = newTeachers[0];
                }
            },
            { deep: true }
        );

        // Watch for primary teacher changes
        watch(primaryTeacherId, newPrimaryId => {
            editableAssignment.value.primaryTeacherId = newPrimaryId;
        });

        // Validation - Always valid since we're just editing teacher/room assignments
        const isValid = computed(() => {
            // Assignment is always valid since we're not changing the core course assignment
            return true;
        });

        function toggleTeacher(teacherId) {
            const index = selectedTeachers.value.indexOf(teacherId);
            if (index > -1) {
                selectedTeachers.value.splice(index, 1);
            } else {
                selectedTeachers.value.push(teacherId);
            }
        }

        function setPrimaryTeacher(teacherId) {
            if (selectedTeachers.value.includes(teacherId)) {
                primaryTeacherId.value = teacherId;
            }
        }

        function saveChanges() {
            if (!isValid.value) return;

            // Ensure both teacher field names are properly set for compatibility
            editableAssignment.value.teacher_ids = [...selectedTeachers.value];
            editableAssignment.value.staff_ids = [...selectedTeachers.value];
            editableAssignment.value.primaryTeacherId = primaryTeacherId.value;

            emit('save', editableAssignment.value);
        }

        function cancelEdit() {
            emit('cancel');
        }

        function deleteAssignment() {
            if (confirm('Are you sure you want to delete this assignment?')) {
                emit('delete', props.assignment);
            }
        }

        function editCourse() {
            // Use the assignment's existing course information
            emit('edit-course', {
                courseId: props.assignment.course_id,
                courseName: props.assignment.course_name || props.assignment.display_cell || '',
                courseCode: props.assignment.course_code || '',
                source: 'inline-editor',
            });
        }

        return {
            editableAssignment,
            teacherSearchTerm,
            selectedTeachers,
            primaryTeacherId,
            filteredTeachers,
            isValid,
            toggleTeacher,
            setPrimaryTeacher,
            saveChanges,
            cancelEdit,
            deleteAssignment,
            editCourse,
        };
    },
};
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

.inline-editor {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #007cba;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 14px;
    /* Modal sizing */
    width: 450px;
    max-width: 90vw;
    max-height: 90vh;
    box-sizing: border-box;
    overflow-y: auto;
}

.editor-field {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.editor-field.teacher-selection {
    flex-direction: column;
    align-items: stretch;
}

.teacher-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.teacher-search {
    margin-bottom: 4px;
}

.search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    background: white;
}

.teacher-list {
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
}

.teacher-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    transition: background-color 0.2s;
}

.teacher-item:hover {
    background: #f0f7ff;
}

.teacher-item.selected {
    background: rgba(0, 124, 186, 0.1);
    border-left: 3px solid #007cba;
}

.teacher-item.primary {
    background: rgba(0, 124, 186, 0.2);
    font-weight: bold;
}

.teacher-info {
    flex: 1;
}

.teacher-name {
    font-size: 13px;
}

.teacher-controls {
    display: flex;
    gap: 4px;
}

.primary-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #999;
    padding: 4px 6px;
    border-radius: 3px;
    transition: color 0.2s;
}

.primary-btn:hover {
    color: #007cba;
}

.primary-btn.active {
    color: #ffb400;
}

.editor-field.info-field {
    background: rgba(0, 124, 186, 0.1);
    padding: 12px;
    border-radius: 6px;
    border: 1px solid rgba(0, 124, 186, 0.2);
}

.course-info {
    font-weight: bold;
    color: #007cba;
    flex: 1;
    font-size: 14px;
}

.editor-field label {
    font-weight: bold;
    min-width: 60px;
    font-size: 14px;
}

.editor-select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    background: white;
}

.editor-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    justify-content: space-between;
}

.save-btn,
.cancel-btn,
.delete-btn,
.edit-course-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
}

.save-btn {
    background: #4caf50;
    color: white;
}

.save-btn:hover {
    background: #45a049;
}

.save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.cancel-btn {
    background: #f44336;
    color: white;
}

.cancel-btn:hover {
    background: #da190b;
}

.delete-btn {
    background: #ff9800;
    color: white;
}

.delete-btn:hover {
    background: #f57c00;
}

.edit-course-btn {
    background: #2196f3;
    color: white;
}

.edit-course-btn:hover {
    background: #1976d2;
}
</style>
