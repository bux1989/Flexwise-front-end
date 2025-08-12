<template>
  <div v-if="show" class="conflict-panel">
    <div class="conflict-header">
      <h3>{{ t('conflictDetails') }}</h3>
      <div class="conflict-actions">
        <button class="collapse-btn" @click="$emit('collapse')">
          {{ t('collapse') }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="conflict-filters">
      <div class="filter-group">
        <label>{{ t('filterBy') }}:</label>
        <select v-model="filterClass" class="filter-select">
          <option value="">{{ t('allClasses') }}</option>
          <option v-for="cls in availableClasses" :key="cls.id" :value="cls.name">
            {{ cls.name }}
          </option>
        </select>
        <select v-model="filterTeacher" class="filter-select">
          <option value="">{{ t('allTeachers') }}</option>
          <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.name">
            {{ teacher.name }}
          </option>
        </select>
        <select v-model="filterSubject" class="filter-select">
          <option value="">{{ t('allSubjects') }}</option>
          <option v-for="subject in availableSubjects" :key="subject.id" :value="subject.name">
            {{ subject.name }}
          </option>
        </select>
        <select v-model="filterRoom" class="filter-select">
          <option value="">{{ t('allRooms') }}</option>
          <option v-for="room in availableRooms" :key="room.id" :value="room.name">
            {{ room.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Conflict List -->
    <div class="conflict-list">
      <div v-if="filteredConflicts.length === 0" class="no-conflicts">
        {{ hasFilters ? t('noConflictsMatchFilter') : t('noConflictsFound') }}
      </div>
      
      <div 
        v-for="conflict in filteredConflicts" 
        :key="getConflictKey(conflict)"
        class="conflict-item"
        :class="{ 
          'error': conflict.severity === 'error',
          'warning': conflict.severity === 'warning',
          'ignored': isConflictIgnored(conflict)
        }"
      >

        
        <div class="conflict-details">
          <div class="conflict-type">
            {{ formatConflictType(conflict.type) }}
          </div>
          <div class="conflict-location">
            <strong>{{ conflict.dayName }} - {{ getPeriodName(conflict) }}</strong>
          </div>
          <div class="conflict-description">
            {{ conflict.message }}
          </div>
          <div class="conflict-affected" v-if="getAffectedItems(conflict)">
            <span class="affected-label">{{ t('affected') }}:</span>
            {{ getAffectedItems(conflict) }}
          </div>
        </div>

        <div class="conflict-actions">
          <!-- Multi-lesson conflict resolution button -->
          <template v-if="conflict.lessons && conflict.lessons.length > 1">
            <button
              class="action-btn resolve-btn"
              @click="openConflictResolution(conflict)"
              :title="t('resolveConflict')"
            >
              🔧 {{ t('resolveConflict') }}
            </button>
          </template>
          
          <!-- Single lesson edit button -->
          <button 
            v-else-if="conflict.lessonId || (conflict.lessons && conflict.lessons.length === 1)"
            class="action-btn edit-btn" 
            @click="openConflictResolution(conflict)"
            :title="t('editLesson')"
          >
            {{ t('edit') }}
          </button>
          
          <button 
            v-if="conflict.severity === 'warning'"
            class="action-btn ignore-btn"
            :class="{ active: isConflictIgnored(conflict) }"
            @click="toggleIgnoreConflict(conflict)"
            :title="isConflictIgnored(conflict) ? t('unignoreConflict') : t('ignoreConflict')"
          >
            {{ isConflictIgnored(conflict) ? t('unignore') : t('ignore') }}
          </button>

        </div>
      </div>
    </div>

    <!-- Conflict Resolution Modal -->
    <ConflictResolutionModal
      :show="showResolutionModal"
      :conflict="selectedConflict"
      :language="language"
      :availableClasses="availableClasses"
      :availableTeachers="availableTeachers"
      :availableSubjects="availableSubjects"
      :availableRooms="availableRooms"
      :availableDays="availableDays"
      :availablePeriods="periods"
      :periods="periods"
      @close="closeConflictResolution"
      @saveLesson="saveLessonFromModal"
      @deleteLesson="deleteLessonFromModal"
      @ignoreConflict="ignoreConflictFromModal"
    />
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { formatConflictMessage, CONFLICT_TYPES } from '../utils/conflictDetection';
import ConflictResolutionModal from './ConflictResolutionModal.vue';

export default {
  name: 'ConflictPanel',
  components: {
    ConflictResolutionModal
  },
  props: {
    show: { type: Boolean, default: false },
    conflicts: { type: Array, default: () => [] },
    language: { type: String, default: 'de' },
    availableClasses: { type: Array, default: () => [] },
    availableTeachers: { type: Array, default: () => [] },
    availableSubjects: { type: Array, default: () => [] },
    availableRooms: { type: Array, default: () => [] },
    availableDays: { type: Array, default: () => [] },
    periods: { type: Array, default: () => [] },
    ignoredConflicts: { type: Array, default: () => [] }
  },
  emits: ['collapse', 'edit', 'toggleIgnore', 'saveLesson', 'deleteLesson'],
  setup(props, { emit }) {
    const filterClass = ref('');
    const filterTeacher = ref('');
    const filterSubject = ref('');
    const filterRoom = ref('');
    const showResolutionModal = ref(false);
    const selectedConflict = ref({});

    // Translations
    const translations = {
      de: {
        conflictDetails: 'Konflikt Details',
        collapse: 'Einklappen',
        filterBy: 'Filter nach',
        allClasses: 'Alle Klassen',
        allTeachers: 'Alle Lehrer',
        allSubjects: 'Alle Fächer',
        allRooms: 'Alle Räume',
        noConflictsFound: 'Keine Konflikte gefunden',
        noConflictsMatchFilter: 'Keine Konflikte entsprechen dem Filter',
        period: 'Periode',
        affected: 'Betroffen',
        edit: 'Bearbeiten',
        editLesson: 'Bearbeiten',
        lesson: 'Stunde',
        ignore: 'Ignorieren',
        unignore: 'Nicht ignorieren',
        editLesson: 'Lektion bearbeiten',
        editSpecificLesson: 'Lektion für {class} bearbeiten',
        ignoreConflict: 'Diesen Konflikt als Warnung ignorieren',
        unignoreConflict: 'Konflikt nicht mehr ignorieren',
        resolveConflict: 'Konflikt beheben',
        location: 'Ort',
        severity: 'Schweregrad',
        blocking: 'Blockierend',
        warning: 'Warnung',
        description: 'Beschreibung',
        involvedLessons: 'Betroffene Stunden',
        teachers: 'Lehrer',
        subject: 'Fach',
        room: 'Raum',
        [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Lehrer Doppelbelegung',
        [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Raum Doppelbelegung',
        [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Klasse Doppelbelegung',
        [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Lehrer Überlastung',
        [CONFLICT_TYPES.ROOM_INACTIVE]: 'Raum Inaktiv',
        [CONFLICT_TYPES.MISSING_DATA]: 'Fehlende Daten',
        [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Klasse im falschen Raum'
      },
      en: {
        conflictDetails: 'Conflict Details',
        collapse: 'Collapse',
        filterBy: 'Filter by',
        allClasses: 'All Classes',
        allTeachers: 'All Teachers',
        allSubjects: 'All Subjects',
        allRooms: 'All Rooms',
        noConflictsFound: 'No conflicts found',
        noConflictsMatchFilter: 'No conflicts match filter',
        period: 'Period',
        affected: 'Affected',
        edit: 'Edit',
        editLesson: 'Edit',
        lesson: 'Lesson',
        ignore: 'Ignore',
        unignore: 'Unignore',
        editLesson: 'Edit lesson',
        editSpecificLesson: 'Edit lesson for {class}',
        ignoreConflict: 'Ignore this conflict as warning',
        unignoreConflict: 'Stop ignoring this conflict',
        resolveConflict: 'Resolve conflict',
        location: 'Location',
        severity: 'Severity',
        blocking: 'Blocking',
        warning: 'Warning',
        description: 'Description',
        involvedLessons: 'Involved Lessons',
        teachers: 'Teachers',
        subject: 'Subject',
        room: 'Room',
        [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Teacher Double-booking',
        [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Room Double-booking',
        [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Class Double-booking',
        [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Teacher Overload',
        [CONFLICT_TYPES.ROOM_INACTIVE]: 'Room Inactive',
        [CONFLICT_TYPES.MISSING_DATA]: 'Missing Data',
        [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Class in Wrong Room'
      }
    };

    const t = (key, params = {}) => {
      let translation = translations[props.language]?.[key] || key;
      
      // Replace parameters in translation strings
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
      
      return translation;
    };

    // Check if any filters are active
    const hasFilters = computed(() => 
      filterClass.value || filterTeacher.value || filterSubject.value || filterRoom.value
    );

    // Filter conflicts based on selected filters
    const filteredConflicts = computed(() => {
      return props.conflicts.filter(conflict => {
        if (filterClass.value && !conflictMatchesClass(conflict, filterClass.value)) {
          return false;
        }
        if (filterTeacher.value && !conflictMatchesTeacher(conflict, filterTeacher.value)) {
          return false;
        }
        if (filterSubject.value && !conflictMatchesSubject(conflict, filterSubject.value)) {
          return false;
        }
        if (filterRoom.value && !conflictMatchesRoom(conflict, filterRoom.value)) {
          return false;
        }
        return true;
      });
    });

    // Helper functions for filtering
    const conflictMatchesClass = (conflict, className) => {
      if (conflict.className === className) return true;
      if (conflict.lessons) {
        return conflict.lessons.some(lesson => lesson.class_name === className);
      }
      return false;
    };

    const conflictMatchesTeacher = (conflict, teacherName) => {
      if (conflict.teacherName === teacherName) return true;
      if (conflict.lessons) {
        return conflict.lessons.some(lesson => 
          lesson.teacher_names && lesson.teacher_names.includes(teacherName)
        );
      }
      return false;
    };

    const conflictMatchesSubject = (conflict, subjectName) => {
      if (conflict.lessons) {
        return conflict.lessons.some(lesson => lesson.subject_name === subjectName);
      }
      return false;
    };

    const conflictMatchesRoom = (conflict, roomName) => {
      if (conflict.roomName === roomName) return true;
      if (conflict.lessons) {
        return conflict.lessons.some(lesson => lesson.room_name === roomName);
      }
      return false;
    };

    // Generate unique key for conflict
    const getConflictKey = (conflict) => {
      return `${conflict.type}-${conflict.lessonId || ''}-${conflict.dayId}-${conflict.periodId}`;
    };

    // Format conflict type for display
    const formatConflictType = (type) => {
      return t(type);
    };

    // Get affected items string
    const getAffectedItems = (conflict) => {
      const items = [];
      
      // Add basic conflict items
      if (conflict.className) items.push(`Class: ${conflict.className}`);
      if (conflict.teacherName) items.push(`Teacher: ${conflict.teacherName}`);
      if (conflict.roomName) items.push(`Room: ${conflict.roomName}`);
      
      // For conflicts with multiple lessons, gather comprehensive information
      if (conflict.lessons && conflict.lessons.length > 0) {
        const lessonDetails = [];
        
        conflict.lessons.forEach((lesson, index) => {
          const lessonInfo = [];
          
          // Add class information
          if (lesson.class_name) {
            lessonInfo.push(`Class: ${lesson.class_name}`);
          }
          
          // Add teacher information
          if (lesson.teacher_names && lesson.teacher_names.length > 0) {
            const validTeachers = lesson.teacher_names.filter(name => name && name !== 'Unknown');
            if (validTeachers.length > 0) {
              lessonInfo.push(`Teacher: ${validTeachers.join(', ')}`);
            }
          }
          
          // Add subject information
          if (lesson.subject_name) {
            lessonInfo.push(`Subject: ${lesson.subject_name}`);
          }
          
          // Add room information if different from conflict level
          if (lesson.room_name && lesson.room_name !== conflict.roomName) {
            lessonInfo.push(`Room: ${lesson.room_name}`);
          }
          
          if (lessonInfo.length > 0) {
            lessonDetails.push(`Lesson ${index + 1}: ${lessonInfo.join(', ')}`);
          }
        });
        
        if (lessonDetails.length > 0) {
          return lessonDetails.join(' | ');
        }
      }
      
      // For single lesson conflicts, try to extract more information
      if (conflict.lesson) {
        const lesson = conflict.lesson;
        
        if (lesson.class_name && !items.some(item => item.includes(lesson.class_name))) {
          items.push(`Class: ${lesson.class_name}`);
        }
        
        if (lesson.teacher_names && lesson.teacher_names.length > 0) {
          const validTeachers = lesson.teacher_names.filter(name => name && name !== 'Unknown');
          if (validTeachers.length > 0 && !items.some(item => item.includes(validTeachers[0]))) {
            items.push(`Teacher: ${validTeachers.join(', ')}`);
          }
        }
        
        if (lesson.subject_name) {
          items.push(`Subject: ${lesson.subject_name}`);
        }
      }
      
      // If we still don't have much information, provide what we can from the conflict itself
      if (items.length === 0) {
        if (conflict.type === 'missing_data' && conflict.missing) {
          items.push(`Missing: ${conflict.missing.join(', ')}`);
        }
        if (conflict.teacherId) {
          items.push(`Teacher ID: ${conflict.teacherId}`);
        }
        if (conflict.classId) {
          items.push(`Class ID: ${conflict.classId}`);
        }
      }
      
      return items.join(', ');
    };

    // Get period name by periodId or blockNumber
    const getPeriodName = (conflict) => {
      if (!props.periods || props.periods.length === 0) {
        // Fallback to block number if periods not available
        return `${t('period')} ${conflict.blockNumber}`;
      }
      
      // First try to find by periodId
      let period = props.periods.find(p => p.id === conflict.periodId);
      
      // If not found by periodId, try by block_number
      if (!period && conflict.blockNumber) {
        period = props.periods.find(p => p.block_number === conflict.blockNumber);
      }
      
      if (period && period.label) {
        // Use the full period label/name
        return period.label;
      } else if (period && period.name) {
        // Some periods might have 'name' instead of 'label'
        return period.name;
      } else {
        // Fallback to block number
        return `${t('period')} ${conflict.blockNumber}`;
      }
    };

    // Check if conflict is ignored
    const isConflictIgnored = (conflict) => {
      const conflictId = getConflictKey(conflict);
      return props.ignoredConflicts.includes(conflictId);
    };

    // Actions
    const editConflict = (conflict) => {
      emit('edit', conflict);
    };

    const editSpecificLesson = (conflict, lesson) => {
      // Create a modified conflict object for the specific lesson
      const specificConflict = {
        ...conflict,
        lesson: lesson,
        lessonId: lesson.id
      };
      emit('edit', specificConflict);
    };

    const toggleIgnoreConflict = (conflict) => {
      emit('toggleIgnore', conflict);
    };



    // Conflict Resolution Modal actions
    const openConflictResolution = (conflict) => {
      selectedConflict.value = conflict;
      showResolutionModal.value = true;
    };

    const closeConflictResolution = () => {
      showResolutionModal.value = false;
      selectedConflict.value = {};
    };



    const saveLessonFromModal = (data) => {
      emit('saveLesson', data);
      // Close modal if it's a single save (not bulk)
      if (!data.bulkUpdate) {
        closeConflictResolution();
      }
    };

    const deleteLessonFromModal = ({ lesson, index, conflict }) => {
      emit('deleteLesson', { lesson, index, conflict });
    };

    const ignoreConflictFromModal = (conflict) => {
      emit('toggleIgnore', conflict);
      closeConflictResolution();
    };

    return {
      filterClass,
      filterTeacher,
      filterSubject,
      filterRoom,
      hasFilters,
      filteredConflicts,
      showResolutionModal,
      selectedConflict,
      t,
      getConflictKey,
      formatConflictType,
      getAffectedItems,
      getPeriodName,
      isConflictIgnored,
      editConflict,
      editSpecificLesson,
      toggleIgnoreConflict,
      openConflictResolution,
      closeConflictResolution,
      saveLessonFromModal,
      deleteLessonFromModal,
      ignoreConflictFromModal
    };
  }
};
</script>

<style lang="scss" scoped>
.conflict-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 10px;
  max-height: 400px;
  overflow-y: auto;

  .conflict-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #e9ecef;
    border-bottom: 1px solid #dee2e6;

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .collapse-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      cursor: pointer;

      &:hover {
        background: #5a6268;
      }
    }
  }

  .conflict-filters {
    padding: 12px 16px;
    border-bottom: 1px solid #dee2e6;

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      label {
        font-size: 12px;
        font-weight: 500;
        color: #495057;
      }

      .filter-select {
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 3px;
        font-size: 12px;
        min-width: 100px;

        &:focus {
          outline: none;
          border-color: #007bff;
        }
      }
    }
  }

  .conflict-list {
    max-height: 250px;
    overflow-y: auto;

    .no-conflicts {
      padding: 20px 16px;
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }

    .conflict-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;

      &:last-child {
        border-bottom: none;
      }

      &.error {
        background: rgba(220, 53, 69, 0.05);
        border-left: 3px solid #dc3545;
      }

      &.warning {
        background: rgba(255, 193, 7, 0.05);
        border-left: 3px solid #ffc107;
      }

      &.ignored {
        opacity: 0.6;

        .conflict-details {
          text-decoration: line-through;
        }
      }

      .conflict-details {
        flex: 1;
        min-width: 0;

        .conflict-type {
          font-weight: 600;
          font-size: 13px;
          color: #495057;
          margin-bottom: 4px;
        }

        .conflict-location {
          font-size: 12px;
          color: #007bff;
          margin-bottom: 4px;
        }

        .conflict-description {
          font-size: 12px;
          color: #495057;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .conflict-affected {
          font-size: 11px;
          color: #6c757d;

          .affected-label {
            font-weight: 500;
          }
        }
      }

      .conflict-actions {
        display: flex;
        gap: 4px;
        margin-left: 12px;
        flex-shrink: 0;

        .action-btn {
          padding: 4px 8px;
          border: 1px solid #ced4da;
          background: white;
          border-radius: 3px;
          font-size: 11px;
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

          &.resolve-btn {
            color: #fd7e14;

            &:hover {
              background: #fd7e14;
              color: white;
            }
          }

          &.ignore-btn {
            color: #6c757d;

            &:hover {
              background: #6c757d;
              color: white;
            }

            &.active {
              background: #6c757d;
              color: white;
            }
          }


        }
      }
    }
  }
}
</style>