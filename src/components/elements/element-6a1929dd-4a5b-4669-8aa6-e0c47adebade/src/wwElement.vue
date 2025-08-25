<template>
  <div class="schedule-table-container">
    <!-- COLOR MODE TOGGLE -->
    <div class="color-mode-toggle" style="margin-bottom: 10px;">
      <label>{{ t('colorBy') }}</label>
      <div class="toggle-switch">
        <button
          v-if="viewMode === 'teacher'"
          :class="{ active: colorMode === 'subject' }"
          @click="setColorMode('subject')"
        >{{ t('subject') }}</button>
        <button
          v-if="viewMode === 'teacher'"
          :class="{ active: colorMode === 'class' }"
          @click="setColorMode('class')"
        >{{ t('class') }}</button>
        <button
          v-if="viewMode === 'class'"
          :class="{ active: colorMode === 'subject' }"
          @click="setColorMode('subject')"
        >{{ t('subject') }}</button>
        <button
          v-if="viewMode === 'class'"
          :class="{ active: colorMode === 'teacher' }"
          @click="setColorMode('teacher')"
        >{{ t('teacher') }}</button>
      </div>
    </div>

    <!-- CONFLICT WARNING BAR -->
    <ConflictWarningBar
      :conflictCount="totalConflictCount"
      :blockingCount="blockingConflictCount"
      :language="language"
      :showPanel="showConflictPanel"
      @toggle="toggleConflictPanel"
    />

    <!-- CONFLICT PANEL -->
    <ConflictPanel
      :show="showConflictPanel"
      :conflicts="allConflicts"
      :language="language"
      :availableClasses="availableClasses"
      :availableTeachers="teachers"
      :availableSubjects="availableSubjects"
      :availableRooms="availableRooms"
      :availableDays="sortedDays"
      :periods="periods"
      :ignoredConflicts="ignoredConflicts"
      @collapse="toggleConflictPanel"
      @edit="editConflictLesson"
      @toggleIgnore="toggleIgnoreConflict"
      @saveLesson="saveConflictLesson"
      @deleteLesson="deleteConflictLesson"
    />
    
    <!-- Excel-like Layout with Fixed Positioning -->
    <div class="excel-scheduler" :style="tableStyles">
      <!-- Top-left corner (staff header) -->
      <div class="corner-cell">
        {{ staffLabel }}
      </div>
      
      <!-- Top header (days and periods) -->
      <div class="top-header" ref="topHeader">
        <div class="header-content">
          <!-- Day headers -->
          <div class="day-headers">
            <template v-for="(day, dayIndex) in sortedDays" :key="'day-'+dayIndex">
              <div class="day-header" :style="{ width: (sortedPeriods.length * 40) + 'px' }">
                {{ day.displayName }}
              </div>
            </template>
          </div>
          <!-- Period headers -->
          <div class="period-headers">
            <template v-for="(day, dayIndex) in sortedDays" :key="'period-row-'+dayIndex">
              <template v-for="(period, periodIndex) in sortedPeriods" :key="'period-'+dayIndex+'-'+periodIndex">
                <div class="period-header" :class="{ 'col-hover': enableCrossHair && hoveredColIndex === dayIndex * sortedPeriods.length + periodIndex }">
                  {{ period.label ? period.label.charAt(0) : period.block_number }}
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
      
      <!-- Left sidebar (staff column) -->
      <div class="left-sidebar" ref="leftSidebar">
        <div class="sidebar-content">
          <div 
            v-for="(rowItem, rowIndex) in staff" 
            :key="'staff-'+rowIndex"
            class="staff-item"
            :class="{ 'row-hover': enableCrossHair && hoveredRowIndex === rowIndex }"
          >
            <div class="teacher-info">
              <span 
                v-if="viewMode === 'teacher'"
                class="teacher-name clickable"
                @click="onTeacherNameClick(rowItem)"
                :title="viewMode === 'teacher' ? 'Click to view teacher profile' : ''"
              >{{ rowItem }}</span>
              <span 
                v-else
                class="class-name"
              >{{ rowItem }}</span>
              <span
                v-if="viewMode === 'teacher'"
                class="lesson-count"
                :class="getTeacherLessonCountClass(rowItem)"
                :title="getWorkloadTooltip(rowItem)"
              >
                <span class="count-icon">{{ getWorkloadIcon(rowItem) }}</span>
                {{ getTeacherLessonCount(rowItem) }}/{{ getTeacherHoursAccount(rowItem) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main scrollable content -->
      <div class="main-content" ref="mainContent" @scroll="onMainScroll">
        <div class="content-grid">
          <div 
            v-for="(rowItem, rowIndex) in staff" 
            :key="'row-'+rowIndex"
            class="content-row"
          >
            <template v-for="(day, dayIndex) in sortedDays" :key="'row-day-'+rowIndex+'-'+dayIndex">
              <template v-for="(period, periodIndex) in sortedPeriods" :key="'cell-'+rowIndex+'-'+dayIndex+'-'+periodIndex">
                <div
                  class="schedule-cell"
                  :class="{
                    'class-view-cell': viewMode === 'class',
                    'selected-cell': selectedCell &&
                      ((viewMode === 'teacher' && selectedCell.teacher === rowItem) ||
                      (viewMode === 'class' && selectedCell.class === rowItem)) &&
                      selectedCell.day === day.name_de &&
                      selectedCell.period === period.block_number,
                    'team-teaching': isTeamTaught(rowItem, day.name_de, period.block_number),
                    'team-highlight': highlightedScheduleId &&
                      getLesson(rowItem, day.name_de, period.block_number)?.id === highlightedScheduleId,
                    'draft-lesson': mode === 'planning' && getLesson(rowItem, day.name_de, period.block_number)?.isDraft,
                    'scheduled-lesson': mode === 'planning' && getLesson(rowItem, day.name_de, period.block_number)?.currentlyScheduled,
                    'day-separator': periodIndex === 0,
                    'cell-hover-row': enableCrossHair && hoveredRowIndex === rowIndex,
                    'cell-hover-col': enableCrossHair && hoveredColIndex === dayIndex * sortedPeriods.length + periodIndex,
                    'cell-hover-active': enableCrossHair && hoveredRowIndex === rowIndex && hoveredColIndex === dayIndex * sortedPeriods.length + periodIndex
                  }"
                  :style="getCellStyle(rowItem, day.name_de, period.block_number, { hovered: highlightedScheduleId && getLesson(rowItem, day.name_de, period.block_number)?.id === highlightedScheduleId })"
                  :data-day="day.name_de"
                  :data-period="period.block_number"
                  @click="onCellClick($event, rowItem, day.name_de, period.block_number)"
                  @contextmenu.prevent="onCellRightClick($event, rowItem, day.name_de, period.block_number)"
                  @mouseenter="onCellHover(rowItem, day.name_de, period.block_number, rowIndex, dayIndex * sortedPeriods.length + periodIndex)"
                  @mouseleave="onCellLeave"
                >
                  <template v-if="getLesson(rowItem, day.name_de, period.block_number)">
                    <!-- Termin indicator -->
                    <template v-if="getLesson(rowItem, day.name_de, period.block_number).subject_name === 'Termin'">
                      <span class="termin-indicator">T</span>
                    </template>
                    <!-- CLASS VIEW: Show teacher abbreviations and subject -->
                    <template v-else-if="viewMode === 'class'">
                      <div class="teacher-abbrevs" :class="{ stacked: getLesson(rowItem, day.name_de, period.block_number).teacher_names?.length > 1 }">
                        <span
                          v-for="(name, i) in getTeacherAbbreviations(rowItem, day.name_de, period.block_number)"
                          :key="'abbr-'+i"
                          class="teacher-abbr"
                        >{{ name }}</span>
                      </div>
                      <div class="lesson-subject" v-if="getLesson(rowItem, day.name_de, period.block_number).subject_name">
                        {{ getLesson(rowItem, day.name_de, period.block_number).subject_name.slice(0,2) }}
                      </div>
                    </template>
                    <!-- TEACHER VIEW: class + subject abbreviation -->
                    <template v-else-if="getLesson(rowItem, day.name_de, period.block_number).class_name && getLesson(rowItem, day.name_de, period.block_number).subject_name">
                      <div class="lesson-block">
                        <div class="lesson-class">
                          {{ getLesson(rowItem, day.name_de, period.block_number).class_name }}
                        </div>
                        <div class="lesson-subject">
                          {{ getLesson(rowItem, day.name_de, period.block_number).subject_name.slice(0,2) }}
                        </div>
                      </div>
                    </template>
                    <!-- Course fallback -->
                    <template v-else-if="getLesson(rowItem, day.name_de, period.block_number).course_name">
                      <span>{{ getLesson(rowItem, day.name_de, period.block_number).course_name.slice(0,2) }}</span>
                    </template>
                  </template>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <InfoBox
      :show="showInfoBox"
      :lesson="selectedLesson"
      :position="infoBoxPosition"
      :language="language"
      @close="closeInfoBox"
    />

    <ContextMenu
      :show="showContextMenu"
      :position="contextMenuPosition"
      :hasLesson="contextMenuHasLesson"
      :hasCopiedLesson="!!copiedLesson"
      :language="language"
      @close="closeContextMenu"
      @copy="onCopyLesson"
      @paste="onPasteLesson"
      @edit="onEditFromContextMenu"
      @delete="onDeleteFromContextMenu"
    />

    <InlineLessonForm
      :show="showLessonModal"
      :position="lessonFormPosition"
      :teacher="viewMode === 'teacher' ? modalTeacher.name : ''"
      :teacherId="viewMode === 'teacher' ? modalTeacher.id : null"
      :class="viewMode === 'class' ? modalClass.name : ''"
      :classId="viewMode === 'class' ? modalClass.id : null"
      :viewMode="viewMode"
      :day="modalDay"
      :dayId="modalDayId"
      :period="modalPeriod"
      :periodId="modalPeriodId"
      :subjects="availableSubjects"
      :classes="availableClasses"
      :rooms="availableRooms"
      :days="days"
      :periods="periods"
      :teachers="teachers"
      :selectedTeacherIds="selectedTeacherIds"
      :existingLesson="modalExistingLesson"
      :selectedSubjectId="selectedSubject"
      :selectedClassId="selectedClass"
      :selectedRoomId="selectedRoom"
      :language="language"
      :conflicts="getModalLessonConflicts()"
      :ignoredConflicts="ignoredConflicts"
      @close="closeLessonModal"
      @save="saveDraftLesson"
      @delete="deleteDraftLesson"
      @teacherIdsChange="onTeacherIdsChange"
      @toggleIgnoreConflict="toggleIgnoreConflict"
    />
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import InfoBox from './components/InfoBox.vue';
import InlineLessonForm from './components/InlineLessonForm.vue';
import ContextMenu from './components/ContextMenu.vue';
import ConflictWarningBar from './components/ConflictWarningBar.vue';
import ConflictPanel from './components/ConflictPanel.vue';
import {
  calculateBoxPosition,
  getTeacherByName,
  getPeriodByNumber,
  createLessonLookupMaps,
  getOptimizedLesson,
  getOptimizedTeacherLessonCount
} from './utils/scheduleUtils';
import {
  detectConflicts,
  getConflictsForLesson,
  getConflictsForCell,
  hasBlockingConflicts,
  formatConflictMessage,
  CONFLICT_SEVERITY
} from './utils/conflictDetection';

export default {
  components: { InfoBox, InlineLessonForm, ContextMenu, ConflictWarningBar, ConflictPanel },
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
    wwEditorState: { type: Object, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // Editor state
    const isEditing = computed(() => props.wwEditorState?.isEditing || false);

    // Mode & source data
    const mode = computed(() => props.content?.mode || 'live');
    const teachers = computed(() => props.content?.teachers || []);
    const classes = computed(() => props.content?.classes || []);
    const days = computed(() => props.content?.days || []);
    const periods = computed(() => props.content?.periods || []);
    const lessons = computed(() => props.content?.lessons || []);
    const draftLessons = computed(() => props.content?.draftLessons || []);
    const availableSubjects = computed(() => props.content?.availableSubjects || []);
    const availableClasses = computed(() => props.content?.availableClasses || []);
    const availableRooms = computed(() => props.content?.availableRooms || []);
    const selectedSubject = computed(() => props.content?.selectedSubject || '');
    const selectedClass = computed(() => props.content?.selectedClass || '');
    const selectedRoom = computed(() => props.content?.selectedRoom || '');
    const selectedTeacherIds = computed(() => props.content?.selectedTeacherIds || []);
    const viewMode = computed(() => props.content?.viewMode || 'teacher');
    const colorMode = ref('subject');
    const language = computed(() => props.content?.language || 'de');
    const enableCrossHair = computed(() => props.content?.enableCrossHair ?? true);

    // Conflict detection state
    const showConflictPanel = ref(false);
    const ignoredConflicts = ref([]);

    // Detect conflicts in draft lessons
    const allConflicts = computed(() => {
      if (mode.value !== 'planning' || !draftLessons.value.length) {
        return [];
      }
      return detectConflicts(
        draftLessons.value,
        teachers.value,
        classes.value,
        availableRooms.value,
        language.value
      );
    });

    // Conflict counts
    const totalConflictCount = computed(() => allConflicts.value.length);
    const blockingConflictCount = computed(() => 
      allConflicts.value.filter(c => 
        c.severity === CONFLICT_SEVERITY.ERROR && 
        !ignoredConflicts.value.includes(`${c.type}-${c.lessonId}`)
      ).length
    );

    // Toggle conflict panel
    const toggleConflictPanel = () => {
      showConflictPanel.value = !showConflictPanel.value;
    };

    // Edit lesson from conflict
    const editConflictLesson = (conflict) => {
      const lesson = conflict.lesson || (conflict.lessons && conflict.lessons[0]);
      if (!lesson) {
        return;
      }

      // Find the teacher/class based on view mode and lesson data
      const teacherObj = viewMode.value === 'teacher' 
        ? teachers.value.find(t => 
            lesson.staff_ids && lesson.staff_ids.includes(t.id || t.user_id || t.profile_id)
          )
        : null;
      
      const classObj = viewMode.value === 'class'
        ? classes.value.find(c => c.id === lesson.class_id)
        : null;

      const dayObj = days.value.find(d => d.day_id === lesson.day_id || d.id === lesson.day_id);
      const periodObj = periods.value.find(p => p.id === lesson.period_id);

      // Set up modal data
      modalTeacher.value = teacherObj
        ? { name: teacherObj.name, id: teacherObj.id || teacherObj.user_id || teacherObj.profile_id }
        : { name: '', id: null };
      
      modalClass.value = classObj
        ? { name: classObj.name, id: classObj.id }
        : { name: '', id: null };
      
      modalDay.value = lesson.day_name_de;
      modalDayId.value = lesson.day_id;
      modalPeriod.value = lesson.block_number;
      modalPeriodId.value = lesson.period_id;
      modalExistingLesson.value = lesson;

      // Show the form with conflicts
      lessonFormPosition.value = { top: '100px', left: '100px' };
      showLessonModal.value = true;
    };

    // Toggle ignore conflict
    const toggleIgnoreConflict = (conflict) => {
      const conflictId = `${conflict.type}-${conflict.lessonId}`;
      const index = ignoredConflicts.value.indexOf(conflictId);
      
      if (index > -1) {
        ignoredConflicts.value.splice(index, 1);
      } else {
        ignoredConflicts.value.push(conflictId);
      }

      // Emit to parent component to save ignored conflicts
      emit('trigger-event', {
        name: 'ignoredConflictsChange',
        event: { value: ignoredConflicts.value }
      });
    };

    // Save lesson from conflict resolution modal
    const saveConflictLesson = (data) => {
      if (data.bulkUpdate && data.updates) {
        // Handle bulk updates
        data.updates.forEach(update => {
          const lessonData = {
            id: update.lesson.id,
            teacher_ids: update.lesson.staff_ids || [],
            staff_ids: update.lesson.staff_ids || [],
            teacher_names: update.lesson.teacher_names || [],
            class_id: update.lesson.class_id || '',
            class_name: update.lesson.class_name || '',
            day_id: update.lesson.day_id,
            day_name_de: update.lesson.day_name_de || '',
            block_number: update.lesson.block_number || 0,
            period_id: update.lesson.period_id,
            subject_id: update.lesson.subject_id || '',
            room_id: update.lesson.room_id || '',
            meeting_name: update.lesson.meeting_name || '',
            notes: update.lesson.notes || '',
            isDraft: true
          };
          saveDraftLesson(lessonData, 'updateLesson');
        });
      } else if (data.lesson) {
        // Handle single lesson update
        const originalLesson = data.lesson.originalLesson || data.lesson;
        
        // Use edited teacher data, filtering out null/undefined/empty values and convert to strings
        const teacherIds = (data.lesson.teacherIds || originalLesson.staff_ids || originalLesson.teacher_ids || [])
          .filter(id => id && id !== 'undefined' && id !== null && id !== '')
          .map(String); // Convert to string for consistency
        
        // Generate teacher names from IDs - fix the teacher matching logic
        const teacherNames = teacherIds.map(teacherId => {
          const teacher = teachers.value.find(t => {
            const tId = String(t.user_id || t.id || t.profile_id || t.staff_id || t.teacher_id);
            return tId === String(teacherId);
          });
          
          let teacherName = 'Unknown';
          if (teacher) {
            if (teacher.name) {
              teacherName = teacher.name;
            } else if (teacher.first_name && teacher.last_name) {
              teacherName = `${teacher.first_name} ${teacher.last_name}`.trim();
            } else if (teacher.first_name) {
              teacherName = teacher.first_name;
            } else if (teacher.last_name) {
              teacherName = teacher.last_name;
            } else if (teacher.display_name) {
              teacherName = teacher.display_name;
            } else if (teacher.full_name) {
              teacherName = teacher.full_name;
            }
          }
          
          return teacherName;
        });
        
        // Get day and period names for compatibility with inline form
        const dayObj = sortedDays.value.find(d => d.day_id === data.lesson.dayId);
        const periodObj = sortedPeriods.value.find(p => p.id === data.lesson.periodId);
        const classObj = classes.value.find(c => c.id === data.lesson.classId);
        
        // Format day name properly - use displayName from dayObj or construct it
        const dayName = dayObj ? (dayObj.displayName || dayObj.name_de || dayObj.name) : null;
        
        const lessonData = {
          id: data.lesson.id,
          teacher_ids: teacherIds,
          staff_ids: teacherIds, // For compatibility - exact copy
          teacher_names: teacherNames,
          class_id: data.lesson.classId,
          class_name: classObj ? classObj.name : '',
          day_id: data.lesson.dayId,
          day_name_de: dayName || '',
          block_number: periodObj ? periodObj.block_number : 0,
          period_id: data.lesson.periodId,
          subject_id: data.lesson.subjectId || '',
          room_id: data.lesson.roomId || '',
          meeting_name: originalLesson.meeting_name || '',
          notes: originalLesson.notes || '',
          isDraft: true
        };
        
        saveDraftLesson(lessonData, 'updateLesson');
      }
    };

    // Delete lesson from conflict resolution modal
    const deleteConflictLesson = ({ lesson, index, conflict }) => {
      if (lesson && lesson.id) {
        deleteDraftLesson(lesson.id);
      }
    };

    // Get conflicts for the current modal lesson
    const getModalLessonConflicts = () => {
      if (!modalExistingLesson.value) return [];
      return getConflictsForLesson(modalExistingLesson.value.id, allConflicts.value);
    };

    // Expose conflict status for external access
    const getConflictStatus = () => {
      return {
        totalConflicts: totalConflictCount.value,
        blockingConflicts: blockingConflictCount.value,
        hasBlockingConflicts: hasBlockingConflicts(allConflicts.value, ignoredConflicts.value),
        conflicts: allConflicts.value
      };
    };

    // Watch for changes to expose conflict status
    watch([allConflicts, ignoredConflicts], () => {
      emit('trigger-event', {
        name: 'conflictStatusChange',
        event: { value: getConflictStatus() }
      });
    }, { immediate: true });

    // Translation utilities
    const translations = {
      de: {
        teacher: 'Lehrer',
        class: 'Klasse',
        colorBy: 'Farbe nach:',
        subject: 'Fach',
        addLesson: 'Lektion hinzufügen',
        update: 'Aktualisieren',
        delete: 'Löschen',
        cancel: 'Abbrechen',
        save: 'Speichern',
        room: 'Raum',
        meetingTitle: 'Termin Titel',
        notes: 'Notizen',
        noTeachersFound: 'Keine Lehrer gefunden',
        searchTeachers: 'Lehrer suchen...',
        totalHours: 'Gesamtstunden',
        deductions: 'Abzüge',
        ageReduction: 'Altersermäßigung',
        creditHours: 'Stundenguthaben',
        availableHours: 'Verfügbare Stunden',
        assignedHours: 'Zugewiesene Stunden',
        status: 'Status',
        fullCapacity: 'Vollauslastung',
        overCapacity: 'Überbelastung',
        normal: 'Normal',
        day: 'Tag',
        period: 'Periode'
      },
      en: {
        teacher: 'Teacher',
        class: 'Class',
        colorBy: 'Color by:',
        subject: 'Subject',
        addLesson: 'Add Lesson',
        update: 'Update',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save',
        room: 'Room',
        meetingTitle: 'Meeting Title',
        notes: 'Notes',
        noTeachersFound: 'No teachers found',
        searchTeachers: 'Search teachers...',
        totalHours: 'Total Hours',
        deductions: 'Deductions',
        ageReduction: 'Age Reduction',
        creditHours: 'Credit Hours',
        availableHours: 'Available Hours',
        assignedHours: 'Assigned Hours',
        status: 'Status',
        fullCapacity: 'Full Capacity',
        overCapacity: 'Over Capacity',
        normal: 'Normal',
        day: 'Day',
        period: 'Period'
      }
    };

    const t = (key) => translations[language.value]?.[key] || translations.de[key] || key;

    // Table styles
    const tableStyles = computed(() => ({
      '--header-bg': props.content?.headerBackgroundColor || '#f0f0f0',
      '--border-color': props.content?.borderColor || '#dddddd',
      '--cell-padding': props.content?.cellPadding || '8px'
    }));

    // STAFF AXIS
    const staff = computed(() => {
      if (viewMode.value === 'class') {
        return classes.value.map(c => c.name);
      } else {
        return teachers.value.map(t => `${t.first_name || ''} ${t.last_name || ''}`.trim());
      }
    });
    const staffLabel = computed(() => viewMode.value === 'class' ? t('class') : t('teacher'));

    // SORTED DAYS/PERIODS with language support
    const sortedDays = computed(() => {
      return [...days.value]
        .sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
        .map(day => ({
          ...day,
          displayName: language.value === 'en' && day.name_en ? day.name_en : day.name_de
        }));
    });
    const sortedPeriods = computed(() => [...periods.value].sort((a, b) => (a.block_number || 0) - (b.block_number || 0)));

    // LESSONS ARRAY AND OPTIMIZED LOOKUPS
    const activeLessons = computed(() => {
      if (mode.value === 'planning') {
        // In planning mode, only show draft lessons
        return [...(draftLessons.value || []).map(l => ({ ...l, isDraft: true }))];
      } else {
        // In live mode, only show scheduled lessons
        return [...(lessons.value || [])];
      }
    });

    // Pre-computed lookup maps for performance optimization
    const lessonLookupMaps = computed(() => {
      return createLessonLookupMaps(activeLessons.value, viewMode.value);
    });

    // OPTIMIZED GET LESSON LOGIC
    const getLesson = (rowItem, day, block) => {
      return getOptimizedLesson(lessonLookupMaps.value, rowItem, day, block);
    };

    const isTeamTaught = (rowItem, day, block) => {
      const lesson = getLesson(rowItem, day, block);
      return lesson && Array.isArray(lesson.teacher_names) && lesson.teacher_names.length >= 2;
    };

    // OPTIMIZED Teacher lesson count methods
    const getTeacherLessonCount = (teacherName) => {
      if (viewMode.value !== 'teacher') return 0;
      return getOptimizedTeacherLessonCount(lessonLookupMaps.value, teacherName);
    };

    const getTeacherHoursAccount = (teacherName) => {
    if (viewMode.value !== 'teacher') return 0;
    const teacher = teachers.value.find(t =>
    `${t.first_name || ''} ${t.last_name || ''}`.trim() === teacherName
    );
    if (!teacher) return 0;

    const base = teacher.hours_account || 0;
    const credit = teacher.credit_hours || 0;
    const reduction = teacher.age_reduction || 0;

    return Math.max(0, base - credit - reduction);
    };

    const getTeacherLessonCountClass = (teacherName) => {
      const count = getTeacherLessonCount(teacherName);
      const total = getTeacherHoursAccount(teacherName);
      if (count > total) return 'over-assigned';
      if (count === total) return 'fully-assigned';
      return 'under-assigned';
    };

    const getWorkloadTooltip = (teacherName) => {
      const teacher = teachers.value.find(t =>
        `${t.first_name || ''} ${t.last_name || ''}`.trim() === teacherName
      );
      if (!teacher) return '';

      const totalHours = teacher.hours_account || 0;
      const ageReduction = teacher.age_reduction || 0;
      const creditHours = teacher.credit_hours || 0;
      const assignedLessons = getTeacherLessonCount(teacherName);
      const availableHours = totalHours - ageReduction - creditHours;

      let status = '';
      if (assignedLessons === availableHours) {
        status = t('fullCapacity');
      } else if (assignedLessons > availableHours) {
        status = t('overCapacity');
      } else {
        status = t('normal');
      }

      if (language.value === 'de') {
        let deductionText = '';
        const deductionParts = [];
        if (ageReduction > 0) deductionParts.push(`${t('ageReduction')}: ${ageReduction}`);
        if (creditHours > 0) deductionParts.push(`${t('creditHours')}: ${creditHours}`);
        if (deductionParts.length > 0) {
          deductionText = ` (${deductionParts.join(', ')})`;
        }

        return `${t('totalHours')}: ${totalHours}
${t('deductions')}: ${ageReduction + creditHours}${deductionText}
${t('availableHours')}: ${availableHours}
${t('assignedHours')}: ${assignedLessons}
${t('status')}: ${status}`;
      } else {
        let deductionText = '';
        const deductionParts = [];
        if (ageReduction > 0) deductionParts.push(`${t('ageReduction')}: ${ageReduction}`);
        if (creditHours > 0) deductionParts.push(`${t('creditHours')}: ${creditHours}`);
        if (deductionParts.length > 0) {
          deductionText = ` (${deductionParts.join(', ')})`;
        }

        return `${t('totalHours')}: ${totalHours}
${t('deductions')}: ${ageReduction + creditHours}${deductionText}
${t('availableHours')}: ${availableHours}
${t('assignedHours')}: ${assignedLessons}
${t('status')}: ${status}`;
      }
    };

    // Get workload icon based on status
    const getWorkloadIcon = (teacherName) => {
      const count = getTeacherLessonCount(teacherName);
      const total = getTeacherHoursAccount(teacherName);
      if (count > total) return '!';
      if (count === total) return '✓';
      return '';
    };

    // Teacher profile click handler
    const onTeacherNameClick = (teacherName) => {
      const teacher = teachers.value.find(t =>
        `${t.first_name || ''} ${t.last_name || ''}`.trim() === teacherName
      );
      if (teacher) {
        emit('trigger-event', {
          name: 'teacherProfileClicked',
          event: { value: teacher }
        });
      }
    };

    // InfoBox state (live mode)
    const showInfoBox = ref(false);
    const selectedLesson = ref(null);
    const selectedCell = ref(null);
    const infoBoxPosition = ref({ top: '0px', left: '0px' });
    const highlightedScheduleId = ref(null);

    // Cross-hair hover state
    const hoveredRowIndex = ref(-1);
    const hoveredColIndex = ref(-1);

    // Context menu state (planning mode)
    const showContextMenu = ref(false);
    const contextMenuPosition = ref({ top: '0px', left: '0px' });
    const contextMenuHasLesson = ref(false);
    const contextMenuRowItem = ref('');
    const contextMenuDay = ref('');
    const contextMenuPeriod = ref(0);
    const contextMenuLesson = ref(null);

    // Copy/paste state
    const copiedLesson = ref(null);

    // Inline form state (planning mode)
    const showLessonModal = ref(false);
    const modalExistingLesson = ref(null);
    const modalTeacher = ref({ name: '', id: null });
    const modalClass = ref({ name: '', id: null });
    const modalDay = ref('');
    const modalDayId = ref('');
    const modalPeriod = ref(0);
    const modalPeriodId = ref('');
    const lessonFormPosition = ref({ top: '0px', left: '0px' });

    // Color mode toggle logic
    const setColorMode = (mode) => {
      colorMode.value = mode;
    };

    // Watch for viewMode changes to reset colorMode
    watch(viewMode, () => {
      colorMode.value = 'subject';
    });

    // Helper: teacher abbreviations
    const getTeacherAbbreviations = (rowItem, day, block) => {
      const lesson = getLesson(rowItem, day, block);
      if (!lesson || !Array.isArray(lesson.teacher_names)) return [];
      return lesson.teacher_names.map(name => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          // First letter of first name + first two letters of last name
          return `${parts[0].charAt(0)}${parts[parts.length-1].slice(0,2)}`;
        }
        return name.slice(0, 3);
      });
    };

    // Helper: cell color and shadow logic
    const getCellStyle = (rowItem, day, block, { hovered = false } = {}) => {
      const lesson = getLesson(rowItem, day, block);
      if (!lesson) return {};

      const style = {};

      // Team teaching shadow (orange)
      if (isTeamTaught(rowItem, day, block)) {
        style.boxShadow = hovered
          ? '0 0 0 3px #e67e00'
          : '0 0 0 2px #ff9800';
      }

      // Cell color by mode
      if (viewMode.value === 'teacher') {
        if (colorMode.value === 'subject') {
          const subject = availableSubjects.value.find(s => s.id === lesson.subject_id);
          style.background = subject?.color || 'white';
        } else if (colorMode.value === 'class') {
          const classObj = availableClasses.value.find(c => c.id === lesson.class_id);
          style.background = classObj?.color || 'white';
        }
      } else if (viewMode.value === 'class') {
        if (colorMode.value === 'subject') {
          const subject = availableSubjects.value.find(s => s.id === lesson.subject_id);
          style.background = subject?.color || 'white';
        } else if (colorMode.value === 'teacher') {
          // Check if lesson has pre-computed staff_colour (for draft lessons)
          if (lesson.staff_colour) {
            style.background = lesson.staff_colour;
          } else if (lesson.staff_colours && lesson.staff_colours.length > 1) {
            // Gradient for team teaching with staff_colours
            const teacherColors = lesson.staff_colours;
            if (teacherColors.length === 2) {
              style.background = `linear-gradient(to right, ${teacherColors[0]} 50%, ${teacherColors[1]} 50%)`;
            } else if (teacherColors.length > 2) {
              // Equal split for more than 2 teachers
              const segments = teacherColors.map((color, i) => {
                const percent = (i / teacherColors.length * 100).toFixed(2);
                const nextPercent = ((i + 1) / teacherColors.length * 100).toFixed(2);
                return `${color} ${percent}% ${nextPercent}%`;
              }).join(', ');
              style.background = `linear-gradient(to right, ${segments})`;
            }
          } else if (Array.isArray(lesson.teacher_ids) && lesson.teacher_ids.length > 1) {
            // Gradient for team teaching
            const teacherColors = lesson.teacher_ids.map(id => {
              const teacher = teachers.value.find(t => t.user_id === id || t.profile_id === id || t.id === id);
              return teacher?.colour || teacher?.color || 'white';
            });
            if (teacherColors.length === 2) {
              style.background = `linear-gradient(to right, ${teacherColors[0]} 50%, ${teacherColors[1]} 50%)`;
            } else if (teacherColors.length > 2) {
              // Equal split for more than 2 teachers
              const segments = teacherColors.map((color, i) => {
                const percent = (i / teacherColors.length * 100).toFixed(2);
                const nextPercent = ((i + 1) / teacherColors.length * 100).toFixed(2);
                return `${color} ${percent}% ${nextPercent}%`;
              }).join(', ');
              style.background = `linear-gradient(to right, ${segments})`;
            }
          } else if (Array.isArray(lesson.teacher_ids) && lesson.teacher_ids.length === 1) {
            const teacher = teachers.value.find(t => t.user_id === lesson.teacher_ids[0] || t.profile_id === lesson.teacher_ids[0] || t.id === lesson.teacher_ids[0]);
            style.background = teacher?.colour || teacher?.color || 'white';
          } else if (Array.isArray(lesson.staff_ids) && lesson.staff_ids.length >= 1) {
            // Fallback to staff_ids lookup for draft lessons
            const teacher = teachers.value.find(t => t.user_id === lesson.staff_ids[0] || t.profile_id === lesson.staff_ids[0] || t.id === lesson.staff_ids[0]);
            style.background = teacher?.colour || teacher?.color || 'white';
          }
        }
      }

      return style;
    };

    // Hover logic with cross-hair support
    const onCellHover = (rowItem, dayName, blockNumber, rowIndex, colIndex) => {
      if (isEditing.value) return;
      
      // Set cross-hair hover indices only if enabled
      if (enableCrossHair.value) {
        hoveredRowIndex.value = rowIndex;
        hoveredColIndex.value = colIndex;
      }
      
      // Existing team teaching highlight logic
      const lesson = getLesson(rowItem, dayName, blockNumber);
      if (
        lesson?.id &&
        Array.isArray(lesson.teacher_names) &&
        lesson.teacher_names.length >= 2
      ) {
        highlightedScheduleId.value = lesson.id;
      } else {
        highlightedScheduleId.value = null;
      }
    };
    
    const onCellLeave = () => {
      hoveredRowIndex.value = -1;
      hoveredColIndex.value = -1;
      highlightedScheduleId.value = null;
    };

    // Synchronized scrolling for Excel-like layout
    const topHeader = ref(null);
    const leftSidebar = ref(null);
    const mainContent = ref(null);

    const onMainScroll = (event) => {
      const scrollLeft = event.target.scrollLeft;
      const scrollTop = event.target.scrollTop;
      
      // Sync horizontal scroll with top header
      if (topHeader.value && typeof topHeader.value.scrollLeft === 'number') {
        topHeader.value.scrollLeft = scrollLeft;
      }
      
      // Sync vertical scroll with left sidebar  
      if (leftSidebar.value && typeof leftSidebar.value.scrollTop === 'number') {
        leftSidebar.value.scrollTop = scrollTop;
      }
    };

    // Click handler (live or planning)
    const onCellClick = (event, rowItem, dayName, blockNumber) => {
      if (isEditing.value) return;
      
      const lesson = getLesson(rowItem, dayName, blockNumber);
      selectedCell.value = {
        teacher: viewMode.value === 'teacher' ? rowItem : null,
        class: viewMode.value === 'class' ? rowItem : null,
        day: dayName,
        period: blockNumber
      };

      if (mode.value === 'planning') {
        // Setup modal data first
        const teacherObj = viewMode.value === 'teacher'
          ? getTeacherByName(teachers.value, rowItem)
          : null;
        const classObj = viewMode.value === 'class'
          ? classes.value.find(c => c.name === rowItem)
          : null;
        const dayObj = days.value.find(d =>
          d.name === dayName || d.name_de === dayName || d.day_name === dayName
        );
        const periodObj = getPeriodByNumber(periods.value, blockNumber);

        modalTeacher.value = viewMode.value === 'teacher'
          ? { name: rowItem, id: teacherObj?.user_id || teacherObj?.profile_id || teacherObj?.id }
          : { name: '', id: null };
        modalClass.value = viewMode.value === 'class'
          ? { name: rowItem, id: classObj?.id }
          : { name: '', id: null };
        modalDay.value = dayName;
        modalDayId.value = dayObj?.day_id;
        modalPeriod.value = blockNumber;
        modalPeriodId.value = periodObj?.id;
        modalExistingLesson.value = lesson;

        // Check if we should create draft directly or open form
        let allFilled = false;
        if (viewMode.value === 'teacher') {
          allFilled = selectedSubject.value && selectedClass.value && selectedRoom.value;
        } else {
          allFilled = selectedSubject.value &&
            Array.isArray(selectedTeacherIds.value) &&
            selectedTeacherIds.value.length &&
            selectedRoom.value;
        }

        if (!lesson && allFilled) {
          // Create draft directly when all fields are filled and cell is empty
          const teacherIds = viewMode.value === 'class'
            ? selectedTeacherIds.value
            : teacherObj && (teacherObj.user_id || teacherObj.profile_id || teacherObj.id) ? [teacherObj.user_id || teacherObj.profile_id || teacherObj.id] : [];
          
          const teacherNames = viewMode.value === 'class'
            ? selectedTeacherIds.value.map(id => {
                const t = teachers.value.find(tt => (tt.user_id || tt.id) === id);
                return t ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : '';
              })
            : teacherObj
              ? [`${teacherObj.first_name || ''} ${teacherObj.last_name || ''}`.trim()]
              : [];
          
          // Get class name for teacher view from selected class
          const selectedClassObj = viewMode.value === 'teacher' && selectedClass.value
            ? availableClasses.value.find(c => c.id === selectedClass.value)
            : null;
          
          const lessonData = {
            id: `draft-${Date.now()}`,
            teacher_ids: teacherIds,
            staff_ids: teacherIds, // For compatibility
            teacher_names: teacherNames,
            class_id: viewMode.value === 'class' ? classObj?.id : selectedClass.value,
            class_name: viewMode.value === 'class' ? rowItem : (selectedClassObj?.name || ''),
            day_id: dayObj?.day_id,
            day_name_de: dayName || '',
            block_number: blockNumber || 0,
            period_id: periodObj?.id,
            subject_id: selectedSubject.value || '',
            room_id: selectedRoom.value || '',
            meeting_name: '',
            notes: '',
            isDraft: true
          };
          emit('trigger-event', { name: 'assignDraftLesson', event: { value: lessonData } });
        } else if (!lesson) {
          // Empty cell without all fields filled - open form
          lessonFormPosition.value = calculateBoxPosition(event, 300, 400);
          showLessonModal.value = true;
          if (viewMode.value === 'class') {
            // Empty cell - reset teacher selection  
            emit('trigger-event', {
              name: 'selectedTeacherIdsChange',
              event: { value: [] }
            });
          } else if (viewMode.value === 'teacher' && teacherObj) {
            // Teacher view - pre-select the clicked teacher
            const teacherId = teacherObj.user_id || teacherObj.profile_id || teacherObj.id;
            if (teacherId) {
              emit('trigger-event', {
                name: 'selectedTeacherIdsChange', 
                event: { value: [teacherId] }
              });
            }
          }
        } else {
          // Existing lesson - open form
          lessonFormPosition.value = calculateBoxPosition(event, 300, 400);
          showLessonModal.value = true;
          if (viewMode.value === 'class') {
            // Existing lesson - populate teacher selection
            const teacherIds = lesson && Array.isArray(lesson.teacher_ids)
              ? lesson.teacher_ids
              : (lesson && lesson.teacher_id ? [lesson.teacher_id] : []);
            emit('trigger-event', {
              name: 'selectedTeacherIdsChange',
              event: { value: teacherIds }
            });
          } else if (viewMode.value === 'teacher' && !lesson.teacher_ids?.length && teacherObj) {
            // Teacher view with lesson missing teacher data - pre-select the clicked teacher
            const teacherId = teacherObj.user_id || teacherObj.profile_id || teacherObj.id;
            if (teacherId) {
              emit('trigger-event', {
                name: 'selectedTeacherIdsChange',
                event: { value: [teacherId] }
              });
            }
          }
        }
      } else {
        // Live mode - show info box for existing lessons
        if (lesson) {
          selectedLesson.value = lesson;
          infoBoxPosition.value = calculateBoxPosition(
            event,
            300,
            lesson.subject_name === 'Termin' ? 250 : 200
          );
          showInfoBox.value = true;
          emit('trigger-event', {
            name: 'lessonSelected',
            event: { value: lesson }
          });
        } else {
          selectedLesson.value = null;
          showInfoBox.value = false;
          selectedCell.value = null;
        }
      }
    };

    const onCellRightClick = (event, rowItem, dayName, blockNumber) => {
      if (isEditing.value || mode.value !== 'planning') return;
      
      // Prevent default context menu
      event.preventDefault();
      
      const lesson = getLesson(rowItem, dayName, blockNumber);
      
      // Store context menu data
      contextMenuRowItem.value = rowItem;
      contextMenuDay.value = dayName;
      contextMenuPeriod.value = blockNumber;
      contextMenuLesson.value = lesson;
      contextMenuHasLesson.value = !!lesson;
      
      // Calculate position for context menu
      contextMenuPosition.value = calculateBoxPosition(event, 120, 100);
      
      // Show context menu
      showContextMenu.value = true;
      
      // Update selected cell
      selectedCell.value = {
        teacher: viewMode.value === 'teacher' ? rowItem : null,
        class: viewMode.value === 'class' ? rowItem : null,
        day: dayName,
        period: blockNumber
      };
    };

    // InlineLessonForm event handler for teacherIdsChange
    const onTeacherIdsChange = ids => {
      emit('trigger-event', {
        name: 'selectedTeacherIdsChange',
        event: { value: ids }
      });
    };

    // Close info box
    const closeInfoBox = () => {
      showInfoBox.value = false;
      selectedCell.value = null;
    };

    // Outside‑click handler
    const handleOutsideClick = (e) => {
      if (
        showInfoBox.value &&
        !e.target.closest('.lesson-info-box') &&
        !e.target.closest('.schedule-cell')
      ) {
        closeInfoBox();
      }
      if (
        showLessonModal.value &&
        !e.target.closest('.inline-lesson-form') &&
        !e.target.closest('.schedule-cell')
      ) {
        closeLessonModal();
      }
      if (
        showContextMenu.value &&
        !e.target.closest('.context-menu') &&
        !e.target.closest('.schedule-cell')
      ) {
        closeContextMenu();
      }
    };
    onMounted(() => document.addEventListener('click', handleOutsideClick));
    onUnmounted(() => document.removeEventListener('click', handleOutsideClick));

    // Modal controls
    const closeLessonModal = () => {
      showLessonModal.value = false;
      selectedCell.value = null;
    };
    const saveDraftLesson = (lessonData, eventName = 'assignDraftLesson') => {
      // Create a clean copy of the lesson data without Vue reactivity
      const cleanLessonData = JSON.parse(JSON.stringify(lessonData));
      
      // Ensure arrays are plain arrays, not Vue reactive proxies
      if (cleanLessonData.teacher_ids) {
        cleanLessonData.teacher_ids = [...cleanLessonData.teacher_ids];
      }
      if (cleanLessonData.staff_ids) {
        cleanLessonData.staff_ids = [...cleanLessonData.staff_ids];
      }
      if (cleanLessonData.teacher_names) {
        cleanLessonData.teacher_names = [...cleanLessonData.teacher_names];
      }
      
      emit('trigger-event', {
        name: eventName || 'assignDraftLesson',
        event: { value: cleanLessonData }
      });
      closeLessonModal();
      selectedCell.value = null;
    };
    const deleteDraftLesson = lessonIdOrObj => {
      const id = typeof lessonIdOrObj === 'string' ? lessonIdOrObj : lessonIdOrObj?.id;

      if (!id) {
        console.warn('deleteDraftLesson called without valid lesson ID:', lessonIdOrObj);
        return;
      }

      emit('trigger-event', {
        name: 'deleteDraftLesson',
        event: { value: id }
      });

      closeLessonModal();
      selectedCell.value = null;
    };

    // Context menu controls
    const closeContextMenu = () => {
      showContextMenu.value = false;
      selectedCell.value = null;
    };

    // Copy lesson functionality
    const onCopyLesson = () => {
      const lesson = contextMenuLesson.value;
      if (!lesson) return;

      // Store complete lesson object for copying
      copiedLesson.value = {
        ...lesson,
        // Ensure we have all the necessary fields
        subject_id: lesson.subject_id,
        class_id: lesson.class_id,
        room_id: lesson.room_id,
        teacher_ids: lesson.teacher_ids || lesson.staff_ids || (lesson.teacher_id ? [lesson.teacher_id] : []),
        teacher_names: lesson.teacher_names || [],
        meeting_name: lesson.meeting_name || '',
        notes: lesson.notes || '',
        isDraft: lesson.isDraft || false
      };
      
      // Provide visual feedback for copy action
      const successMessage = language.value === 'de' 
        ? 'Lektion in die Zwischenablage kopiert'
        : 'Lesson copied to clipboard';
      emit('trigger-event', {
        name: 'lessonCopied',
        event: { value: { message: successMessage } }
      });
    };

    // Paste lesson functionality
    const onPasteLesson = () => {
      if (!copiedLesson.value) return;

      const rowItem = contextMenuRowItem.value;
      const dayName = contextMenuDay.value;
      const blockNumber = contextMenuPeriod.value;
      const existingLesson = contextMenuLesson.value;

      // If there's an existing lesson, show confirmation
      if (existingLesson) {
        const confirmMessage = language.value === 'de' 
          ? 'Sind Sie sicher, dass Sie diese Lektion ersetzen möchten?'
          : 'Are you sure you want to replace this lesson?';
        const confirmed = confirm(confirmMessage);
        if (!confirmed) return;
      }

      // Get context objects for creating the new lesson
      const teacherObj = viewMode.value === 'teacher'
        ? getTeacherByName(teachers.value, rowItem)
        : null;
      const classObj = viewMode.value === 'class'
        ? classes.value.find(c => c.name === rowItem)
        : null;
      const dayObj = days.value.find(d =>
        d.name === dayName || d.name_de === dayName || d.day_name === dayName
      );
      const periodObj = getPeriodByNumber(periods.value, blockNumber);

      // Create new lesson data with copied content but new position and ID
      const teacherIds = viewMode.value === 'class'
        ? copiedLesson.value.teacher_ids
        : teacherObj && (teacherObj.user_id || teacherObj.profile_id || teacherObj.id) 
          ? [teacherObj.user_id || teacherObj.profile_id || teacherObj.id] 
          : copiedLesson.value.teacher_ids;
      
      const teacherNames = viewMode.value === 'class'
        ? copiedLesson.value.teacher_names
        : teacherObj
          ? [`${teacherObj.first_name || ''} ${teacherObj.last_name || ''}`.trim()]
          : copiedLesson.value.teacher_names;
      
      const lessonData = {
        // Generate new unique ID or use existing one if updating
        id: existingLesson ? existingLesson.id : `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        
        // Copy all the lesson content with normalized structure
        subject_id: copiedLesson.value.subject_id || '',
        room_id: copiedLesson.value.room_id || '',
        meeting_name: copiedLesson.value.meeting_name || '',
        notes: copiedLesson.value.notes || '',
        
        // Update position to target cell
        class_id: viewMode.value === 'class' ? classObj?.id : copiedLesson.value.class_id,
        class_name: viewMode.value === 'class' ? rowItem : copiedLesson.value.class_name || '',
        day_id: dayObj?.day_id,
        day_name_de: dayName || '',
        block_number: blockNumber || 0,
        period_id: periodObj?.id,
        
        // Handle teacher assignments based on view mode
        teacher_ids: teacherIds,
        staff_ids: teacherIds, // For compatibility
        teacher_names: teacherNames,
        
        isDraft: true
      };

      // Save the pasted lesson
      const eventName = existingLesson ? 'updateLesson' : 'assignDraftLesson';
      emit('trigger-event', {
        name: eventName,
        event: { value: lessonData }
      });

      // Provide visual feedback for paste action
      const successMessage = language.value === 'de' 
        ? 'Lektion erfolgreich eingefügt'
        : 'Lesson pasted successfully';
      emit('trigger-event', {
        name: 'lessonPasted',
        event: { value: { message: successMessage } }
      });
    };

    // Edit from context menu
    const onEditFromContextMenu = () => {
      const rowItem = contextMenuRowItem.value;
      const dayName = contextMenuDay.value;
      const blockNumber = contextMenuPeriod.value;
      const lesson = contextMenuLesson.value;

      // Setup modal data (same as original right-click logic)
      const teacherObj = viewMode.value === 'teacher'
        ? getTeacherByName(teachers.value, rowItem)
        : null;
      const classObj = viewMode.value === 'class'
        ? classes.value.find(c => c.name === rowItem)
        : null;
      const dayObj = days.value.find(d =>
        d.name === dayName || d.name_de === dayName || d.day_name === dayName
      );
      const periodObj = getPeriodByNumber(periods.value, blockNumber);

      modalTeacher.value = viewMode.value === 'teacher'
        ? { name: rowItem, id: teacherObj?.user_id || teacherObj?.profile_id || teacherObj?.id }
        : { name: '', id: null };
      modalClass.value = viewMode.value === 'class'
        ? { name: rowItem, id: classObj?.id }
        : { name: '', id: null };
      modalDay.value = dayName;
      modalDayId.value = dayObj?.day_id;
      modalPeriod.value = blockNumber;
      modalPeriodId.value = periodObj?.id;
      modalExistingLesson.value = lesson;

      // Calculate position and show form
      lessonFormPosition.value = { top: '50px', left: '50px' }; // Center-ish position
      showLessonModal.value = true;

      if (viewMode.value === 'class' && lesson) {
        const teacherIds = lesson && Array.isArray(lesson.teacher_ids)
          ? lesson.teacher_ids
          : (lesson && lesson.teacher_id ? [lesson.teacher_id] : []);
        emit('trigger-event', {
          name: 'selectedTeacherIdsChange',
          event: { value: teacherIds }
        });
      }
    };

    // Delete from context menu
    const onDeleteFromContextMenu = () => {
      const lesson = contextMenuLesson.value;
      if (!lesson) return;

      // Use the same delete function as the inline form to ensure consistency
      deleteDraftLesson(lesson.id);
      closeContextMenu();
    };

    return {
      isEditing,
      staff,
      staffLabel,
      sortedDays,
      sortedPeriods,
      tableStyles,
      getLesson,
      isTeamTaught,
      showInfoBox,
      selectedLesson,
      selectedCell,
      infoBoxPosition,
      highlightedScheduleId,
      hoveredRowIndex,
      hoveredColIndex,
      onCellClick,
      onCellRightClick,
      onCellHover,
      onCellLeave,
      onMainScroll,
      topHeader,
      leftSidebar,
      mainContent,
      closeInfoBox,
      mode,
      viewMode,                   // ✅ GOOD: keeps reactivity in template!
      colorMode,
      setColorMode,
      availableSubjects,
      availableClasses,
      availableRooms,
      teachers,
      classes,
      days,
      periods,
      showLessonModal,
      modalExistingLesson,
      modalTeacher,
      modalClass,
      modalDay,
      modalDayId,
      modalPeriod,
      modalPeriodId,
      lessonFormPosition,
      closeLessonModal,
      saveDraftLesson,
      deleteDraftLesson,
      selectedSubject,
      selectedClass,
      selectedRoom,
      selectedTeacherIds,
      onTeacherIdsChange,
      getTeacherLessonCount,
      getTeacherHoursAccount,
      getTeacherLessonCountClass,
      getWorkloadTooltip,
      getWorkloadIcon,
      onTeacherNameClick,
      getTeacherAbbreviations,
      getCellStyle,
      t,
      language,
      enableCrossHair,
      // Context menu and copy/paste
      showContextMenu,
      contextMenuPosition,
      contextMenuHasLesson,
      copiedLesson,
      closeContextMenu,
      onCopyLesson,
      onPasteLesson,
      onEditFromContextMenu,
      onDeleteFromContextMenu,
      // Conflict detection
      showConflictPanel,
      allConflicts,
      totalConflictCount,
      blockingConflictCount,
      ignoredConflicts,
      toggleConflictPanel,
      editConflictLesson,
      toggleIgnoreConflict,
      saveConflictLesson,
      deleteConflictLesson,
      getModalLessonConflicts
    };
  }
};
</script>

<style lang="scss" scoped>
.schedule-table-container {
  width: 100%;
  position: relative;
  
  .color-mode-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    
    label {
      font-weight: 500;
      margin-right: 6px;
    }
    
    .toggle-switch {
      display: inline-flex;
      gap: 2px;
      
      button {
        border: 1px solid #bbb;
        background: #fafafa;
        color: #333;
        padding: 2px 10px;
        border-radius: 3px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s ease;
        
        &:hover {
          border-color: #007bff;
        }
        
        &.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
      }
    }
  }
}

/* Excel-like Layout */
.excel-scheduler {
  position: relative;
  width: 100%;
  height: 800px;
  border: 1px solid var(--border-color, #ddd);
  overflow: hidden; /* Prevent container scrolling */
}

/* Top-left corner cell */
.corner-cell {
  position: absolute;
  top: 0;
  left: 0;
  width: 200px;
  height: 70px;
  background: var(--header-bg, #f8f9fa);
  border: 1px solid var(--border-color, #ddd);
  border-right: 2px solid var(--border-color, #ddd);
  border-bottom: 2px solid var(--border-color, #ddd);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  padding: var(--cell-padding, 8px);
}

/* Top header (days and periods) */
.top-header {
  position: absolute;
  top: 0;
  left: 200px;
  right: 0;
  height: 70px;
  background: var(--header-bg, #f8f9fa);
  z-index: 90;
  overflow-x: hidden;
  border: 1px solid var(--border-color, #ddd);
  border-left: none;
  border-bottom: 2px solid var(--border-color, #ddd);
  
  .header-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: min-content; /* Ensure header content doesn't shrink */
    
    .day-headers {
      display: flex;
      height: 35px;
      border-bottom: 1px solid var(--border-color, #ddd);
      min-width: min-content;
      
      .day-header {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border-right: 2px solid var(--border-color, #ddd);
        padding: var(--cell-padding, 8px);
        background: var(--header-bg, #f8f9fa);
        min-width: 40px;
        flex-shrink: 0;
      }
    }
    
    .period-headers {
      display: flex;
      height: 35px;
      min-width: min-content;
      
      .period-header {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border-right: 1px solid var(--border-color, #ddd);
        padding: var(--cell-padding, 8px);
        background: var(--header-bg, #f8f9fa);
        min-width: 40px;
        width: 40px;
        flex-shrink: 0;
        
        &.col-hover {
          background-color: rgba(0, 123, 255, 0.1);
        }
      }
    }
  }
}

/* Left sidebar (staff column) */
.left-sidebar {
  position: absolute;
  top: 70px;
  left: 0;
  width: 200px;
  bottom: 0;
  background: var(--header-bg, #f8f9fa);
  z-index: 80;
  overflow-y: hidden;
  border: 1px solid var(--border-color, #ddd);
  border-top: none;
  border-right: 2px solid var(--border-color, #ddd);
  
  .sidebar-content {
    .staff-item {
      height: 40px;
      display: flex;
      align-items: center;
      padding: var(--cell-padding, 8px) var(--cell-padding, 8px) var(--cell-padding, 8px) 15px;
      border-bottom: 1px solid var(--border-color, #ddd);
      background: var(--header-bg, #f8f9fa);
      
      &.row-hover {
        background-color: rgba(0, 123, 255, 0.1);
      }
      
      .teacher-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        
        .teacher-name, .class-name {
          color: #000000 !important;
          font-weight: normal !important;
          
          &.clickable {
            cursor: pointer;
            
            &:hover {
              text-decoration: underline;
            }
          }
        }
        
        .lesson-count {
          font-size: 0.85em;
          padding: 2px 6px;
          border-radius: 3px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 2px;
          
          &.under-assigned {
            background-color: #fff3cd;
            color: #856404;
          }
          
          &.fully-assigned {
            background-color: #d4edda;
            color: #155724;
          }
          
          &.over-assigned {
            background-color: #f8d7da;
            color: #721c24;
          }
          
          .count-icon {
            font-weight: bold;
          }
        }
      }
    }
  }
}

/* Main scrollable content */
.main-content {
  position: absolute;
  top: 70px;
  left: 200px;
  right: 0;
  bottom: 0;
  overflow: auto;
  height: calc(100% - 70px); /* Explicit height calculation */
  max-height: calc(100% - 70px); /* Ensure height constraint */
  
  .content-grid {
    display: flex;
    flex-direction: column;
    min-width: min-content; /* Ensure content doesn't shrink too much */
    
    .content-row {
      display: flex;
      height: 40px;
      border-bottom: 1px solid var(--border-color, #ddd);
      min-width: min-content; /* Ensure row doesn't shrink */
      
      .schedule-cell {
        min-width: 40px;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid var(--border-color, #ddd);
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        font-size: 0.8em;
        line-height: 1.1;
        
        /* Class view: vertical stacking of teacher above subject */
        &.class-view-cell {
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          
          .teacher-abbrevs {
            display: block !important;
            margin-bottom: 2px !important;
            width: 100% !important;
            text-align: center !important;
          }
          
          .lesson-subject {
            display: block !important;
            margin-top: 0 !important;
            width: 100% !important;
            text-align: center !important;
          }
        }
        
        &.day-separator {
          border-left: 2px solid var(--border-color, #ddd);
        }
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        &.selected-cell {
          outline: 2px solid #007bff;
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        &.draft-lesson {
          border: 1px solid #e0e0e0;
          background-color: rgba(245, 245, 245, 0.3);
        }
        
        &.scheduled-lesson {
          color: blue;
        }
        
        &.team-highlight {
          background-color: rgba(255, 193, 7, 0.08);
        }
        
        &.cell-hover-row {
          background-color: rgba(0, 123, 255, 0.05);
        }
        
        &.cell-hover-col {
          background-color: rgba(0, 123, 255, 0.05);
        }
        
        &.cell-hover-active {
          background-color: rgba(0, 123, 255, 0.1);
        }
        
        .lesson-block {
          text-align: center;
          width: 100%;
          
          .lesson-class,
          .lesson-subject {
            display: block;
            line-height: 1.1;
          }
        }
        
        .teacher-abbrevs {
          display: block;
          text-align: center;
          line-height: 1.0;
          margin-bottom: 1px;
          
          &.stacked {
            line-height: 0.9;
          }
          
          .teacher-abbr {
            font-size: 0.7em;
            margin-right: 2px;
            display: inline-block;
          }
        }
        
        .lesson-subject {
          display: block;
          text-align: center;
          line-height: 1.1;
          font-size: 0.75em;
          margin-top: 1px;
        }
        
        /* For class view cells, ensure proper vertical stacking */
        &.class-view-cell {
          .teacher-abbrevs {
            margin-bottom: 2px !important;
            flex-shrink: 0;
            width: 100% !important;
            text-align: center !important;
          }
          
          .lesson-subject {
            margin-top: 0 !important;
            flex-shrink: 0;
            width: 100% !important;
            text-align: center !important;
          }
        }
        
        .termin-indicator {
          font-weight: bold;
          color: #dc3545;
        }
      }
    }
    }
  }

/* Responsive adjustments */
@media (max-width: 768px) {
  .corner-cell {
    width: 150px;
  }
  
  .top-header {
    left: 150px;
  }
  
  .left-sidebar {
    width: 150px;
  }
  
  .main-content {
    left: 150px;
  }
}
</style>
