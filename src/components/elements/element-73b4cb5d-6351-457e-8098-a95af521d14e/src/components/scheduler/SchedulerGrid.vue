<template>
  <div class="scheduler-grid" role="grid" aria-label="School schedule grid" :data-readonly="isReadOnly">
    <!-- Soft warning instead of gating the whole grid -->
    <div v-if="!hasData" class="grid-hidden-debug">
      No school days or periods provided yet. The grid will populate as soon as data arrives.
    </div>

    <!-- Main Grid (always renders) -->
    <div class="main-grid-container">
      <!-- Grid Header -->
      <div class="grid-header" role="row" ref="gridHeaderRef">
        <div class="period-header-cell" role="columnheader">
          <span class="period-label">Period</span>
        </div>
        <div
          v-for="(day, index) in visibleDays"
          :key="day.id ?? index"
          class="day-header-cell"
          role="columnheader"
          :aria-colindex="index + 1"
        >
          <span class="day-name">{{ day.name }}</span>
          <span class="day-date" v-if="day.date">{{ formatDate(day.date) }}</span>
        </div>
      </div>

      <!-- Grid Body -->
      <div class="grid-body">
        <div
          v-for="(period, periodIndex) in visiblePeriods"
          :key="period.id ?? periodIndex"
          class="grid-row"
          :class="{ 'non-instructional': !period.is_instructional }"
          role="row"
          :aria-rowindex="periodIndex + 1"
        >
          <!-- Period Label -->
          <div
            class="period-label-cell"
            role="rowheader"
            :class="{ focused: isFocused(period.id) }"
            @click="togglePeriodFocus(period.id)"
            title="Click to focus on this period"
          >
            <div class="period-info">
              <span class="period-name">{{ period.name }}</span>
              <span class="period-time">{{ formatTime(period.start_time) }} - {{ formatTime(period.end_time) }}</span>
              <span v-if="!period.is_instructional" class="non-instructional-badge">
                {{ period.type || 'Break' }}
              </span>
            </div>
          </div>

          <!-- Day Cells -->
          <div
            v-for="(day, dIdx) in visibleDays"
            :key="`${period.id ?? periodIndex}-${day.id ?? dIdx}`"
            class="schedule-cell drop-zone"
            :class="getCellClasses(day.id, period.id)"
            role="gridcell"
            tabindex="0"
            @click="handleCellClick(day.id, period.id, period)"
            @keydown.enter="handleCellClick(day.id, period.id, period)"
            @keydown.space.prevent="handleCellClick(day.id, period.id, period)"
            :aria-label="getCellAriaLabel(day, period)"
            @dragover.prevent="(!isReadOnly && !isLiveMode) ? handleCellDragOver($event) : null"
            @dragenter.prevent="(!isReadOnly && !isLiveMode) ? handleCellDragEnter($event) : null"
            @dragleave="(!isReadOnly && !isLiveMode) ? handleCellDragLeave($event) : null"
            @drop="(!isReadOnly && !isLiveMode) ? handleCellDrop($event, day.id, period.id) : null"
            :data-day-id="day.id"
            :data-period-id="period.id"
          >
            <!-- Assignments -->
            <div v-if="safeLength(getCellAssignments(day.id, period.id)) > 0" class="assignments-container">
              <div
                v-for="(assignment, index) in getCellAssignments(day.id, period.id)"
                :key="assignment.id ?? index"
                class="assignment-item draggable-assignment"
                :class="getAssignmentClasses(assignment)"
                :style="getAssignmentStyles(assignment)"
                @click.stop="handleAssignmentClick(assignment, day.id, period.id)"
                @contextmenu.stop.prevent="openContextMenu($event, assignment, day.id, period.id)"
                :draggable="(!isReadOnly && !isLiveMode) && !isEditing(assignment.id)"
                @dragstart="(!isReadOnly && !isLiveMode) ? handleAssignmentDragStart($event, assignment, day.id, period.id) : null"
                @dragend="(!isReadOnly && !isLiveMode) ? handleAssignmentDragEnd($event) : null"
                :data-assignment-id="assignment.id"
                :data-day-id="day.id"
                :data-period-id="period.id"
              >
                <div v-if="!isEditing(assignment.id)" class="assignment-content">
                  <span class="course-name">{{ getDisplayName(assignment) }}</span>
                  <span class="meta-line">
                    <span class="teacher-names" v-if="getAssignmentTeachers(assignment)">
                      {{ getAssignmentTeachers(assignment) }}
                    </span>
                    <span class="room-name" v-if="assignment.room_id">• {{ getRoomName(assignment.room_id) }}</span>
                  </span>
                </div>
                <div v-if="hasConflicts(assignment)" class="conflict-indicator" title="Has conflicts">⚠️</div>
                <div v-if="hasDeletedEntities(assignment)" class="deleted-warning" title="Missing data">❌</div>
              </div>
            </div>

            <!-- Empty Cell -->
            <div v-else class="empty-cell">
              <template v-if="!isReadOnly && !isLiveMode && enableCellAdd">
                <span class="add-text">Add Course</span>
              </template>
              <template v-else>
                <span class="empty-text">No assignments</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Grade Statistics Row -->
        <div v-if="showStatistics && focusedPeriodId" class="statistics-row">
          <div class="period-label-cell stats-label-cell">
            <div class="stats-title">
              <span class="stats-emoji">📈</span>
              <span>Grade Stats</span>
            </div>
          </div>

          <div v-for="day in visibleDays" :key="`stats-${day.id}`" class="day-statistics-cell">
            <div class="stats-headers" role="presentation">
              <div class="header-spacer" aria-hidden="true"></div>
              <div class="stat-header" title="Total free spots available">📊</div>
              <div class="stat-header" title="Average spots available">⚖️</div>
              <div class="stat-header" title="Courses available">📚</div>
            </div>
            <div class="stats-rows">
              <div
                v-for="gradeStats in getDailyGradeStats(day.id, focusedPeriodId)"
                :key="`${day.id}-${gradeStats.grade}`"
                class="grade-stats-row"
              >
                <div class="grade-number">{{ gradeStats.grade }}:</div>
                <div class="stat-value">{{ formatInt(gradeStats.totalSpots) }}</div>
                <div class="stat-value">{{ formatInt(gradeStats.averageSpots) }}</div>
                <div class="stat-value">{{ formatInt(gradeStats.coursesCount) }}</div>
              </div>
            </div>
            <div v-if="safeLength(getDailyGradeStats(day.id, focusedPeriodId)) === 0" class="no-stats">
              <span class="no-stats-text">No courses scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Courses Panel (hidden in live or read-only), aligned with grid columns -->
    <div v-if="focusedPeriodId && !isReadOnly && !isLiveMode" class="available-courses-panel">
      <h3>Available Courses for {{ getFocusedPeriodName() }}</h3>
      <div class="focused-period-info">
        <em>Drag a course into a day cell to schedule it, or click a card to assign.</em>
      </div>

      <!-- Exact column alignment: template set via availableGridTemplate -->
      <div
        class="day-courses-grid"
        ref="availableGridRef"
        :style="{ gridTemplateColumns: availableGridTemplate }"
      >
        <!-- First track is the label spacer (same width as period column) -->
        <div class="grid-label-spacer" aria-hidden="true"></div>

        <!-- One column per visible day, widths match header day cells -->
        <div v-for="day in visibleDays" :key="`avail-${day.id}`" class="day-courses-column">
          <div class="available-courses-list">
            <div
              v-for="course in getAvailableCoursesForSlot(day.id, focusedPeriodId)"
              :key="course.id"
              class="course-card draggable-course"
              :class="{ 'is-dragging': isDraggingCourse(course.id) }"
              :style="getCourseCardStyle(course)"
              :title="`${course.name || course.course_name || course.title || 'Course'}`"
              :draggable="true"
              :data-course-id="course.id"
              :data-day-id="day.id"
              :data-period-id="focusedPeriodId"
              @dragstart="handleCourseDragStart($event, course)"
              @dragend="handleCourseDragEnd($event)"
              @click="assignCourseToSlot(course, day.id, focusedPeriodId)"
            >
              <div class="course-name">{{ course.name || course.course_name || course.title }}</div>
              <div class="course-details">
                <small v-if="course.course_code">Code: {{ course.course_code }}</small>
                <small v-if="course.max_students">Max: {{ course.max_students }}</small>
                <small v-if="course.subject_name">{{ course.subject_name }}</small>
              </div>
            </div>
            <div v-if="safeLength(getAvailableCoursesForSlot(day.id, focusedPeriodId)) === 0" class="no-courses">
              No courses available for this day/period
            </div>
          </div>
        </div>
      </div>

      <div v-if="safeLength(getNoPreferredDaysCourses()) > 0" class="no-preferred-days-panel">
        <h4>📅 Courses with No Preferred Days</h4>
        <p class="panel-description">These can be scheduled on any day:</p>
        <div class="no-preferred-courses-list">
          <div
            v-for="course in getNoPreferredDaysCourses()"
            :key="`no-pref-${course.id}`"
            class="course-card"
            :style="getCourseCardStyle(course)"
            @click="focusedPeriodId ? assignCourseToSlot(course, visibleDays[0]?.id, focusedPeriodId) : null"
          >
            <div class="course-name">{{ course.name || course.course_name || course.title }}</div>
            <div class="course-details">
              <small v-if="course.course_code">Code: {{ course.course_code }}</small>
              <small v-if="course.max_students">Max: {{ course.max_students }}</small>
              <small v-if="course.subject_name">{{ course.subject_name }}</small>
              <small class="flexible-tag">📅 Flexible scheduling</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher/Room Selection Modal (preselects possible_staff_ids) -->
    <TeacherRoomSelectionModal
      v-if="showTeacherRoomModal && modalCourseData"
      :courseId="modalCourseData.courseId"
      :courseName="modalCourseData.courseName"
      :dayId="modalCourseData.dayId"
      :periodId="modalCourseData.periodId"
      :teachers="teachers"
      :rooms="rooms"
      :preselectedTeacherIds="modalCourseData.preselectedTeacherIds || []"
      @submit="handleTeacherRoomSubmit"
      @cancel="handleTeacherRoomCancel"
    />

    <!-- Context Menu -->
    <teleport to="body">
      <div
        v-if="contextMenu.show"
        class="context-menu"
        role="menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
        ref="contextMenuRef"
      >
        <div class="context-menu-item" role="menuitem" @click="editAssignmentFromContext">
          {{ (!isReadOnly && !isLiveMode) ? '✏️ Edit Assignment' : '📄 View Assignment' }}
        </div>
        <div
          v-if="!isReadOnly && !isLiveMode"
          class="context-menu-item delete"
          role="menuitem"
          @click="deleteAssignmentFromContext"
        >
          🗑️ Delete Assignment
        </div>
      </div>
      <div v-if="contextMenu.show" class="context-menu-backdrop" @click="closeContextMenu"></div>
    </teleport>

    <!-- Assignment Editor Modal (POPUP) -->
    <teleport to="body">
      <div v-if="editingAssignment" class="assignment-editor-backdrop" @click="cancelInlineEdit"></div>
      <div
        v-if="editingAssignment"
        class="assignment-editor-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="editorModalTitle"
      >
        <div class="editor-modal-header">
          <div class="editor-modal-title">{{ editorModalTitle }}</div>
          <button class="editor-modal-close" @click="cancelInlineEdit" aria-label="Close">×</button>
        </div>
        <div class="editor-modal-body">
          <InlineAssignmentEditor
            :assignment="editingAssignment"
            :courses="courses"
            :teachers="teachers"
            :classes="classes"
            :rooms="rooms"
            :subjects="subjects"
            @save="onEditorSave"
            @cancel="cancelInlineEdit"
            @delete="onEditorDelete"
            @edit-course="handleCourseEdit"
          />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import InlineAssignmentEditor from './InlineAssignmentEditor.vue';
import TeacherRoomSelectionModal from './TeacherRoomSelectionModal.vue';
import { emitSchedulerRemoveEvent } from '../../utils/events.js';

export default {
  name: 'SchedulerGrid',
  components: { InlineAssignmentEditor, TeacherRoomSelectionModal },
  props: {
    periods: { type: Array, default: () => [] },
    schoolDays: { type: Array, default: () => [] },
    courses: { type: Array, default: () => [] },
    teachers: { type: Array, default: () => [] },
    classes: { type: Array, default: () => [] },
    rooms: { type: Array, default: () => [] },
    subjects: { type: Array, default: () => [] },
    draftSchedules: { type: Array, default: () => [] },
    liveSchedules: { type: Array, default: () => [] },
    isReadOnly: { type: Boolean, default: false },
    isLiveMode: { type: Boolean, default: false },
    showStatistics: { type: Boolean, default: true },
    maxDays: { type: Number, default: 6 },
    enableCellAdd: { type: Boolean, default: false },
    hideScheduledInAvailable: { type: Boolean, default: true },
    parentEmit: { type: Function, default: null },
    emitDropEvents: { type: Boolean, default: false },
    conflicts: { type: Array, default: () => [] },
    canUndo: { type: Boolean, default: false },
    isSaving: { type: Boolean, default: false },
  },
  emits: [
    'cell-click',
    'assignment-details',
    'update-assignments',
    'period-focus-changed',
    'scheduler-drop',
    'scheduler-drag-start',
    'scheduler-drag-end',
    'course-edit',
  ],
  setup(props, { emit }) {
    // Helpers
    const safeArray = (v) => (Array.isArray(v) ? v : []);
    const safeLength = (v) => (Array.isArray(v) ? v.length : 0);
    const normId = (v) => String(v ?? '');
    const isSameId = (a, b) => normId(a) === normId(b);

    // DOM refs for measuring column widths
    const gridHeaderRef = ref(null);
    const availableGridRef = ref(null);
    const availableGridTemplate = ref('var(--label-col,140px) repeat(var(--days-count,5), 1fr)');

    // Focus
    const focusedPeriodId = ref(null);

    // Drag state
    const draggedCourse = ref(null);
    const draggedAssignment = ref(null);

    // Available list behavior
    const optimisticallyScheduled = ref(new Set());
    const recurringWhitelist = ref(new Set());

    // Inline editor/context menu
    const editingAssignment = ref(null);
    const editingCell = ref(null);

    const contextMenu = ref({ show: false, x: 0, y: 0, assignment: null, dayId: null, periodId: null });
    const contextMenuRef = ref(null);

    // Teacher modal
    const showTeacherRoomModal = ref(false);
    const modalCourseData = ref(null);

    // Visible data
    const visibleDays = computed(() => safeArray(props.schoolDays).slice(0, props.maxDays || 7));
    const visiblePeriods = computed(() => {
      const all = safeArray(props.periods);
      if (!focusedPeriodId.value) return all;
      const filtered = all.filter((p) => isSameId(p.id, focusedPeriodId.value));
      return filtered.length ? filtered : all;
    });
    const currentSchedules = computed(() => (props.isLiveMode ? props.liveSchedules : props.draftSchedules));
    const hasData = computed(() => safeLength(visibleDays.value) > 0 && safeLength(visiblePeriods.value) > 0);

    // Formatting
    const formatTime = (t) => {
      if (!t) return '';
      const parts = String(t).split(':');
      return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : String(t);
    };
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
    const formatInt = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : v;
    };

    // Lookups
    const find = (arr, id) => safeArray(arr).find((x) => isSameId(x.id, id));
    const getCourseName = (id) => (id ? (find(props.courses, id)?.name || find(props.courses, id)?.course_name || find(props.courses, id)?.title || null) : null);
    const getSubjectName = (id) => (id ? (find(props.subjects, id)?.name || find(props.subjects, id)?.title || find(props.subjects, id)?.subject_name || null) : null);
    const getDisplayName = (a) => getCourseName(a.course_id) || getSubjectName(a.subject_id) || 'No Course';
    const getClassName = (id) => (id ? find(props.classes, id)?.name || '' : '');
    const getTeacherNames = (ids) => (!ids?.length ? '' : ids.map((id) => find(props.teachers, id)?.name).filter(Boolean).join(', '));
    const getAssignmentTeachers = (a) => {
      if (Array.isArray(a.teacher_names) && a.teacher_names.length) return a.teacher_names.join(', ');
      const ids = a.staff_ids || a.teacher_ids;
      return ids?.length ? getTeacherNames(ids) : '';
    };
    const getRoomName = (id) => (id ? find(props.rooms, id)?.name || 'Unknown Room' : 'No Room');

    const hasConflicts = (a) =>
      props.conflicts.some(
        (c) =>
          isSameId(c.day_id, a.day_id) &&
          isSameId(c.period_id, a.period_id) &&
          (isSameId(c.assignment_id, a.id) ||
            c.teacher_ids?.some((id) => (a.teacher_ids || []).some((x) => isSameId(x, id))) ||
            isSameId(c.class_id, a.class_id) ||
            isSameId(c.room_id, a.room_id))
      );
    const hasDeletedEntities = (a) => {
      const courseOk = !a.course_id || !!find(props.courses, a.course_id);
      const classOk = !a.class_id || !!find(props.classes, a.class_id);
      const roomOk = !a.room_id || !!find(props.rooms, a.room_id);
      const teachersOk = !a.teacher_ids?.length || a.teacher_ids.every((id) => !!find(props.teachers, id));
      return !(courseOk && classOk && roomOk && teachersOk);
    };

    // Cells
    const getCellAssignments = (dayId, periodId) => {
      const list = currentSchedules.value.filter((a) => isSameId(a.day_id, dayId) && isSameId(a.period_id, periodId));
      return list.sort((a, b) => {
        const ca = getClassName(a.class_id);
        const cb = getClassName(b.class_id);
        if (ca !== cb) return ca.localeCompare(cb);
        const pa = getCourseName(a.course_id) || getSubjectName(a.subject_id) || '';
        const pb = getCourseName(b.course_id) || getSubjectName(b.subject_id) || '';
        return pa.localeCompare(pb);
      });
    };
    const getCellClasses = (dayId, periodId) => {
      const as = getCellAssignments(dayId, periodId);
      const classes = [];
      if (safeLength(as) > 0) classes.push('has-assignments');
      if (safeLength(as) > 1) classes.push('multiple-assignments');
      if (as.some((a) => props.conflicts.some((c) => isSameId(c.day_id, dayId) && isSameId(c.period_id, periodId))))
        classes.push('has-conflicts');
      return classes;
    };
    const getCellAriaLabel = (day, period) => {
      const as = getCellAssignments(day.id, period.id);
      if (safeLength(as) === 0) return `${day.name} ${period.name}: Empty, click to add assignment`;
      const names = as.map((a) => getDisplayName(a)).join(', ');
      return `${day.name} ${period.name}: ${names}, ${as.length} assignment${as.length > 1 ? 's' : ''}`;
    };

    const getAssignmentClasses = (a) => {
      const classes = [];
      if (hasConflicts(a)) classes.push('has-conflict');
      if (hasDeletedEntities(a)) classes.push('has-deleted-entities');
      if (!getCourseName(a.course_id) && a.subject_id) classes.push('lesson-schedule');
      return classes;
    };
    const getAssignmentStyles = (a) => {
      const course = find(props.courses, a.course_id);
      const cls = find(props.classes, a.class_id);
      return {
        borderLeft: `4px solid ${course?.color || cls?.color || '#e0e0e0'}`,
        backgroundColor: course?.color ? `${course.color}15` : (cls?.color ? `${cls.color}15` : '#f9f9f9'),
      };
    };

    // Normalize slots (supports objects or "day|period" strings)
    const normalizeSlots = (course) => {
      const out = [];
      const pushIfValid = (d, p) => { if (d != null && p != null) out.push({ dayId: String(d), periodId: String(p) }); };

      if (Array.isArray(course?.possibleSlots)) {
        course.possibleSlots.forEach((s) => pushIfValid(s.dayId, s.periodId));
      }
      if (Array.isArray(course?.possible_time_slots)) {
        course.possible_time_slots.forEach((s) => {
          if (typeof s === 'string') {
            const [d, p] = String(s).split('|');
            pushIfValid(d, p);
          } else if (s && typeof s === 'object') {
            const d = s.dayId ?? s.day_id ?? s.day ?? s.day_number ?? s.dayNumber;
            const p = s.periodId ?? s.period_id ?? s.blockId ?? s.block_id ?? s.period ?? s.periodId;
            pushIfValid(d, p);
          }
        });
      }
      return out;
    };
    const isCourseAllowedForSlot = (course, dayId, periodId) => {
      const slots = normalizeSlots(course);
      if (!slots.length) return true;
      const d = normId(dayId), p = normId(periodId);
      return slots.some((s) => isSameId(s.dayId, d) && isSameId(s.periodId, p));
    };
    const buildAllowedSlotsLabel = (course) => {
      const slots = normalizeSlots(course);
      if (!slots.length) return 'any day and period';
      const byDay = {};
      slots.forEach(({ dayId, periodId }) => {
        const dayName = props.schoolDays.find((d) => isSameId(d.id, dayId))?.name || `Day ${dayId}`;
        const perName = props.periods.find((p) => isSameId(p.id, periodId))?.name || 'Period';
        byDay[dayName] = byDay[dayName] ? [...byDay[dayName], perName] : [perName];
      });
      return Object.entries(byDay).map(([dn, per]) => `${dn} (${Array.from(new Set(per)).join(', ')})`).join('; ');
    };

    // Context menu
    const computeContextMenuPosition = (evt, menuSize = { w: 220, h: 96 }) => {
      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;
      let x = (evt?.clientX ?? 0) + 6;
      let y = (evt?.clientY ?? 0) + 6;
      if (x + menuSize.w > vw) x = Math.max(8, vw - menuSize.w - 8);
      if (y + menuSize.h > vh) y = Math.max(8, vh - menuSize.h - 8);
      return { x, y };
    };
    const openContextMenu = (event, assignment, dayId, periodId) => {
      event.stopPropagation();
      event.preventDefault();
      const pos = computeContextMenuPosition(event);
      contextMenu.value = { show: true, x: pos.x, y: pos.y, assignment, dayId, periodId };
      nextTick(() => contextMenuRef.value?.focus?.());
    };
    const closeContextMenu = () => (contextMenu.value.show = false);
    const editAssignmentFromContext = () => {
      if (!contextMenu.value.assignment) return;
      if (props.isReadOnly || props.isLiveMode) startInlineEditReadOnly(contextMenu.value.assignment, contextMenu.value.dayId, contextMenu.value.periodId);
      else startInlineEdit(contextMenu.value.assignment, contextMenu.value.dayId, contextMenu.value.periodId);
      closeContextMenu();
    };
    const deleteAssignmentFromContext = () => {
      const a = contextMenu.value.assignment;
      if (!a || props.isReadOnly || props.isLiveMode) { closeContextMenu(); return; }
      deleteInlineAssignment(a);
      closeContextMenu();
    };

    // Click handlers
    const handleCellClick = (dayId, periodId, period) => {
      if (props.isReadOnly || !props.enableCellAdd) return;
      emit('cell-click', { dayId, periodId, period, mode: 'add', preSelectedCourse: null });
    };
    const handleAssignmentClick = (assignment) => emit('assignment-details', assignment);

    // Inline editor (popup)
    const isEditing = (id) => editingAssignment.value?.id === id;
    const startInlineEdit = (a, dayId, periodId) => {
      if (props.isReadOnly || props.isLiveMode) return;
      editingAssignment.value = a; editingCell.value = { dayId, periodId };
    };
    const startInlineEditReadOnly = (a, dayId, periodId) => {
      editingAssignment.value = a; editingCell.value = { dayId, periodId };
    };
    const saveInlineEdit = (updated) => {
      const data = currentSchedules.value;
      const updatedList = data.map((s) => (isSameId(s.id, updated.id) ? updated : s));
      emit('update-assignments', updatedList);
      editingAssignment.value = null; editingCell.value = null;
    };
    const cancelInlineEdit = () => { editingAssignment.value = null; editingCell.value = null; };
    const deleteInlineAssignment = (a) => {
      if (props.emitDropEvents) {
        const fn = props.parentEmit || emit;
        emitSchedulerRemoveEvent(fn, {
          dayId: a.day_id, periodId: a.period_id, assignmentId: a.id,
          courseId: a.course_id, courseName: a.course_name || a.display_cell || '',
        });
      }
      const data = currentSchedules.value.filter((s) => !isSameId(s.id, a.id));
      emit('update-assignments', data);
      editingAssignment.value = null; editingCell.value = null;
    };
    const onEditorSave = (updated) => {
      if (props.isReadOnly || props.isLiveMode) return;
      saveInlineEdit(updated);
    };
    const onEditorDelete = (a) => {
      if (props.isReadOnly || props.isLiveMode) return;
      deleteInlineAssignment(a);
    };
    const editorModalTitle = computed(() => {
      const a = editingAssignment.value;
      if (!a) return '';
      const name = getDisplayName(a);
      return (props.isReadOnly || props.isLiveMode) ? `View Assignment – ${name}` : `Edit Assignment – ${name}`;
    });

    // Drag: course
    const handleCourseDragStart = (event, course) => {
      draggedCourse.value = course;
      emit('scheduler-drag-start', {
        courseId: course.id,
        courseName: course.name || course.course_name || '',
        courseCode: course.code || course.course_code || '',
        source: 'drag-start',
        timestamp: new Date().toISOString(),
      });
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'course', course, id: course.id }));
      event.dataTransfer.effectAllowed = 'copy';
      event.target.style.opacity = '0.5';
    };
    const handleCourseDragEnd = (event) => {
      emit('scheduler-drag-end', {
        courseId: draggedCourse.value?.id || null,
        courseName: draggedCourse.value?.name || draggedCourse.value?.course_name || null,
        courseCode: draggedCourse.value?.code || draggedCourse.value?.course_code || null,
        success: false,
        source: 'drag-end',
        timestamp: new Date().toISOString(),
      });
      draggedCourse.value = null;
      event.target.style.opacity = '1';
    };

    // Drag: assignment
    const handleAssignmentDragStart = (event, a, dayId, periodId) => {
      draggedAssignment.value = { assignment: a, originalDayId: dayId, originalPeriodId: periodId };
      emit('scheduler-drag-start', {
        courseId: a.course_id || '',
        courseName: a.course_name || a.display_cell || '',
        courseCode: a.course_code || '',
        source: 'drag-start',
        timestamp: new Date().toISOString(),
      });
      event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'assignment', assignment: a, originalDayId: dayId, originalPeriodId: periodId }));
      event.dataTransfer.effectAllowed = 'move';
      event.target.style.opacity = '0.5';
    };
    const handleAssignmentDragEnd = (event) => {
      emit('scheduler-drag-end', {
        courseId: draggedAssignment.value?.assignment?.course_id || null,
        courseName:
          draggedAssignment.value?.assignment?.course_name || draggedAssignment.value?.assignment?.display_cell || null,
        courseCode: draggedAssignment.value?.assignment?.course_code || null,
        success: false,
        source: 'drag-end',
        timestamp: new Date().toISOString(),
      });
      draggedAssignment.value = null;
      event.target.style.opacity = '1';
    };

    // Drop targets
    const handleCellDragOver = (event) => {
      if (!draggedAssignment.value && !draggedCourse.value) return false;
      event.dataTransfer.dropEffect = draggedAssignment.value ? 'move' : 'copy';
      return false;
    };
    const handleCellDragEnter = (event) => {
      if (!draggedAssignment.value && !draggedCourse.value) return;
      event.currentTarget.classList.add('drag-over');
    };
    const handleCellDragLeave = (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.classList.remove('drag-over');
      }
    };
    const handleCellDrop = (event, dayId, periodId) => {
      event.preventDefault();
      event.currentTarget.classList.remove('drag-over');
      try {
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        if (data.type === 'course') {
          assignCourseToSlot(data.course || { id: data.id }, dayId, periodId);
        } else if (data.type === 'assignment') {
          const a = data.assignment;
          if (!isSameId(data.originalDayId, dayId) || !isSameId(data.originalPeriodId, periodId)) {
            emit('scheduler-drop', {
              dayId, periodId,
              courseId: a.course_id || '',
              courseName: a.course_name || a.display_cell || '',
              courseCode: a.course_code || '',
              teacherIds: a.teacher_ids || [],
              primaryTeacherId: a.primary_teacher_id || null,
              roomId: a.room_id || null,
              source: 'assignment-move',
              timestamp: new Date().toISOString(),
              fromDayId: data.originalDayId,
              fromPeriodId: data.originalPeriodId,
              action: 'move',
            });
            emit('update-assignments', {
              action: 'move', assignment: a,
              fromDayId: data.originalDayId, fromPeriodId: data.originalPeriodId,
              toDayId: dayId, toPeriodId: periodId,
            });
          }
        }
      } catch (e) { console.error('Drop error:', e); }
    };

    // Proposed teachers helper
    const getProposedTeacherIds = (course) => {
      const ids = [];
      if (Array.isArray(course?.possible_staff_ids)) ids.push(...course.possible_staff_ids);
      if (course?.possible_staff_ids && typeof course.possible_staff_ids === 'object' && !Array.isArray(course.possible_staff_ids)) {
        Object.keys(course.possible_staff_ids).forEach((k) => ids.push(course.possible_staff_ids[k]));
      }
      return ids.map((x) => String(x)).filter((x) => !!x && x !== 'null' && x !== 'undefined');
    };

    // Course assign modal (with allowed-slot confirmation + preselects)
    const assignCourseToSlot = (course, dayId, periodId) => {
      if (!course || props.isReadOnly || props.isLiveMode) return;

      if (!isCourseAllowedForSlot(course, dayId, periodId)) {
        const allowedText = buildAllowedSlotsLabel(course);
        const name = course.name || course.course_name || course.title || 'This course';
        const dayName = props.schoolDays.find((d) => isSameId(d.id, dayId))?.name || `day ${dayId}`;
        const perName = props.periods.find((p) => isSameId(p.id, periodId))?.name || 'this period';
        const ok = window.confirm(
          `${name} is configured to be available for: ${allowedText}.\n\nYou are scheduling it on ${dayName} – ${perName}.\n\nAre you sure you want to continue?`
        );
        if (!ok) return;
      }

      modalCourseData.value = {
        courseId: course.id,
        courseName: course.name || course.course_name || course.title || '',
        courseCode: course.code || course.course_code || '',
        dayId, periodId,
        preselectedTeacherIds: getProposedTeacherIds(course),
      };
      showTeacherRoomModal.value = true;
    };

    // Teacher/Room modal submit (frequency-aware)
    const handleTeacherRoomSubmit = (payload) => {
      const key = `${normId(payload.dayId)}|${normId(payload.periodId)}|${normId(payload.courseId)}`;
      if ((payload.frequency || 'one-off') === 'recurring') {
        recurringWhitelist.value.add(key);
        optimisticallyScheduled.value.delete(key);
      } else {
        recurringWhitelist.value.delete(key);
        if (props.hideScheduledInAvailable) optimisticallyScheduled.value.add(key);
      }

      emit('scheduler-drop', {
        dayId: payload.dayId,
        periodId: payload.periodId,
        courseId: payload.courseId,
        courseName: payload.courseName,
        courseCode: modalCourseData.value?.courseCode || '',
        teacherIds: payload.teacherIds,
        primaryTeacherId: payload.primaryTeacherId,
        roomId: payload.roomId,
        frequency: payload.frequency || 'one-off',
        source: 'modal-assignment',
        timestamp: payload.timestamp,
      });

      emit('scheduler-drag-end', {
        courseId: payload.courseId,
        courseName: payload.courseName,
        courseCode: modalCourseData.value?.courseCode || '',
        success: true,
        source: 'drag-end',
        timestamp: new Date().toISOString(),
      });

      showTeacherRoomModal.value = false;
      modalCourseData.value = null;
    };
    const handleTeacherRoomCancel = () => {
      showTeacherRoomModal.value = false;
      modalCourseData.value = null;
    };

    // Focus
    const togglePeriodFocus = (periodId) => {
      const pid = normId(periodId);
      focusedPeriodId.value = isSameId(focusedPeriodId.value, pid) ? null : pid;
      emit('period-focus-changed', focusedPeriodId.value);
    };
    const isFocused = (id) => isSameId(focusedPeriodId.value, id);
    const getFocusedPeriodName = () =>
      props.periods.find((p) => isSameId(p.id, focusedPeriodId.value))?.name || 'Unknown Period';

    // Available courses list
    const getAvailableCoursesForSlot = (dayId, periodId) => {
      const dayKey = normId(dayId);
      const periodKey = normId(periodId);
      const scheduledIds = new Set(
        safeArray(currentSchedules.value)
          .filter((e) => isSameId(e.day_id, dayId) && isSameId(e.period_id, periodId))
          .map((e) => normId(e.course_id))
      );

      return safeArray(props.courses).filter((course) => {
        const cid = normId(course.id);
        const k = `${dayKey}|${periodKey}|${cid}`;

        if (!recurringWhitelist.value.has(k) && props.hideScheduledInAvailable) {
          if (scheduledIds.has(cid) || optimisticallyScheduled.value.has(k)) return false;
        }

        const slots = normalizeSlots(course);
        if (slots.length === 0) return true;
        return slots.some((s) => isSameId(s.dayId, dayId) && isSameId(s.periodId, periodId));
      });
    };
    const getNoPreferredDaysCourses = () => safeArray(props.courses).filter((course) => normalizeSlots(course).length === 0);
    const getCourseCardStyle = (course) => ({ borderLeft: `4px solid ${course.color || '#007cba'}`, backgroundColor: course.color ? `${course.color}15` : '#f0f8ff' });
    const isDraggingCourse = (courseId) => normId(draggedCourse.value?.id) === normId(courseId);

    // Grade stats
    const parseGrades = (course) => {
      const grades = [];
      if (course.is_for_year_g && typeof course.is_for_year_g === 'object') {
        for (const [, g] of Object.entries(course.is_for_year_g)) if (g && g > 0) grades.push(Number(g));
      } else if (Array.isArray(course.is_for_year_groups)) {
        grades.push(...course.is_for_year_groups.map((g) => Number(g)).filter((g) => g > 0));
      } else if (Array.isArray(course.year_groups)) {
        grades.push(...course.year_groups.map((g) => Number(g)).filter((g) => g > 0));
      }
      return [...new Set(grades)].sort((a, b) => a - b);
    };
    const allGrades = computed(() => {
      const set = new Set(); safeArray(props.courses).forEach((c) => parseGrades(c).forEach((g) => set.add(g)));
      return Array.from(set).sort((a, b) => a - b);
    });
    const findCourseById = (courseId) => safeArray(props.courses).find((c) => isSameId(c.id, courseId));
    const getScheduledCoursesForSlot = (dayId, periodId) => {
      const scheduledEntries = safeArray(currentSchedules.value).filter((e) => isSameId(e.day_id, dayId) && isSameId(e.period_id, periodId));
      const out = [];
      scheduledEntries.forEach((entry) => {
        const course = findCourseById(entry.course_id);
        if (course) {
          const totalSpots = course.max_students || course.capacity || 0;
          const freeSpots = entry.free_spaces !== undefined ? entry.free_spaces : totalSpots;
          out.push({ ...course, scheduledEntry: entry, freeSpots, totalSpots });
        }
      });
      return out;
    };
    const getDailyGradeStats = (dayId, periodId) => {
      if (!periodId) return [];
      const scheduledCourses = getScheduledCoursesForSlot(dayId, periodId);
      const out = [];
      allGrades.value.forEach((grade) => {
        let totalSpots = 0, coursesCount = 0, totalGradeAllocation = 0;
        scheduledCourses.forEach((course) => {
          const grades = parseGrades(course);
          if (grades.includes(grade)) {
            coursesCount++;
            const free = course.freeSpots || 0;
            if (grades.length === 1) { totalSpots += free; totalGradeAllocation += free; }
            else { totalSpots += free; totalGradeAllocation += free / grades.length; }
          }
        });
        if (coursesCount > 0 || totalSpots > 0) out.push({ grade, totalSpots, averageSpots: totalGradeAllocation, coursesCount });
      });
      return out;
    };

    const handleCourseEdit = (d) => emit('course-edit', d);

    // Measure header columns and apply to available panel
    const measureAndApplyAvailableColumns = () => {
      const header = gridHeaderRef.value;
      const avail = availableGridRef.value;
      if (!header || !avail) return;

      // First track: period header cell width
      const periodEl = header.querySelector('.period-header-cell');
      const dayEls = header.querySelectorAll('.day-header-cell');
      if (!periodEl || !dayEls?.length) return;

      const labelW = Math.round(periodEl.getBoundingClientRect().width);
      const dayWidths = Array.from(dayEls).map((el) => Math.round(el.getBoundingClientRect().width));

      // Build explicit grid-template-columns string
      availableGridTemplate.value = `${labelW}px ${dayWidths.map((w) => `${w}px`).join(' ')}`;
    };

    // Close popups listeners (use passive where allowed) and also re-measure on resize/changes
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        contextMenu.value.show = false;
        if (editingAssignment.value) editingAssignment.value = null;
      }
    };
    const onWindowResize = () => {
      contextMenu.value.show = false;
      measureAndApplyAvailableColumns();
    };
    const onAnyScroll = () => {
      contextMenu.value.show = false;
    };

    onMounted(async () => {
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('resize', onWindowResize, { passive: true });
      window.addEventListener('scroll', onAnyScroll, { passive: true, capture: true });

      await nextTick();
      measureAndApplyAvailableColumns();
    });
    watch(() => visibleDays.value.length, async () => {
      await nextTick();
      measureAndApplyAvailableColumns();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('scroll', onAnyScroll, true);
    });

    return {
      // DOM
      gridHeaderRef,
      availableGridRef,
      availableGridTemplate,

      // state
      focusedPeriodId,
      draggedCourse,
      draggedAssignment,
      optimisticallyScheduled,
      recurringWhitelist,
      editingAssignment,
      editingCell,
      contextMenu,
      contextMenuRef,
      showTeacherRoomModal,
      modalCourseData,

      // computed
      visibleDays,
      visiblePeriods,
      currentSchedules,
      hasData,
      editorModalTitle,

      // helpers + formatters
      safeArray,
      safeLength,
      formatTime,
      formatDate,
      formatInt,

      // cell helpers
      getCellAssignments,
      getCellClasses,
      getCellAriaLabel,
      getAssignmentClasses,
      getAssignmentStyles,
      getCourseName,
      getSubjectName,
      getDisplayName,
      getClassName,
      getTeacherNames,
      getAssignmentTeachers,
      getRoomName,
      hasConflicts,
      hasDeletedEntities,

      // interactions
      openContextMenu,
      closeContextMenu,
      editAssignmentFromContext,
      deleteAssignmentFromContext,
      handleCellClick,
      handleAssignmentClick,

      // inline editor (popup)
      isEditing,
      startInlineEdit,
      startInlineEditReadOnly,
      saveInlineEdit,
      cancelInlineEdit,
      deleteInlineAssignment,
      onEditorSave,
      onEditorDelete,
      handleCourseEdit,

      // drag/drop
      handleCourseDragStart,
      handleCourseDragEnd,
      handleAssignmentDragStart,
      handleAssignmentDragEnd,
      handleCellDragOver,
      handleCellDragEnter,
      handleCellDragLeave,
      handleCellDrop,

      // modal
      assignCourseToSlot,
      handleTeacherRoomSubmit,
      handleTeacherRoomCancel,

      // focus + stats
      togglePeriodFocus,
      isFocused,
      getFocusedPeriodName,
      getDailyGradeStats,
      allGrades,

      // available courses
      getAvailableCoursesForSlot,
      getNoPreferredDaysCourses,
      getCourseCardStyle,
      isDraggingCourse,
    };
  },
};
</script>

<style scoped>
/* Root */
.scheduler-grid { display: flex; flex-direction: column; width: 100%; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; background: #fff; }

/* Header row */
.grid-header { display: flex !important; align-items: stretch; background: #f5f5f5; border-bottom: 1px solid #ddd; font-weight: 600; }
.period-header-cell { width: 140px; min-width: 140px; max-width: 140px; padding: 10px 8px; border-right: 1px solid #ddd; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
.day-header-cell { flex: 1 1 0; min-width: 160px; padding: 10px 8px; border-right: 1px solid #ddd; text-align: center; display: flex; flex-direction: column; gap: 2px; box-sizing: border-box; }
.day-header-cell:last-child { border-right: 0; }
.day-name { font-size: 0.95em; }
.day-date { font-size: 0.8em; color: #666; }

/* Body */
.grid-body { display: block; }
.grid-row { display: flex !important; align-items: stretch; border-bottom: 1px solid #ddd; min-height: 72px; }
.grid-row:last-child { border-bottom: 0; }
.grid-row.non-instructional { background: #f8f9fa; }

.period-label-cell { width: 140px; min-width: 140px; max-width: 140px; padding: 8px; border-right: 1px solid #ddd; background: #f9f9f9;
  display: flex; align-items: center; cursor: pointer; transition: background-color 0.2s; box-sizing: border-box; }
.period-label-cell:hover { background: #f0f7ff !important; }
.period-label-cell.focused { background: #e6f7ff !important; border-left: 4px solid #007cba; }
.period-info { display: flex; flex-direction: column; gap: 2px; }
.period-name { font-weight: 600; font-size: 0.9em; }
.period-time { font-size: 0.78em; color: #666; }
.non-instructional-badge { font-size: 0.72em; color: #888; background: #e9ecef; padding: 1px 4px; border-radius: 3px; align-self: flex-start; }

.schedule-cell { flex: 1 1 0; min-width: 160px; border-right: 1px solid #ddd; position: relative; cursor: pointer; transition: background-color 0.2s; min-height: 72px; box-sizing: border-box; }
.schedule-cell:last-child { border-right: 0; }
.schedule-cell:hover { background: #f0f7ff; }
.schedule-cell.has-assignments { background: #eaf7ff; }
.schedule-cell.multiple-assignments { background: #def3ff; }
.schedule-cell.has-conflicts { background: #fff2f0; border-left: 3px solid #ff4d4f; }

/* Assignments */
.assignments-container { padding: 4px; height: 100%; display: flex; flex-direction: column; gap: 4px; position: relative; box-sizing: border-box; }
.assignment-item { padding: 4px 6px; border-radius: 4px; border: 1px solid #e0e0e0; position: relative; transition: all 0.2s; background: #fff; }
.assignment-item:hover { transform: translateX(1px); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.assignment-item.has-conflict { border-color: #ff4d4f; background: #fff2f0; }
.assignment-item.has-deleted-entities { border-color: #faad14; background: #fff7e6; }
.assignment-item.lesson-schedule { opacity: 0.75; border-style: dashed; background: #f5f5f5 !important; font-style: italic; font-size: 0.8em; }
.assignment-content { display: flex; flex-direction: column; gap: 2px; }
.course-name { font-weight: 600; font-size: 0.9em; line-height: 1.2; }
.meta-line { font-size: 0.78em; color: #666; line-height: 1.2; display: inline-flex; gap: 4px; align-items: baseline; }
.conflict-indicator, .deleted-warning { position: absolute; top: 4px; right: 4px; font-size: 0.8em; line-height: 1; }

/* Empty cell */
.empty-cell { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 0.85em; gap: 4px; }

/* Drag targets */
.drop-zone { position: relative; transition: all 0.2s ease; }
.drop-zone.drag-over { background: rgba(0,123,186,0.08) !important; border: 2px dashed #007cba !important; transform: scale(1.01); }
.drop-zone.drag-over::after { content: '📋 Drop here'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(0,123,186,0.9); color: white; padding: 3px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; pointer-events: none; z-index: 10; }

/* Grade Statistics */
.statistics-row { display: flex !important; border-bottom: 2px solid #007cba; background: #f0f8ff; border-top: 2px solid #007cba; }
.stats-label-cell { width: 140px; min-width: 140px; max-width: 140px; background: #007cba !important; color: white; display: flex; align-items: center; justify-content: center;
  border-right: 1px solid #ddd; box-sizing: border-box; }
.stats-title { display: flex; align-items: center; gap: 6px; font-size: 0.95em; font-weight: 600; }
.stats-emoji { font-size: 1.15em; }

.day-statistics-cell { --grade-col: 28px; flex: 1 1 0; min-width: 160px; border-right: 1px solid #ddd; padding: 6px; background: white; display: flex; flex-direction: column; gap: 6px; min-height: 96px; box-sizing: border-box; }
.day-statistics-cell:last-child { border-right: 0; }
.stats-headers { display: grid; grid-template-columns: var(--grade-col) 1fr 1fr 1fr; align-items: center; gap: 4px; margin-bottom: 4px; padding: 3px 4px; background: rgba(0,124,186,0.1); border-radius: 4px; }
.header-spacer { width: 100%; height: 1px; opacity: 0; }
.stat-header { display: flex; align-items: center; justify-content: center; font-size: 0.95em; line-height: 1; padding: 2px 4px; border-radius: 3px; }
.stat-header:hover { background: rgba(0,124,186,0.2); }
.stats-rows { display: flex; flex-direction: column; gap: 3px; flex-grow: 1; }
.grade-stats-row { display: grid; grid-template-columns: var(--grade-col) 1fr 1fr 1fr; align-items: center; gap: 6px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 3px 4px; font-size: 0.88em; }
.grade-number { font-weight: 700; color: #333; min-width: var(--grade-col); font-size: 0.95em; }
.stat-value { text-align: center; padding: 2px 4px; background: white; border-radius: 3px; font-size: 0.88em; color: #333; }

/* Available Courses Panel */
.available-courses-panel { padding: 12px; background: #f0f8ff; border-top: 1px solid #007cba; border-bottom: 1px solid #ddd; }
.available-courses-panel h3 { margin: 0 0 6px 0; color: #007cba; font-size: 1.05em; }
.focused-period-info { margin: 0 0 10px 0; color: #666; font-size: 0.9em; }

/* Aligned grid for available courses (no gap; borders continue grid lines) */
.day-courses-grid { display: grid; column-gap: 0; row-gap: 12px; }
.grid-label-spacer { height: 100%; }

/* Match vertical grid lines by borders on day columns */
.day-courses-column { min-width: 0; border-left: 1px solid #ddd; }
.day-courses-column:first-of-type { /* ensure line between period col and first day */
  border-left: 1px solid #ddd;
}
.available-courses-list { display: flex; flex-direction: column; gap: 8px; padding: 6px 8px; max-height: 320px; overflow-y: auto; }
.course-card { padding: 8px 10px; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: grab; transition: all 0.2s; font-size: 0.9em; }
.course-card:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,124,186,0.15); border-color: #007cba; }
.course-card:active { cursor: grabbing; }
.course-card.is-dragging { opacity: 0.6; }
.course-card .course-name { font-weight: 600; color: #333; margin-bottom: 2px; display: block; }
.course-card .course-details { display: flex; flex-direction: column; gap: 2px; }
.course-card .course-details small { color: #666; font-size: 0.8em; }
.no-courses { padding: 12px; text-align: center; color: #999; font-style: italic; background: #f9f9f9; border: 1px dashed #ddd; border-radius: 4px; }

/* No Preferred Days Panel */
.no-preferred-days-panel { padding: 12px; background: #f0f8e6; border: 1px solid #52c41a; border-radius: 4px; margin-top: 12px; }
.no-preferred-days-panel h4 { margin: 0 0 8px 0; color: #52c41a; font-size: 1em; display: flex; align-items: center; gap: 8px; }
.panel-description { margin: 0 0 10px 0; color: #666; font-size: 0.9em; font-style: italic; }
.no-preferred-courses-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.flexible-tag { color: #52c41a !important; font-weight: 600; }

/* Read-only/live */
.scheduler-grid[data-readonly='true'] .schedule-cell { cursor: default; }
.scheduler-grid[data-readonly='true'] .schedule-cell:hover { background: inherit; }
.scheduler-grid[data-readonly='true'] .draggable-assignment,
.scheduler-grid[data-readonly='true'] .draggable-course { cursor: default; pointer-events: none; }
.scheduler-grid[data-readonly='true'] .empty-cell { color: #999; }
.scheduler-grid[data-readonly='true'] .empty-text { font-style: italic; color: #999; font-size: 0.8em; }

/* Warning banner */
.grid-hidden-debug { padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; margin: 8px 8px 0; color: #92400e; }

/* Assignment editor popup */
.assignment-editor-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483600; }
.assignment-editor-modal {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(920px, 92vw); max-height: 86vh; overflow: auto;
  background: #fff; border-radius: 8px; box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  z-index: 2147483601; display: flex; flex-direction: column;
}
.editor-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #e5e5e5; }
.editor-modal-title { font-weight: 600; color: #333; }
.editor-modal-close { appearance: none; border: 0; background: transparent; font-size: 22px; line-height: 1; cursor: pointer; color: #666; }
.editor-modal-close:hover { color: #222; }
.editor-modal-body { padding: 12px 14px; }

/* Responsive */
@media (max-width: 1024px) { .day-header-cell, .schedule-cell, .day-statistics-cell { min-width: 200px; } }
@media (max-width: 768px) {
  .period-header-cell, .period-label-cell, .stats-label-cell { width: 120px; min-width: 120px; max-width: 120px; }
  .day-header-cell, .schedule-cell, .day-statistics-cell, .day-courses-column { min-width: 180px; }
}
</style>

<!-- Context menu styles -->
<style>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  z-index: 2147483647;
  min-width: 180px;
  padding: 4px 0;
  pointer-events: auto;
}
.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.15s;
  white-space: nowrap;
}
.context-menu-item:hover { background-color: #f5f5f5; }
.context-menu-item.delete:hover { background-color: #ffe6e6; color: #d32f2f; }
.context-menu-backdrop { position: fixed; inset: 0; z-index: 2147483646; }
</style>
