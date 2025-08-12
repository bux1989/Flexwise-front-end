<template>
  <div v-if="show" class="inline-lesson-form" :style="position">
    <div class="form-header">
      <h3>{{ isEditing ? 'Edit Lesson' : 'Add Lesson' }}</h3>
      <button class="close-button" @click="onClose">&times;</button>
    </div>
    <form class="form-content" @keydown="handleKeydown">
      <div class="form-info">
        <div class="info-row" v-if="viewMode === 'teacher'">
          <strong>Teacher:</strong> {{ teacher }}
        </div>
        <div class="info-row" v-if="viewMode === 'class'">
          <strong>Class:</strong> {{ class }}
        </div>
        <div class="info-row">
          <strong>Day:</strong> {{ day }}
        </div>
        <div class="info-row">
          <strong>Period:</strong> {{ period }}
        </div>
      </div>

      <div class="form-group">
        <label for="subject">Subject:</label>
        <select id="subject" v-model="selectedSubject">
          <option value="">Select Subject</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ subject.name }}
          </option>
        </select>
      </div>

      <!-- Show class select only if not Termin and teacher view -->
      <div class="form-group" v-if="viewMode === 'teacher' && getSubjectName(selectedSubject) !== 'Termin'">
        <label for="class">Class:</label>
        <select id="class" v-model="selectedClass">
          <option value="">Select Class</option>
          <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
            {{ classItem.name }}
          </option>
        </select>
      </div>

      <!-- Custom teacher selector -->
      <div class="form-group"
        v-if="viewMode === 'class' || (viewMode === 'teacher' && getSubjectName(selectedSubject) === 'Termin')">
        <label>Teacher(s):</label>

        <!-- Search input -->
        <input
          v-model="teacherSearch"
          type="text"
          placeholder="Search teachers..."
          class="teacher-search-input"
        />

        <!-- Teacher list -->
        <div class="teacher-list">
          <div v-for="teacher in filteredTeachers" :key="getTeacherId(teacher)" class="teacher-item"
            :class="{ selected: isSelected(teacher) }" @click="toggleTeacher(teacher)">
            <input
              type="checkbox"
              :checked="isSelected(teacher)"
              @change.stop="toggleTeacher(teacher)"
            />
            <div class="teacher-info">
              <span class="teacher-name">{{ getTeacherDisplayName(teacher) }}</span>
              <span class="teacher-abbr" v-if="getTeacherAbbr(teacher)">
                ({{ getTeacherAbbr(teacher) }})
              </span>
            </div>
          </div>
          <div v-if="filteredTeachers.length === 0" class="no-teachers">
            No teachers found
          </div>
        </div>

        <!-- Selected teachers display -->
        <div class="selected-teachers" v-if="selectedTeacherIds.length">
          <span v-for="tid in selectedTeacherIds" :key="tid" class="selected-teacher">
            {{ getTeacherName(tid) }}
          </span>
        </div>
      </div>

      <!-- Termin inputs -->
      <div class="form-group" v-if="getSubjectName(selectedSubject) === 'Termin'">
        <label for="meeting">Meeting Title:</label>
        <input id="meeting" v-model="meetingName" type="text" placeholder="Enter meeting title">
      </div>
      <div class="form-group" v-if="getSubjectName(selectedSubject) === 'Termin'">
        <label for="notes">Notes:</label>
        <textarea id="notes" v-model="notes" placeholder="Enter meeting notes" rows="3"></textarea>
      </div>

      <!-- Room dropdown always shown -->
      <div class="form-group">
        <label for="room">Room:</label>
        <select id="room" v-model="selectedRoom">
          <option value="">Select Room</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.name }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button class="cancel-btn" type="button" @click="onClose">Cancel</button>
        <button class="save-btn" type="button" @click="onSave">
          {{ isEditing ? 'Update' : 'Add' }} Lesson
        </button>
        <button v-if="isEditing" class="delete-btn" type="button" @click="onDelete">
          Delete
        </button>
      </div>
    </form>
  </div>
</template>

<script>
  import { ref, computed, watch } from 'vue';

export default {
  name: 'InlineLessonForm',
  props: {
    show: { type: Boolean, default: false },
    position: { type: Object, default: () => ({ top: '0px', left: '0px' }) },
    teacher: { type: String, default: '' },
    teacherId: { type: String, default: null },
    class: { type: String, default: '' },
    classId: { type: String, default: null },
    teachers: { type: Array, default: () => [] },
    selectedTeacherIds: { type: Array, default: () => [] },
    day: { type: String, default: '' },
    dayId: { type: String, default: null },
    period: { type: [Number, String], default: 0 },
    periodId: { type: String, default: null },
    subjects: { type: Array, default: () => [] },
    classes: { type: Array, default: () => [] },
    rooms: { type: Array, default: () => [] },
    viewMode: { type: String, default: 'teacher' },
    existingLesson: { type: Object, default: null },
    selectedSubjectId: { type: String, default: '' },
    selectedClassId: { type: String, default: '' },
    selectedRoomId: { type: String, default: '' }
  },
  emits: ['close', 'save', 'delete', 'teacherIdsChange'],
  setup(props, { emit }) {
    const selectedSubject = ref('');
    const selectedClass = ref('');
    const selectedTeacherIds = ref([]);
    const selectedRoom = ref('');
    const meetingName = ref('');
    const notes = ref('');
    const teacherSearch = ref('');

    const isEditing = computed(() => !!props.existingLesson);

    const getSubjectName = (subjectId) => {
      const subject = props.subjects.find(s => s.id === subjectId);
      return subject?.name || '';
    };

    // Helper functions for teacher data
    const getTeacherId = (teacher) => {
      return teacher.user_id || teacher.id || teacher.profile_id;
    };

    const getTeacherDisplayName = (teacher) => {
      if (teacher.name) {
        return teacher.name;
      }
      if (teacher.first_name && teacher.last_name) {
        return `${teacher.first_name} ${teacher.last_name}`;
      }
      if (teacher.first_name) {
        return teacher.first_name;
      }
      if (teacher.last_name) {
        return teacher.last_name;
      }
      return 'Unknown Teacher';
    };

    const getTeacherAbbr = (teacher) => {
      if (teacher.kurzung) {
        return teacher.kurzung;
      }
      if (teacher.first_name && teacher.last_name) {
        return `${teacher.first_name.charAt(0)}${teacher.last_name.slice(0, 2)}`;
      }
      return '';
    };

    // Filtered and sorted teachers
    const filteredTeachers = computed(() => {
      let filtered = [...props.teachers];
      
      // Filter by search
      if (teacherSearch.value.trim()) {
        const search = teacherSearch.value.toLowerCase();
        filtered = filtered.filter(teacher => {
          const name = getTeacherDisplayName(teacher).toLowerCase();
          const abbr = getTeacherAbbr(teacher).toLowerCase();
          return name.includes(search) || abbr.includes(search);
        });
      }
      
      // Sort alphabetically by name
      filtered.sort((a, b) => {
        const nameA = getTeacherDisplayName(a).toLowerCase();
        const nameB = getTeacherDisplayName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      return filtered;
    });

    // Check if teacher is selected
    const isSelected = (teacher) => {
      const id = String(getTeacherId(teacher));
      return selectedTeacherIds.value.includes(id);
    };

    // Toggle teacher selection
    const toggleTeacher = (teacher) => {
      const id = String(getTeacherId(teacher));
      const index = selectedTeacherIds.value.indexOf(id);
      
      if (index === -1) {
        selectedTeacherIds.value.push(id);
      } else {
        selectedTeacherIds.value.splice(index, 1);
      }
    };

    // Use teacher ID to get name (for display)
    const getTeacherName = (teacherId) => {
      const teacher = props.teachers.find(
        t => String(getTeacherId(t)) === String(teacherId)
      );
      return teacher ? getTeacherDisplayName(teacher) : 'Unknown';
    };

    // Initialize fields for edit or add
    watch(
      () => [props.show, props.existingLesson],
      () => {
        if (props.show) {
          if (props.existingLesson) {
            selectedSubject.value = props.existingLesson.subject_id || '';
            selectedClass.value = props.viewMode === 'teacher'
              ? (props.existingLesson.class_id || '')
              : (props.classId || '');
            selectedRoom.value = props.existingLesson.room_id || '';
            meetingName.value = props.existingLesson.meeting_name || '';
            notes.value = props.existingLesson.notes || '';
            selectedTeacherIds.value = Array.isArray(props.existingLesson.staff_ids)
              ? props.existingLesson.staff_ids.map(String)
              : (props.existingLesson.teacher_id ? [String(props.existingLesson.teacher_id)] : []);
          } else {
            selectedSubject.value = props.selectedSubjectId || '';
            selectedClass.value = props.viewMode === 'teacher'
              ? (props.selectedClassId || '')
              : (props.classId || '');
            selectedRoom.value = props.selectedRoomId || '';
            meetingName.value = '';
            notes.value = '';
            selectedTeacherIds.value = Array.isArray(props.selectedTeacherIds)
              ? props.selectedTeacherIds.map(String)
              : [];
          }
          teacherSearch.value = '';
        }
      },
      { immediate: true }
    );

    // Emit teacher IDs change to parent when selection changes
    watch(selectedTeacherIds, (newVal) => {
      emit('teacherIdsChange', newVal);
    });

    const onClose = () => {
      emit('close');
    };

    const onSave = () => {
      const teacherIds = selectedTeacherIds.value;
      const teacherNames = teacherIds.map(getTeacherName).filter(Boolean);

      const lessonData = {
        teacher: props.viewMode === 'teacher' ? props.teacher : null,
        teacherId: props.viewMode === 'teacher' ? props.teacherId : null,
        staff_ids: teacherIds,
        teacher_names: teacherNames,
        class: props.viewMode === 'class' ? props.class : null,
        classId: props.viewMode === 'class' ? props.classId : selectedClass.value,
        day: props.day,
        dayId: props.dayId,
        period: props.period,
        periodId: props.periodId,
        subjectId: selectedSubject.value,
        roomId: selectedRoom.value,
        id: props.existingLesson?.id || `draft-${Date.now()}`,
        meeting_name: meetingName.value,
        notes: notes.value
      };

      if (props.existingLesson) {
        emit('save', lessonData, 'updateLesson');
      } else {
        emit('save', lessonData);
      }
    };

    const onDelete = () => {
      if (props.existingLesson) {
        emit('delete', {
          id: props.existingLesson.id
        });
      }
    };

    const handleKeydown = (event) => {
      if (
        event.key === 'Enter' &&
        event.target.tagName !== 'TEXTAREA' &&
        !event.target.classList.contains('teacher-search-input')
      ) {
        event.preventDefault();
        onSave();
      }
    };

    return {
      selectedSubject,
      selectedClass,
      selectedTeacherIds,
      selectedRoom,
      meetingName,
      notes,
      teacherSearch,
      isEditing,
      getSubjectName,
      getTeacherName,
      getTeacherId,
      getTeacherDisplayName,
      getTeacherAbbr,
      filteredTeachers,
      isSelected,
      toggleTeacher,
      onClose,
      onSave,
      onDelete,
      handleKeydown
    };
  }
};
</script>

<style lang="scss" scoped>
  .inline-lesson-form {
    position: absolute;
    z-index: 1000;
    background: white;
    border-radius: 8px;
    width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #ddd;

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #eee;

      h3 {
        margin: 0;
        font-size: 16px;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        color: #666;

        &:hover {
          color: #000;
        }
      }
    }

    .form-content {
      padding: 15px;

      .form-info {
        background-color: #f9f9f9;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 15px;
        font-size: 14px;

        .info-row {
          margin-bottom: 5px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .form-group {
        margin-bottom: 12px;

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 14px;
        }

        select,
        input,
        textarea {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;

          &:focus {
            outline: none;
            border-color: #007bff;
          }
        }

        .teacher-search-input {
          margin-bottom: 8px;
        }

        .teacher-list {
          max-height: 140px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          margin-bottom: 8px;

          .teacher-item {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            cursor: pointer;
            border-bottom: 1px solid #f5f5f5;
            transition: background-color 0.15s;

            &:hover {
              background-color: #f8f9fa;
            }

            &.selected {
              background-color: #e7f3ff;
            }

            &:last-child {
              border-bottom: none;
            }

            input[type="checkbox"] {
              margin-right: 10px;
              pointer-events: none;
              width: auto;
            }

            .teacher-info {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;

              .teacher-name {
                font-size: 14px;
                color: #333;
                font-weight: 500;
              }

              .teacher-abbr {
                font-size: 11px;
                color: #6c757d;
                background: #f1f3f4;
                border-radius: 3px;
                padding: 2px 5px;
                margin-left: 8px;
                font-weight: 500;
              }
            }
          }

          .no-teachers {
            padding: 12px;
            text-align: center;
            color: #666;
            font-style: italic;
            font-size: 13px;
          }
        }

        .selected-teachers {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .selected-teacher {
            background: #e9f5ff;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            color: #0066cc;
            font-weight: 500;
          }
        }

        textarea {
          resize: vertical;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 15px;

        button {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid;
          font-weight: 500;

          &.cancel-btn {
            background-color: #f8f9fa;
            border-color: #ddd;
            color: #333;

            &:hover {
              background-color: #e9ecef;
            }
          }

          &.save-btn {
            background-color: #007bff;
            border-color: #007bff;
            color: white;

            &:hover {
              background-color: #0069d9;
              border-color: #0062cc;
            }
          }

          &.delete-btn {
            background-color: #dc3545;
            border-color: #dc3545;
            color: white;

            &:hover {
              background-color: #c82333;
              border-color: #bd2130;
            }
          }
        }
      }
    }
  }
</style>
