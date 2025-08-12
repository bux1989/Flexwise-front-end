
<template>
  <div class="schedule-table-container">
    <!-- DEBUG DISPLAY (optional, for troubleshooting) -->
    <div v-if="isEditing" style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.1); padding: 5px; font-size: 10px; z-index: 1000;">
      Mode: {{ debugLessonsCount.mode }} | 
      Lessons: {{ debugLessonsCount.lessonsCount }} | 
      Active: {{ debugLessonsCount.activeLessonsCount }}
    </div>
    <!-- COLOR MODE TOGGLE -->
    <div class="color-mode-toggle" style="margin-bottom: 10px;">
      <label>Color by:</label>
      <div class="toggle-switch">
        <button
          v-if="viewMode === 'teacher'"
          :class="{ active: colorMode === 'subject' }"
          @click="setColorMode('subject')"
        >Subject</button>
        <button
          v-if="viewMode === 'teacher'"
          :class="{ active: colorMode === 'class' }"
          @click="setColorMode('class')"
        >Class</button>
        <button
          v-if="viewMode === 'class'"
          :class="{ active: colorMode === 'subject' }"
          @click="setColorMode('subject')"
        >Subject</button>
        <button
          v-if="viewMode === 'class'"
          :class="{ active: colorMode === 'teacher' }"
          @click="setColorMode('teacher')"
        >Teacher</button>
      </div>
    </div>
    <table class="schedule-table" :style="tableStyles">
      <thead>
        <tr>
          <th class="staff-header">{{ staffLabel }}</th>
          <template v-for="(day, dayIndex) in sortedDays" :key="'day-'+dayIndex">
            <th :colspan="sortedPeriods.length" class="day-header day-separator">{{ day.name_de }}</th>
          </template>
        </tr>
        <tr>
          <th></th>
          <template v-for="(day, dayIndex) in sortedDays" :key="'period-row-'+dayIndex">
            <template v-for="(period, periodIndex) in sortedPeriods" :key="'period-'+dayIndex+'-'+periodIndex">
              <th class="period-header">{{ period.label ? period.label.charAt(0) : period.block_number }}</th>
            </template>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(rowItem, rowIndex) in staff" :key="'row-'+rowIndex">
          <td class="staff-cell">
            <div class="teacher-info">
              <span>{{ rowItem }}</span>
              <span
                v-if="viewMode === 'teacher'"
                class="lesson-count"
                :class="getTeacherLessonCountClass(rowItem)"
                :title="getWorkloadTooltip(rowItem)"
              >
                {{ getTeacherLessonCount(rowItem) }}/{{ getTeacherHoursAccount(rowItem) }}
              </span>
            </div>
          </td>
          <template v-for="(day, dayIndex) in sortedDays" :key="'row-day-'+rowIndex+'-'+dayIndex">
            <template v-for="(period, periodIndex) in sortedPeriods" :key="'cell-'+rowIndex+'-'+dayIndex+'-'+periodIndex">
              <td
                class="schedule-cell"
                :class="{
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
                  'day-separator': periodIndex === 0
                }"
                :style="getCellStyle(rowItem, day.name_de, period.block_number, { hovered: highlightedScheduleId && getLesson(rowItem, day.name_de, period.block_number)?.id === highlightedScheduleId })"
                :data-day="day.name_de"
                :data-period="period.block_number"
                :data-teacher="viewMode === 'teacher' ? rowItem : undefined"
                :data-class="viewMode === 'class' ? rowItem : undefined"
                @click="onCellClick($event, rowItem, day.name_de, period.block_number)"
                @contextmenu.prevent="onCellRightClick($event, rowItem, day.name_de, period.block_number)"
                @mouseover="onCellHover(rowItem, day.name_de, period.block_number)"
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
              </td>
            </template>
          </template>
        </tr>
      </tbody>
    </table>

    <InfoBox
      :show="showInfoBox"
      :lesson="selectedLesson"
      :position="infoBoxPosition"
      @close="closeInfoBox"
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
      :teachers="teachers"
      :selectedTeacherIds="selectedTeacherIds"
      :existingLesson="modalExistingLesson"
      :selectedSubjectId="selectedSubject"
      :selectedClassId="selectedClass"
      :selectedRoomId="selectedRoom"
      @close="closeLessonModal"
      @save="saveDraftLesson"
      @delete="deleteDraftLesson"
      @teacherIdsChange="onTeacherIdsChange"
    />
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import InfoBox from './components/InfoBox.vue';
import InlineLessonForm from './components/InlineLessonForm.vue';
import {
  calculateBoxPosition,
  getTeacherByName,
  getPeriodByNumber,
  createLessonLookupMaps,
  getOptimizedLesson,
  getOptimizedTeacherLessonCount
} from './utils/scheduleUtils';

export default {
  components: { InfoBox, InlineLessonForm },
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
    const staffLabel = computed(() => viewMode.value === 'class' ? 'Class' : 'Teacher');

    // SORTED DAYS/PERIODS
    const sortedDays = computed(() => [...days.value].sort((a, b) => (a.day_number || 0) - (b.day_number || 0)));
    const sortedPeriods = computed(() => [...periods.value].sort((a, b) => (a.block_number || 0) - (b.block_number || 0)));

    // LESSONS ARRAY AND OPTIMIZED LOOKUPS
    const activeLessons = computed(() => {
      return mode.value === 'planning'
        ? [...(draftLessons.value || []).map(l => ({ ...l, isDraft: true }))]
        : [...(lessons.value || [])];
    });

    // Pre-computed lookup maps for performance optimization
    const lessonLookupMaps = computed(() => {
      return createLessonLookupMaps(activeLessons.value, viewMode.value);
    });

    // DEBUG PROPERTY
    const debugLessonsCount = computed(() => ({
      mode: mode.value,
      lessonsCount: lessons.value?.length || 0,
      draftLessonsCount: draftLessons.value?.length || 0,
      activeLessonsCount: activeLessons.value?.length || 0
    }));

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
      if (count >= 29) return 'count-over';
      if (count === 28) return 'count-full';
      if (count >= 22) return 'count-warning';
      return 'count-normal';
    };

    const getWorkloadTooltip = (teacherName) => {
      const count = getTeacherLessonCount(teacherName);
      const total = getTeacherHoursAccount(teacherName);
      const remaining = total - count;
      if (count >= 29) return `Overloaded: ${count} lessons assigned (${remaining} over capacity)`;
      if (count === 28) return `Full capacity: ${count}/${total} lessons assigned`;
      if (count >= 22) return `Near capacity: ${count}/${total} lessons assigned (${remaining} remaining)`;
      return `Normal load: ${count}/${total} lessons assigned (${remaining} remaining)`;
    };

    // InfoBox state (live mode)
    const showInfoBox = ref(false);
    const selectedLesson = ref(null);
    const selectedCell = ref(null);
    const infoBoxPosition = ref({ top: '0px', left: '0px' });
    const highlightedScheduleId = ref(null);

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
          if (Array.isArray(lesson.teacher_ids) && lesson.teacher_ids.length > 1) {
            // Gradient for team teaching
            const teacherColors = lesson.teacher_ids.map(id => {
              const teacher = teachers.value.find(t => t.id === id);
              return teacher?.color || 'white';
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
            const teacher = teachers.value.find(t => t.id === lesson.teacher_ids[0]);
            style.background = teacher?.color || 'white';
          }
        }
      }

      return style;
    };

    // Hover logic
    const onCellHover = (rowItem, dayName, blockNumber) => {
      if (isEditing.value) return;
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
      highlightedScheduleId.value = null;
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
          ? { name: rowItem, id: teacherObj?.id }
          : { name: '', id: null };
        modalClass.value = viewMode.value === 'class'
          ? { name: rowItem, id: classObj?.id }
          : { name: '', id: null };
        modalDay.value = dayName;
        modalDayId.value = dayObj?.day_id;
        modalPeriod.value = blockNumber;
        modalPeriodId.value = periodObj?.id;
        modalExistingLesson.value = lesson;
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
          const lessonData = {
            teacher: viewMode.value === 'teacher' ? rowItem : null,
            teacherId: viewMode.value === 'teacher' && teacherObj ? teacherObj.id : null,
            teacher_ids: viewMode.value === 'class'
            ? selectedTeacherIds.value
            : teacherObj && teacherObj.id ? [teacherObj.id] : [],
            teacher_names: viewMode.value === 'class'
              ? selectedTeacherIds.value.map(id => {
                  const t = teachers.value.find(tt => (tt.user_id || tt.id) === id);
                  return t ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : '';
                })
              : teacherObj
                ? [`${teacherObj.first_name || ''} ${teacherObj.last_name || ''}`.trim()]
                : [],   
            class: viewMode.value === 'class' ? rowItem : null,
            classId: viewMode.value === 'class' ? classObj?.id : selectedClass.value,
            day: dayName,
            dayId: dayObj?.day_id,
            period: blockNumber,
            periodId: periodObj?.id,
            subjectId: selectedSubject.value,
            roomId: selectedRoom.value,
            id: `draft-${Date.now()}`
          };
          emit('trigger-event', { name: 'assignDraftLesson', event: { value: lessonData } });
        } else if (!lesson) {
          lessonFormPosition.value = calculateBoxPosition(event, 300, 400);
          showLessonModal.value = true;
          if (viewMode.value === 'class') {
            const teacherIds = lesson && Array.isArray(lesson.teacher_ids)
              ? lesson.teacher_ids
              : (lesson && lesson.teacher_id ? [lesson.teacher_id] : []);
            emit('trigger-event', {
              name: 'selectedTeacherIdsChange',
              event: { value: teacherIds }
            });
          }
        } else {
          lessonFormPosition.value = calculateBoxPosition(event, 300, 400);
          showLessonModal.value = true;
        }
      } else {
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
      const lesson = getLesson(rowItem, dayName, blockNumber);
      if (!lesson) return;
      const teacherObj = viewMode.value === 'teacher'
      ? teachers.value.find(
      t =>
      `${(t.first_name || '').trim()} ${(t.last_name || '').trim()}`.trim() === (rowItem || '').trim()
      )
      : null;
      const classObj = viewMode.value === 'class'
        ? classes.value.find(c => c.name === rowItem)
        : null;
      const dayObj = days.value.find(d =>
        d.name === dayName || d.name_de === dayName || d.day_name === dayName
      );
      const periodObj = getPeriodByNumber(periods.value, blockNumber);
      modalTeacher.value = viewMode.value === 'teacher'
        ? { name: rowItem, id: teacherObj?.id }
        : { name: '', id: null };
      modalClass.value = viewMode.value === 'class'
        ? { name: rowItem, id: classObj?.id }
        : { name: '', id: null };
      modalDay.value = dayName;
      modalDayId.value = dayObj?.day_id;
      modalPeriod.value = blockNumber;
      modalPeriodId.value = periodObj?.id;
      modalExistingLesson.value = lesson;
      lessonFormPosition.value = calculateBoxPosition(event, 300, 400);
      showLessonModal.value = true;
      selectedCell.value = {
        teacher: viewMode.value === 'teacher' ? rowItem : null,
        class: viewMode.value === 'class' ? rowItem : null,
        day: dayName,
        period: blockNumber
      };
      if (viewMode.value === 'class') {
        const teacherIds = lesson && Array.isArray(lesson.teacher_ids)
          ? lesson.teacher_ids
          : (lesson && lesson.teacher_id ? [lesson.teacher_id] : []);
        emit('trigger-event', {
          name: 'selectedTeacherIdsChange',
          event: { value: teacherIds }
        });
      }
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
    };
    onMounted(() => document.addEventListener('click', handleOutsideClick));
    onUnmounted(() => document.removeEventListener('click', handleOutsideClick));

    // Modal controls
    const closeLessonModal = () => {
      showLessonModal.value = false;
      selectedCell.value = null;
    };
    const saveDraftLesson = (lessonData, eventName = 'assignDraftLesson') => {
      if (lessonData.teacherId && !Array.isArray(lessonData.teacher_ids)) {
        lessonData.teacher_ids = [lessonData.teacherId];
      }
      if (lessonData.teacher && !Array.isArray(lessonData.teacher_names)) {
        lessonData.teacher_names = [lessonData.teacher];
      }
      emit('trigger-event', {
        name: eventName || 'assignDraftLesson',
        event: { value: lessonData }
      });
      closeLessonModal();
      selectedCell.value = null;
    };
    const deleteDraftLesson = lessonId => {
      emit('trigger-event', {
        name: 'deleteDraftLesson',
        event: { value: lessonId }
      });
      closeLessonModal();
      selectedCell.value = null;
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
      onCellClick,
      onCellRightClick,
      onCellHover,
      onCellLeave,
      closeInfoBox,
      mode,
      viewMode,                   // ✅ GOOD: keeps reactivity in template!
      colorMode,
      setColorMode,
      colorMode,
      setColorMode,
      availableSubjects,
      availableClasses,
      availableRooms,
      teachers,
      classes,
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
      debugLessonsCount,
      getTeacherLessonCount,
      getTeacherHoursAccount,
      getTeacherLessonCountClass,
      getWorkloadTooltip,
      getTeacherAbbreviations,
      getCellStyle
    };
  }
};
</script>

<style lang="scss" scoped>
.schedule-table-container {
  width: 100%;
  overflow-x: auto;
  position: relative;

  .color-mode-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
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
        transition: background 0.2s, color 0.2s;
        &.active, &:hover {
          background: #007bff;
          color: #fff;
          border-color: #007bff;
        }
      }
    }
  }

  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--border-color);

    th,
    td {
      border: 1px solid var(--border-color);
      padding: var(--cell-padding);
      text-align: center;
    }

    thead {
      background-color: var(--header-bg);

      th {
        font-weight: bold;
      }
    }

    .staff-header,
    .staff-cell {
      text-align: left;
      min-width: 120px;
      
      // Blue text for all staff names (visual confirmation of performance update)
      .teacher-info span:first-child {
        color: #007bff;
        font-weight: 500;
      }
    }

    .day-header {
      min-width: 80px;
      border-right: 3px solid #aaa;
    }

    .period-header {
      min-width: 40px;
    }

    .schedule-cell {
      min-width: 40px;
      height: 40px;
      cursor: pointer;
      transition: box-shadow 0.15s, background 0.15s;

      &.day-separator {
        border-left: 3px solid #aaa;
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    .selected-cell {
      outline: 2px solid #007bff;
      background-color: rgba(0, 123, 255, 0.1);
    }

    .draft-lesson {
      border: 2px dashed #28a745;
      background-color: rgba(40, 167, 69, 0.1);
    }

    .scheduled-lesson {
      color: blue;
    }

    // No background for team teaching - only shadow will be handled inline
    .team-teaching {}

    .lesson-block {
      text-align: center;
    }

    .lesson-class,
    .lesson-subject {
      display: block;
      line-height: 1.1;
    }

    .team-highlight {
      background-color: rgba(255, 193, 7, 0.08);
    }

    .teacher-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .lesson-count {
      font-size: 0.85em;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .count-normal {
      background-color: #f0f0f0;
      color: #333;
    }

    .count-warning {
      background-color: #fff3cd;
      color: #856404;
    }

    .count-full {
      background-color: #d4edda;
      color: #155724;
    }

    .count-over {
      background-color: #f8d7da;
      color: #721c24;
    }

    .teacher-abbrevs {
      display: flex;
      flex-direction: column;
      align-items: center;
      .teacher-abbr {
        font-size: 12px;
        font-weight: bold;
        margin: 1px 0;
      }
      &.stacked .teacher-abbr {
        font-size: 11px;
      }
    }
  }

  .termin-indicator {
    display: inline-block;
    color: #ffffff;
    background-color: #ff9800;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    font-weight: bold;
  }
}
</style>
