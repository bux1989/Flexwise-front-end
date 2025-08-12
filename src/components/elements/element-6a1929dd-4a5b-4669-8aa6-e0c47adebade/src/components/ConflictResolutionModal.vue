<template>
  <div v-if="show" class="conflict-resolution-modal-overlay" @click.self="$emit('close')">
    <div class="conflict-resolution-modal">
      <div class="modal-header">
        <h3>{{ t('resolveConflict') }}</h3>
        <button class="close-btn" @click="$emit('close')" :title="t('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- Conflict Overview -->
        <div class="conflict-overview">
          <div class="conflict-info">
            <h4>{{ formatConflictType(conflict.type) }}</h4>
            <p class="conflict-location">
              <strong>{{ conflict.dayName }} - {{ getPeriodName(conflict) }}</strong>
            </p>
            <p class="conflict-description">{{ conflict.message }}</p>
            <div class="conflict-severity" :class="conflict.severity">
              {{ conflict.severity === 'error' ? t('blocking') : t('warning') }}
            </div>
          </div>
        </div>

        <!-- Lessons List -->
        <div class="lessons-section">
          <h4>{{ t('involvedLessons') }} ({{ normalizedLessons.length }})</h4>
          
          <div v-if="normalizedLessons.length === 0" class="no-lessons">
            {{ t('noLessonsFound') }}
          </div>

          <div v-else class="lessons-list">
            <div 
              v-for="(lesson, index) in normalizedLessons" 
              :key="lesson.id || index"
              class="lesson-item"
              :class="{ 'editing': editingLessonIndex === index }"
            >
              <div class="lesson-header">
                <div class="lesson-info">
                  <h5>{{ t('lesson') }} {{ index + 1 }}: {{ lesson.class_name || t('unknownClass') }}</h5>
                  <div class="lesson-details">
                    <span v-if="lesson.teacher_names && lesson.teacher_names.length > 0" class="teacher">
                      Teacher: {{ lesson.teacher_names.join(', ') }}
                    </span>
                    <span v-if="lesson.subject_name" class="subject">
                      Subject: {{ lesson.subject_name }}
                    </span>
                    <span v-if="lesson.room_name" class="room">
                      Room: {{ lesson.room_name }}
                    </span>
                  </div>
                </div>
                <div class="lesson-actions">
                  <button 
                    class="action-btn edit-btn"
                    @click="toggleEditLesson(index)"
                    :title="editingLessonIndex === index ? t('cancelEdit') : t('editLesson')"
                  >
                    {{ editingLessonIndex === index ? 'Cancel' : 'Edit' }}
                  </button>

                  <button 
                    class="action-btn delete-btn"
                    @click="deleteLesson(lesson, index)"
                    :title="t('deleteLesson')"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <!-- Inline Edit Form for this lesson -->
              <div v-if="editingLessonIndex === index" class="lesson-edit-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ t('teachers') }}</label>
                    <div class="teachers-selection">
                      <!-- Search input -->
                      <input
                        v-model="teacherSearch"
                        type="text"
                        :placeholder="t('searchTeachers')"
                        class="teacher-search-input"
                      />
                      
                      <!-- Teacher list -->
                      <div class="teacher-list">
                        <div v-for="teacher in filteredTeachers" 
                             :key="getTeacherId(teacher)" 
                             class="teacher-item"
                             :class="{ selected: isTeacherSelected(teacher) }" 
                             @click="toggleTeacher(teacher)">
                          <input
                            type="checkbox"
                            :checked="isTeacherSelected(teacher)"
                            @change.stop="toggleTeacher(teacher)"
                          />
                          <div class="teacher-info">
                            <span class="teacher-name">{{ getTeacherDisplayName(teacher) }}</span>
                            <span class="teacher-abbr" v-if="getTeacherAbbr(teacher)">
                              ({{ getTeacherAbbr(teacher) }})
                            </span>
                          </div>
                        </div>
                        <div v-if="filteredTeachers.length === 0" class="no-teachers-found">
                          {{ t('noTeachersFound') }}
                        </div>
                      </div>
                      
                      <!-- Selected teachers display -->
                      <div class="selected-teachers" v-if="editingLesson.teacherIds && editingLesson.teacherIds.length">
                        <span v-for="tid in editingLesson.teacherIds" :key="tid" class="selected-teacher">
                          {{ getTeacherNameById(tid) }}
                          <button type="button" @click.stop="toggleTeacherById(tid)" class="remove-teacher">×</button>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>{{ t('class') }}</label>
                    <select 
                      v-model="editingLesson.classId" 
                      class="form-control"
                      @change="updateEditingLesson"
                    >
                      <option value="">{{ t('selectClass') }}</option>
                      <option 
                        v-for="cls in availableClasses" 
                        :key="cls.id" 
                        :value="cls.id"
                      >
                        {{ cls.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ t('subject') }}</label>
                    <select 
                      v-model="editingLesson.subjectId" 
                      class="form-control"
                      @change="updateEditingLesson"
                    >
                      <option value="">{{ t('selectSubject') }}</option>
                      <option 
                        v-for="subject in availableSubjects" 
                        :key="subject.id" 
                        :value="subject.id"
                      >
                        {{ subject.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ t('room') }}</label>
                    <select 
                      v-model="editingLesson.roomId" 
                      class="form-control"
                      @change="updateEditingLesson"
                    >
                      <option value="">{{ t('selectRoom') }}</option>
                      <option 
                        v-for="room in availableRooms" 
                        :key="room.id" 
                        :value="room.id"
                      >
                        {{ room.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>{{ t('day') }}</label>
                    <select 
                      v-model="editingLesson.dayId" 
                      class="form-control"
                      @change="updateEditingLesson"
                    >
                      <option 
                        v-for="day in availableDays" 
                        :key="day.day_id" 
                        :value="day.day_id"
                      >
                        {{ day.displayName }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ t('period') }}</label>
                    <select 
                      v-model="editingLesson.periodId" 
                      class="form-control"
                      @change="updateEditingLesson"
                    >
                      <option 
                        v-for="period in availablePeriods" 
                        :key="period.id" 
                        :value="period.id"
                      >
                        {{ period.label || period.name || `${t('period')} ${period.block_number}` }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="form-actions">
                  <button 
                    class="btn btn-primary"
                    @click="saveEditingLesson"
                    :disabled="!isEditingLessonValid"
                  >
                    {{ t('saveChanges') }}
                  </button>
                  <button 
                    class="btn btn-secondary"
                    @click="cancelEditingLesson"
                  >
                    {{ t('cancel') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <div class="modal-footer">
        <div class="footer-info">
          <span v-if="conflict.severity === 'error'" class="blocking-warning">
            {{ t('blockingConflictWarning') }}
          </span>
        </div>
        <div class="footer-actions">
          <button 
            v-if="conflict.severity === 'warning'"
            class="btn btn-warning"
            @click="ignoreConflict"
          >
            {{ t('ignoreConflict') }}
          </button>
          <button class="btn btn-secondary" @click="$emit('close')">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import { CONFLICT_TYPES } from '../utils/conflictDetection';

export default {
  name: 'ConflictResolutionModal',
  props: {
    show: { type: Boolean, default: false },
    conflict: { type: Object, default: () => ({}) },
    language: { type: String, default: 'de' },
    availableClasses: { type: Array, default: () => [] },
    availableTeachers: { type: Array, default: () => [] },
    availableSubjects: { type: Array, default: () => [] },
    availableRooms: { type: Array, default: () => [] },
    availableDays: { type: Array, default: () => [] },
    availablePeriods: { type: Array, default: () => [] },
    periods: { type: Array, default: () => [] }
  },
  emits: ['close', 'saveLesson', 'deleteLesson', 'ignoreConflict'],
  setup(props, { emit }) {
    const editingLessonIndex = ref(-1);
    const editingLesson = ref({});
    const teacherSearch = ref('');

    // Normalize lessons - handle both single lesson and multi-lesson conflicts
    const normalizedLessons = computed(() => {
      if (props.conflict.lessons && Array.isArray(props.conflict.lessons)) {
        // Multi-lesson conflicts (teacher/room/class double booking)
        return props.conflict.lessons;
      } else if (props.conflict.lesson) {
        // Single-lesson conflicts (missing data, inactive room, wrong room)
        return [props.conflict.lesson];
      }
      return [];
    });

    // Watch for prop changes
    watch(() => props.conflict, (newConflict, oldConflict) => {
      // Conflict data updated - no action needed
    }, { immediate: true });

    watch(() => props.show, (newShow) => {
      // Modal visibility changed - no action needed
    });

    // Translations
    const translations = {
      de: {
        resolveConflict: 'Konflikt beheben',
        close: 'Schließen',
        blocking: 'Blockierend',
        warning: 'Warnung',
        involvedLessons: 'Betroffene Stunden',
        noLessonsFound: 'Keine Stunden gefunden',
        lesson: 'Stunde',
        unknownClass: 'Unbekannte Klasse',
        editLesson: 'Stunde bearbeiten',
        cancelEdit: 'Bearbeitung abbrechen',
        deleteLesson: 'Stunde löschen',
        teachers: 'Lehrer',
        noTeachersFound: 'Keine Lehrer gefunden',
        searchTeachers: 'Lehrer suchen...',
        class: 'Klasse',
        subject: 'Fach',
        room: 'Raum',
        day: 'Tag',
        period: 'Periode',
        selectTeacher: 'Lehrer auswählen',
        selectClass: 'Klasse auswählen',
        selectSubject: 'Fach auswählen',
        selectRoom: 'Raum auswählen',
        saveChanges: 'Änderungen speichern',
        cancel: 'Abbrechen',
        ignoreConflict: 'Konflikt ignorieren',
        blockingConflictWarning: 'Dieser blockierende Konflikt muss behoben werden, bevor der Stundenplan veröffentlicht werden kann.',
        confirmDeleteLesson: 'Sind Sie sicher, dass Sie diese Stunde löschen möchten?',
        [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Lehrer Doppelbelegung',
        [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Raum Doppelbelegung',
        [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Klasse Doppelbelegung',
        [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Lehrer Überlastung',
        [CONFLICT_TYPES.ROOM_INACTIVE]: 'Raum Inaktiv',
        [CONFLICT_TYPES.MISSING_DATA]: 'Fehlende Daten',
        [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Klasse im falschen Raum'
      },
      en: {
        resolveConflict: 'Resolve Conflict',
        close: 'Close',
        blocking: 'Blocking',
        warning: 'Warning',
        involvedLessons: 'Involved Lessons',
        noLessonsFound: 'No lessons found',
        lesson: 'Lesson',
        unknownClass: 'Unknown Class',
        editLesson: 'Edit lesson',
        cancelEdit: 'Cancel edit',
        deleteLesson: 'Delete lesson',
        teachers: 'Teachers',
        noTeachersFound: 'No teachers found',
        searchTeachers: 'Search teachers...',
        class: 'Class',
        subject: 'Subject',
        room: 'Room',
        day: 'Day',
        period: 'Period',
        selectTeacher: 'Select teacher',
        selectClass: 'Select class',
        selectSubject: 'Select subject',
        selectRoom: 'Select room',
        saveChanges: 'Save changes',
        cancel: 'Cancel',
        ignoreConflict: 'Ignore conflict',
        blockingConflictWarning: 'This blocking conflict must be resolved before the schedule can be published.',
        confirmDeleteLesson: 'Are you sure you want to delete this lesson?',
        [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Teacher Double-booking',
        [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Room Double-booking',
        [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Class Double-booking',
        [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Teacher Overload',
        [CONFLICT_TYPES.ROOM_INACTIVE]: 'Room Inactive',
        [CONFLICT_TYPES.MISSING_DATA]: 'Missing Data',
        [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Class in Wrong Room'
      }
    };

    const t = (key) => {
      return translations[props.language]?.[key] || key;
    };

    // Format conflict type for display
    const formatConflictType = (type) => {
      return t(type);
    };

    // Get period name by periodId or blockNumber
    const getPeriodName = (conflict) => {
      if (!props.periods || props.periods.length === 0) {
        return `${t('period')} ${conflict.blockNumber}`;
      }
      
      let period = props.periods.find(p => p.id === conflict.periodId);
      if (!period && conflict.blockNumber) {
        period = props.periods.find(p => p.block_number === conflict.blockNumber);
      }
      
      if (period && period.label) {
        return period.label;
      } else if (period && period.name) {
        return period.name;
      } else {
        return `${t('period')} ${conflict.blockNumber}`;
      }
    };

    // Check if editing lesson is valid
    const isEditingLessonValid = computed(() => {
      return editingLesson.value.dayId && editingLesson.value.periodId;
    });

    // Get teacher names from a lesson
    const getTeacherNames = (lesson) => {
      if (!lesson || !lesson.teacher_names) return [];
      return lesson.teacher_names;
    };

    // Teacher selection methods
    const filteredTeachers = computed(() => {
      if (!props.availableTeachers) return [];
      if (!teacherSearch.value) return props.availableTeachers;
      
      const search = teacherSearch.value.toLowerCase();
      return props.availableTeachers.filter(teacher => 
        getTeacherDisplayName(teacher).toLowerCase().includes(search) ||
        (getTeacherAbbr(teacher) && getTeacherAbbr(teacher).toLowerCase().includes(search))
      );
    });

    const getTeacherId = (teacher) => {
      return teacher.id || teacher.staff_id || teacher.teacher_id || teacher.user_id || teacher.profile_id;
    };

    const getTeacherDisplayName = (teacher) => {
      return teacher.display_name || teacher.name || teacher.full_name || 
             (teacher.first_name && teacher.last_name ? `${teacher.first_name} ${teacher.last_name}` : '') ||
             teacher.first_name || teacher.last_name || 'Unknown Teacher';
    };

    const getTeacherAbbr = (teacher) => {
      return teacher.abbreviation || teacher.abbr || teacher.code;
    };

    const getTeacherNameById = (teacherId) => {
      const teacher = props.availableTeachers.find(t => {
        const tId = getTeacherId(t);
        return String(tId) === String(teacherId);
      });
      
      return teacher ? getTeacherDisplayName(teacher) : 'Unknown Teacher';
    };

    const isTeacherSelected = (teacher) => {
      if (!editingLesson.value.teacherIds || !Array.isArray(editingLesson.value.teacherIds)) {
        return false;
      }
      const teacherId = getTeacherId(teacher);
      const teacherIdStr = String(teacherId); // Convert to string for comparison
      return editingLesson.value.teacherIds.map(String).includes(teacherIdStr);
    };

    const toggleTeacherById = (teacherId) => {
      if (editingLesson.value.teacherIds) {
        // Convert to string for consistent comparison
        const teacherIdStr = String(teacherId);
        const currentIds = editingLesson.value.teacherIds.map(String);
        const index = currentIds.indexOf(teacherIdStr);
        if (index > -1) {
          editingLesson.value.teacherIds.splice(index, 1);
          updateEditingLesson();
        }
      }
    };

    const toggleTeacher = (teacher) => {
      const teacherId = getTeacherId(teacher);
      const teacherIdStr = String(teacherId); // Convert to string for consistency
      
      if (!editingLesson.value.teacherIds) {
        editingLesson.value.teacherIds = [];
      }
      
      // Convert all existing IDs to strings for comparison
      const currentIds = editingLesson.value.teacherIds.map(String);
      const index = currentIds.indexOf(teacherIdStr);
      
      if (index > -1) {
        editingLesson.value.teacherIds.splice(index, 1);
      } else {
        editingLesson.value.teacherIds.push(teacherIdStr);
      }
      
      updateEditingLesson();
    };


    const toggleEditLesson = (index) => {
      if (editingLessonIndex.value === index) {
        editingLessonIndex.value = -1;
        editingLesson.value = {};
        teacherSearch.value = '';
      } else {
        editingLessonIndex.value = index;
        const lesson = normalizedLessons.value[index];
        
        // Extract teacher IDs more carefully, filtering out null/undefined/empty values
        // Follow the same pattern as InlineLessonForm: use staff_ids first, then teacher_ids, then teacher_id
        const teacherIds = [];
        if (lesson.staff_ids && Array.isArray(lesson.staff_ids)) {
          teacherIds.push(...lesson.staff_ids.filter(id => id && id !== 'undefined' && id !== null));
        } else if (lesson.teacher_ids && Array.isArray(lesson.teacher_ids)) {
          teacherIds.push(...lesson.teacher_ids.filter(id => id && id !== 'undefined' && id !== null));
        } else if (lesson.teacher_id) {
          teacherIds.push(lesson.teacher_id);
        }
        
        editingLesson.value = {
          id: lesson.id,
          classId: lesson.class_id,
          subjectId: lesson.subject_id,
          roomId: lesson.room_id,
          dayId: lesson.day_id,
          periodId: lesson.period_id,
          teacherIds: teacherIds,
          originalLesson: lesson
        };
        
        teacherSearch.value = '';
      }
    };

    const updateEditingLesson = () => {
      // Trigger reactivity update
      editingLesson.value = { ...editingLesson.value };
    };

    const saveEditingLesson = () => {
      if (!isEditingLessonValid.value) {
        return;
      }
      
      emit('saveLesson', {
        lesson: editingLesson.value,
        originalLesson: editingLesson.value.originalLesson,
        conflict: props.conflict
      });
      
      editingLessonIndex.value = -1;
      editingLesson.value = {};
    };

    const cancelEditingLesson = () => {
      editingLessonIndex.value = -1;
      editingLesson.value = {};
      teacherSearch.value = '';
    };



    const deleteLesson = (lesson, index) => {
      if (confirm(t('confirmDeleteLesson'))) {
        emit('deleteLesson', { lesson, index, conflict: props.conflict });
      }
    };

    const ignoreConflict = () => {
      emit('ignoreConflict', props.conflict);
    };

    return {
      normalizedLessons,
      editingLessonIndex,
      editingLesson,
      teacherSearch,
      filteredTeachers,
      isEditingLessonValid,
      t,
      formatConflictType,
      getPeriodName,
      getTeacherNames,
      getTeacherId,
      getTeacherDisplayName,
      getTeacherAbbr,
      getTeacherNameById,
      isTeacherSelected,
      toggleTeacher,
      toggleTeacherById,
      toggleEditLesson,
      updateEditingLesson,
      saveEditingLesson,
      cancelEditingLesson,
      deleteLesson,
      ignoreConflict
    };
  }
};
</script>

<style lang="scss" scoped>
.conflict-resolution-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.conflict-resolution-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #495057;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
      background: #e9ecef;
      color: #495057;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.conflict-overview {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #dc3545;

  .conflict-info {
    flex: 1;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #495057;
    }

    .conflict-location {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #007bff;
    }

    .conflict-description {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #495057;
      line-height: 1.4;
    }

    .conflict-severity {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;

      &.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      &.warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
    }
  }
}

.lessons-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #495057;
  }

  .no-lessons {
    padding: 20px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .lessons-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .lesson-item {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: white;
      transition: all 0.15s ease;

      &.editing {
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      .lesson-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;

        .lesson-info {
          flex: 1;

          h5 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #495057;
          }

          .lesson-details {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;

            span {
              font-size: 12px;
              color: #6c757d;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
        }

        .lesson-actions {
          display: flex;
          gap: 4px;

          .action-btn {
            padding: 6px 8px;
            border: 1px solid #ced4da;
            background: white;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;

            &:hover {
              border-color: #007bff;
              background: #f8f9fa;
            }

            &.edit-btn {
              color: #28a745;
              &:hover {
                background: #28a745;
                color: white;
              }
            }



            &.delete-btn {
              color: #dc3545;
              &:hover {
                background: #dc3545;
                color: white;
              }
            }
          }
        }
      }

      .lesson-edit-form {
        padding: 16px;
        border-top: 1px solid #dee2e6;
        background: #f8f9fa;

        .form-row {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;

          .form-group {
            flex: 1;

            label {
              display: block;
              margin-bottom: 4px;
              font-size: 12px;
              font-weight: 500;
              color: #495057;
            }

            .form-control {
              width: 100%;
              padding: 6px 8px;
              border: 1px solid #ced4da;
              border-radius: 4px;
              font-size: 12px;

              &:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
              }
            }

            .teachers-selection {
              .teacher-search-input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 12px;
                margin-bottom: 8px;

                &:focus {
                  outline: none;
                  border-color: #007bff;
                  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }
              }

              .teacher-list {
                max-height: 120px;
                overflow-y: auto;
                border: 1px solid #ced4da;
                border-radius: 4px;
                margin-bottom: 8px;

                .teacher-item {
                  display: flex;
                  align-items: center;
                  padding: 6px 8px;
                  border-bottom: 1px solid #f8f9fa;
                  cursor: pointer;
                  transition: background-color 0.15s ease;

                  &:hover {
                    background: #f8f9fa;
                  }

                  &.selected {
                    background: #e3f2fd;
                  }

                  &:last-child {
                    border-bottom: none;
                  }

                  input[type="checkbox"] {
                    margin-right: 8px;
                  }

                  .teacher-info {
                    flex: 1;
                    font-size: 12px;

                    .teacher-name {
                      font-weight: 500;
                      color: #495057;
                    }

                    .teacher-abbr {
                      color: #6c757d;
                      margin-left: 4px;
                    }
                  }
                }

                .no-teachers-found {
                  padding: 12px;
                  text-align: center;
                  color: #6c757d;
                  font-style: italic;
                  font-size: 12px;
                }
              }

              .selected-teachers {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;

                .selected-teacher {
                  background: #e9ecef;
                  border: 1px solid #ced4da;
                  border-radius: 12px;
                  padding: 2px 8px;
                  font-size: 11px;
                  color: #495057;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  
                  .remove-teacher {
                    background: none;
                    border: none;
                    color: #6c757d;
                    cursor: pointer;
                    font-size: 12px;
                    line-height: 1;
                    padding: 0;
                    width: 14px;
                    height: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    
                    &:hover {
                      background: #dc3545;
                      color: white;
                    }
                  }
                }
              }
            }

            .teachers-display {
              .current-teachers {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 8px;

                .teacher-tag {
                  background: #e9ecef;
                  border: 1px solid #ced4da;
                  border-radius: 12px;
                  padding: 2px 8px;
                  font-size: 11px;
                  color: #495057;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                }
              }

              .no-teachers {
                font-style: italic;
                color: #6c757d;
                font-size: 11px;
                margin-bottom: 8px;
              }

              .teachers-note {
                color: #6c757d;
                font-size: 10px;
                line-height: 1.3;
              }
            }
          }
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;

          .btn {
            padding: 6px 12px;
            border: 1px solid;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            &.btn-primary {
              background: #007bff;
              border-color: #007bff;
              color: white;

              &:hover:not(:disabled) {
                background: #0056b3;
                border-color: #0056b3;
              }
            }

            &.btn-secondary {
              background: #6c757d;
              border-color: #6c757d;
              color: white;

              &:hover {
                background: #545b62;
                border-color: #545b62;
              }
            }
          }
        }
      }
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;

  .footer-info {
    flex: 1;

    .blocking-warning {
      font-size: 12px;
      color: #dc3545;
      font-weight: 500;
    }
  }

  .footer-actions {
    display: flex;
    gap: 8px;

    .btn {
      padding: 8px 16px;
      border: 1px solid;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;

      &.btn-warning {
        background: #ffc107;
        border-color: #ffc107;
        color: #212529;

        &:hover {
          background: #e0a800;
          border-color: #e0a800;
        }
      }

      &.btn-secondary {
        background: #6c757d;
        border-color: #6c757d;
        color: white;

        &:hover {
          background: #545b62;
          border-color: #545b62;
        }
      }
    }
  }
}
</style>