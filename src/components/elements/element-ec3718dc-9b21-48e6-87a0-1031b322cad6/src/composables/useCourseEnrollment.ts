<template>
  <div class="course-distribution">
    <!-- Header -->
    <div class="course-distribution__header">
      <div class="course-distribution__header-left">
        <h1 class="course-distribution__title">Course Enrollment</h1>
        <h2 class="course-distribution__subtitle">
          {{ currentSemester || '—' }} – {{ selectedDayName }}
        </h2>
      </div>
      <div class="course-distribution__header-right">
        <div class="course-distribution__search">
          <input
            type="text"
            placeholder="Search students..."
            v-model="searchQuery"
            @input="onSearchChange($event.target.value)"
            class="course-distribution__search-input"
          />
        </div>
        <div class="course-distribution__day-selector">
          <select
            :value="selectedDayNumber"
            @change="onDayChange($event.target.value)"
            class="course-distribution__day-select"
          >
            <option
              v-for="day in daysOfWeek"
              :key="day.day_id"
              :value="day.day_number"
            >
              {{ day.name_en }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="course-distribution__loading">Loading...</div>

    <div v-else-if="filteredCourses.length === 0 && totalEnrolledForDay === 0" class="course-distribution__empty">
      <p>No courses or students available for the selected criteria.</p>
    </div>

    <div v-else class="course-distribution__content">
      <!-- Problems Section -->
      <ProblemsSection
        :course-notes="courseNotes"
        :courses="allCourses"
        @resolve-note="onResolveNote"
      />

      <!-- Waiting List -->
      <div v-if="waitingListStudents.length > 0" class="cd-card">
        <div class="cd-card__top">
          <h4 class="cd-card__title">
            <span>Waiting List</span>
            <span class="cd-capacity cd-capacity--neutral">{{ waitingListStudents.length }}</span>
          </h4>
        </div>
        <div class="cd-card__underline"></div>

        <div class="cd-participants">
          <!-- Header row aligned with columns -->
          <div class="cd-participants__bar">
            <div class="cd-grid cd-grid--header">
              <div class="cd-col cd-col--participants">Participants</div>
              <div class="cd-col">1. wish</div>
              <div class="cd-col">2. wish</div>
              <div class="cd-col">3. wish</div>
              <div class="cd-col cd-col--center">Wait</div>
            </div>
          </div>

          <!-- Rows -->
          <div class="cd-rows">
            <div v-for="student in waitingListStudents" :key="student.id + '-' + selectedDayNumber" class="cd-row">
              <div class="cd-grid">
                <div class="cd-col cd-col--participants cd-col--person">
                  <div>
                    <span class="cd-name">{{ student.name }}</span>
                    <div class="cd-schedule-info">
                      <span class="cd-schedule-chip">Tue (1): football</span>
                      <span class="cd-schedule-chip">Wed (2): volleyball</span>
                    </div>
                  </div>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.first_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 1) ? 'cd-pref-btn--first cd-pref-btn--current' : 'cd-pref-btn--first',
                      isLockedTarget(student.first_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 1) || isLockedTarget(student.first_choice)"
                    @click="!isCurrentChoice(student, 1) && !isLockedTarget(student.first_choice) && onStudentMove(student.id, student.first_choice)"
                    :title="isLockedTarget(student.first_choice) ? 'Course locked' : formatPreferenceDisplay(student.first_choice)"
                  >
                    {{ formatPreferenceDisplay(student.first_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.second_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 2) ? 'cd-pref-btn--second cd-pref-btn--current' : 'cd-pref-btn--second',
                      isLockedTarget(student.second_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 2) || isLockedTarget(student.second_choice)"
                    @click="!isCurrentChoice(student, 2) && !isLockedTarget(student.second_choice) && onStudentMove(student.id, student.second_choice)"
                    :title="isLockedTarget(student.second_choice) ? 'Course locked' : formatPreferenceDisplay(student.second_choice)"
                  >
                    {{ formatPreferenceDisplay(student.second_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.third_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 3) ? 'cd-pref-btn--third cd-pref-btn--current' : 'cd-pref-btn--third',
                      isLockedTarget(student.third_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 3) || isLockedTarget(student.third_choice)"
                    @click="!isCurrentChoice(student, 3) && !isLockedTarget(student.third_choice) && onStudentMove(student.id, student.third_choice)"
                    :title="isLockedTarget(student.third_choice) ? 'Course locked' : formatPreferenceDisplay(student.third_choice)"
                  >
                    {{ formatPreferenceDisplay(student.third_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    class="cd-wait-btn"
                    title="Move to waiting list"
                    @click="onStudentMove(student.id, 'waiting')"
                    disabled
                  >
                    W
                  </button>
                </div>
              </div>
            </div>

            <p v-if="waitingListStudents.length === 0" class="cd-empty-text">No students waiting</p>
          </div>
        </div>
      </div>

      <!-- Going Home -->
      <div class="cd-card">
        <div class="cd-card__top">
          <h4 class="cd-card__title">
            <span>Going Home</span>
            <span class="cd-capacity cd-capacity--neutral">{{ goingHomeStudents.length }}</span>
          </h4>
        </div>
        <div class="cd-card__underline"></div>

        <div class="cd-participants">
          <!-- Header row aligned with columns -->
          <div class="cd-participants__bar">
            <div class="cd-grid cd-grid--header">
              <div class="cd-col cd-col--participants">Participants</div>
              <div class="cd-col">1. wish</div>
              <div class="cd-col">2. wish</div>
              <div class="cd-col">3. wish</div>
              <div class="cd-col cd-col--center">Wait</div>
            </div>
          </div>

          <!-- Rows -->
          <div class="cd-rows">
            <div v-for="student in goingHomeStudents" :key="student.id + '-' + selectedDayNumber" class="cd-row">
              <div class="cd-grid">
                <div class="cd-col cd-col--participants cd-col--person">
                  <div>
                    <span class="cd-name">{{ student.name }}</span>
                    <div class="cd-schedule-info">
                      <span class="cd-schedule-chip">Tue (2): archery</span>
                      <span class="cd-schedule-chip">Wed (3): volleyball</span>
                    </div>
                  </div>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.first_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 1) ? 'cd-pref-btn--first cd-pref-btn--current' : 'cd-pref-btn--first',
                      isLockedTarget(student.first_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 1) || isLockedTarget(student.first_choice)"
                    @click="!isCurrentChoice(student, 1) && !isLockedTarget(student.first_choice) && onStudentMove(student.id, student.first_choice)"
                    :title="isLockedTarget(student.first_choice) ? 'Course locked' : formatPreferenceDisplay(student.first_choice)"
                  >
                    {{ formatPreferenceDisplay(student.first_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.second_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 2) ? 'cd-pref-btn--second cd-pref-btn--current' : 'cd-pref-btn--second',
                      isLockedTarget(student.second_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 2) || isLockedTarget(student.second_choice)"
                    @click="!isCurrentChoice(student, 2) && !isLockedTarget(student.second_choice) && onStudentMove(student.id, student.second_choice)"
                    :title="isLockedTarget(student.second_choice) ? 'Course locked' : formatPreferenceDisplay(student.second_choice)"
                  >
                    {{ formatPreferenceDisplay(student.second_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.third_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 3) ? 'cd-pref-btn--third cd-pref-btn--current' : 'cd-pref-btn--third',
                      isLockedTarget(student.third_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 3) || isLockedTarget(student.third_choice)"
                    @click="!isCurrentChoice(student, 3) && !isLockedTarget(student.third_choice) && onStudentMove(student.id, student.third_choice)"
                    :title="isLockedTarget(student.third_choice) ? 'Course locked' : formatPreferenceDisplay(student.third_choice)"
                  >
                    {{ formatPreferenceDisplay(student.third_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    class="cd-wait-btn"
                    title="Move to waiting list"
                    @click="onStudentMove(student.id, 'waiting')"
                  >
                    W
                  </button>
                </div>
              </div>
            </div>

            <p v-if="goingHomeStudents.length === 0" class="cd-empty-text">No students</p>
          </div>
        </div>
      </div>

      <!-- Course Sections -->
      <div v-for="course in filteredCourses" :key="course.id" class="cd-card" :class="[
        statusSectionClass(course),
        getCourseStatus(course) === 'overfilled' ? 'cd-card--over' : '',
        getCourseStatus(course) === 'near_full' ? 'cd-card--near' : '',
        getCourseStatus(course) === 'locked' ? 'cd-card--locked' : ''
      ]">
        <div class="cd-card__top">
          <h4 class="cd-card__title">
            <button class="cd-card__name" @click="toggleCourseDetails(course.id)" :title="course.name">{{ course.name }}</button>

            <!-- Capacity pill with status colors -->
            <span class="cd-capacity" :class="capacityPillClass(course)">
              {{ displayRosterCount(course) }}/{{ course.max_capacity }}
            </span>

            <!-- Overfilled pulsing badge like original -->
            <span v-if="statusBadgeText(course)" class="cd-status-badge" aria-live="polite">
              {{ statusBadgeText(course) }}
            </span>
          </h4>

          <div class="cd-actions">
            <button
              class="cd-icon-btn"
              :class="{ 'cd-icon-btn--locked': course.is_locked }"
              :title="course.is_locked ? 'Mark as open' : 'Mark as closed'"
              @click="onLockToggle(course.id, !course.is_locked)"
            >
              <span v-if="course.is_locked" class="cd-icon-text">🔒</span>
              <span v-else class="cd-icon-text">🔓</span>
            </button>

            <button class="cd-small-btn" title="Mark as approved" @click="onApproveClick(course.id)">
              <span class="cd-icon-text">✓</span>
            </button>

            <button class="cd-icon-btn cd-icon-btn--note" title="Add note" @click="onNotesClick(course.id)">
              <span class="cd-icon-text">💬</span>
              <span v-if="course.notes_count" class="cd-note-badge">{{ course.notes_count }}</span>
            </button>
          </div>
        </div>

        <!-- Thin underline colored by status -->
        <div class="cd-card__underline"></div>

        <!-- Optional meta line -->
        <div class="cd-meta">
          <span v-if="course.teacher">Teacher: {{ course.teacher }}</span>
          <span v-if="course.room">Room: {{ course.room }}</span>
          <span v-if="course.day">Day: {{ course.day }}</span>
        </div>

        <div class="cd-participants">
          <!-- Header row aligned with columns + chevron -->
          <div class="cd-participants__bar">
            <div class="cd-grid cd-grid--header">
              <div class="cd-col cd-col--participants">Participants</div>
              <div class="cd-col">1. wish</div>
              <div class="cd-col">2. wish</div>
              <div class="cd-col">3. wish</div>
              <div class="cd-col cd-col--center">Wait</div>
            </div>
            <button
              class="cd-icon-btn cd-icon-btn--chev"
              :title="isParticipantsVisible(course.id) ? 'Hide participants' : 'Show participants'"
              @click="toggleParticipants(course.id)"
            >
              <svg v-if="isParticipantsVisible(course.id)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cd-icon cd-icon--blue">
                <path d="m18 15-6-6-6 6"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cd-icon cd-icon--blue">
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>

          <template v-if="isParticipantsVisible(course.id)">
            <div v-for="student in (enrolledByCourseId[course.id] || [])" :key="student.id + '-' + selectedDayNumber"
              class="cd-row">
              <div class="cd-grid">
                <div class="cd-col cd-col--participants cd-col--person">
                  <div>
                    <span class="cd-name">{{ student.name }}</span>
                    <div class="cd-schedule-info">
                      <span class="cd-schedule-chip">Tue (1): football</span>
                      <span class="cd-schedule-chip">Wed (2): football</span>
                    </div>
                  </div>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.first_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 1) ? 'cd-pref-btn--first cd-pref-btn--current' : 'cd-pref-btn--first',
                      isLockedTarget(student.first_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 1) || isLockedTarget(student.first_choice)"
                    @click="!isCurrentChoice(student, 1) && !isLockedTarget(student.first_choice) && onStudentMove(student.id, student.first_choice)"
                  >
                    {{ formatPreferenceDisplay(student.first_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.second_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 2) ? 'cd-pref-btn--second cd-pref-btn--current' : 'cd-pref-btn--second',
                      isLockedTarget(student.second_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 2) || isLockedTarget(student.second_choice)"
                    @click="!isCurrentChoice(student, 2) && !isLockedTarget(student.second_choice) && onStudentMove(student.id, student.second_choice)"
                  >
                    {{ formatPreferenceDisplay(student.second_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    v-if="student.third_choice"
                    class="cd-pref-btn"
                    :class="[
                      isCurrentChoice(student, 3) ? 'cd-pref-btn--third cd-pref-btn--current' : 'cd-pref-btn--third',
                      isLockedTarget(student.third_choice) ? 'cd-pref-btn--locked' : ''
                    ]"
                    :disabled="isCurrentChoice(student, 3) || isLockedTarget(student.third_choice)"
                    @click="!isCurrentChoice(student, 3) && !isLockedTarget(student.third_choice) && onStudentMove(student.id, student.third_choice)"
                  >
                    {{ formatPreferenceDisplay(student.third_choice) }}
                  </button>
                </div>

                <div class="cd-col cd-col--center">
                  <button
                    class="cd-wait-btn"
                    title="Move to waiting list"
                    @click="onStudentMove(student.id, 'waiting')"
                  >
                    W
                  </button>
                </div>
              </div>
            </div>

            <p v-if="(enrolledByCourseId[course.id] || []).length === 0" class="cd-empty-text">No students enrolled</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useCourseEnrollment } from './composables/useCourseEnrollment';
import ProblemsSection from './components/course-enrollment/ProblemsSection.vue';
import { CourseEnrollmentService } from './services/courseEnrollmentService';

export default {
  components: {
    ProblemsSection
  },
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const isEditing = computed(() => {
      /* wwEditor:start */ return props.wwEditorState.isEditing; /* wwEditor:end */
      return false;
    });

    // Use the Supabase-powered composable
    const courseEnrollment = useCourseEnrollment();

    // Override event handlers to maintain WeWeb compatibility
    const onDayChange = async (day) => {
      if (isEditing.value) return;
      const dayNumber = parseInt(day, 10);
      await courseEnrollment.onDayChange(dayNumber);
      emit('trigger-event', { name: 'dayChange', event: { value: dayNumber } });
    };

    const onSearchChange = (query) => {
      if (isEditing.value) return;
      courseEnrollment.onSearchChange(query);
      emit('trigger-event', { name: 'searchChange', event: { value: query } });
    };

    const onStudentMove = async (studentId, targetId) => {
      if (isEditing.value) return;
      await courseEnrollment.onStudentMove(studentId, targetId);
      emit('trigger-event', { name: 'studentMove', event: { studentId, courseId: targetId } });
    };

    const onLockToggle = async (courseId, lockState) => {
      if (isEditing.value) return;
      await courseEnrollment.onLockToggle(courseId, lockState);
      emit('trigger-event', { name: 'courseLockToggle', event: { courseId, lockState } });
    };

    const onApproveClick = (courseId) => {
      if (isEditing.value) return;
      courseEnrollment.onApproveClick(courseId);
      emit('trigger-event', { name: 'courseApprove', event: { courseId } });
    };

    const onNotesClick = (courseId) => {
      if (isEditing.value) return;
      courseEnrollment.onNotesClick(courseId);
      emit('trigger-event', { name: 'courseNotesOpen', event: { courseId } });
    };

    const toggleCourseDetails = (courseId) => {
      if (isEditing.value) return;
      courseEnrollment.toggleCourseDetails(courseId);
    };

    const toggleParticipants = (courseId) => {
      if (isEditing.value) return;
      courseEnrollment.toggleParticipants(courseId);
    };

    // Course Notes functionality for ProblemsSection
    const courseNotes = ref([]);

    const loadCourseNotes = async () => {
      try {
        const notes = await CourseEnrollmentService.getCourseNotesForDay(courseEnrollment.selectedDayNumber.value);
        courseNotes.value = notes;
      } catch (error) {
        console.error('Error loading course notes:', error);
      }
    };

    const onResolveNote = async (noteId) => {
      if (isEditing.value) return;

      try {
        const success = await CourseEnrollmentService.resolveProblemNote(noteId);
        if (success) {
          // Reload course notes to update the display
          await loadCourseNotes();
          emit('trigger-event', { name: 'problemResolved', event: { noteId } });
        }
      } catch (error) {
        console.error('Error resolving note:', error);
      }
    };

    // Load course notes when component mounts and when day changes
    onMounted(() => {
      loadCourseNotes();
    });

    // Watch for day changes and reload notes
    const originalOnDayChange = onDayChange;
    const onDayChangeWithNotes = async (day) => {
      await originalOnDayChange(day);
      await loadCourseNotes();
    };

    return {
      // Use all composable properties and methods
      ...courseEnrollment,
      // Override with WeWeb-compatible event handlers
      onDayChange: onDayChangeWithNotes,
      onSearchChange,
      onStudentMove,
      onLockToggle,
      onApproveClick,
      onNotesClick,
      toggleCourseDetails,
      toggleParticipants,
      // Course notes functionality
      courseNotes,
      onResolveNote,
      // Add content prop for potential fallback
      content: props.content,
    };
  },
};
</script>

<style lang="scss" scoped>
/* Container */
.course-distribution {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #ffffff;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
  }

  &__header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__header-right {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #111827;
  }

  &__subtitle {
    font-size: 14px;
    font-weight: 400;
    margin: 0;
    color: #6b7280;
  }

  &__search-input,
  &__day-select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    background-color: #ffffff;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  &__loading {
    padding: 32px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    background-color: #f8fafc;
    min-height: 100vh;
  }

  &__empty {
    padding: 32px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    background-color: #ffffff;
    border: 1px dashed #d1d5db;
    border-radius: 12px;
  }
}

/* Modern Card Design */
.cd-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);

  &.course-distribution__section--near-full {
    border-color: #f59e0b;
    box-shadow: 0 1px 3px 0 rgba(245, 158, 11, 0.1), 0 1px 2px 0 rgba(245, 158, 11, 0.06);
  }

  &.course-distribution__section--overfilled {
    border-color: #ef4444;
    box-shadow: 0 1px 3px 0 rgba(239, 68, 68, 0.1), 0 1px 2px 0 rgba(239, 68, 68, 0.06);
  }

  &.course-distribution__section--locked {
    border-color: #9ca3af;
    background-color: #f9fafb;
  }

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f8fafc;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-weight: 600;
    color: #111827;
    font-size: 16px;
  }

  &__name {
    background: none;
    border: none;
    color: #111827;
    cursor: pointer;
    padding: 0;
    font-weight: 600;
    font-size: 16px;

    &:hover {
      color: #3b82f6;
    }
  }

  &__underline {
    display: none; // Remove underline for cleaner look
  }
}

/* Meta information */
.cd-meta {
  display: flex;
  gap: 16px;
  color: #6b7280;
  font-size: 12px;
  padding: 0 20px 8px;
  background-color: #f8fafc;
}

/* Modern Capacity Badge */
.cd-capacity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.cd-capacity--neutral {
  background-color: #f1f5f9;
  color: #475569;
  border-color: #e2e8f0;
}

.cd-capacity--normal {
  background-color: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.cd-capacity--near {
  background-color: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.cd-capacity--over {
  background-color: #fee2e2;
  color: #7f1d1d;
  border-color: #fecaca;
}

.cd-capacity--locked {
  background-color: #f1f5f9;
  color: #64748b;
  border-color: #e2e8f0;
}

/* Status badge */
@keyframes cdPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.cd-status-badge {
  margin-left: 8px;
  background: #ef4444;
  color: #fff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  animation: cdPulse 2s ease-in-out infinite;
  white-space: nowrap;
}

/* Action buttons */
.cd-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cd-icon-btn {
  height: 32px;
  width: 32px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
}

.cd-small-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
    border-color: #d1d5db;
  }
}

.cd-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  display: block;
  flex-shrink: 0;
}

.cd-icon--blue {
  color: #3b82f6;
}

/* Icon text styling */
.cd-icon-text {
  font-size: 14px;
  line-height: 1;
  display: block;
}

/* Locked button styling */
.cd-icon-btn--locked {
  background-color: #fef3c7 !important;
  border-color: #f59e0b !important;
  color: #92400e !important;

  &:hover {
    background-color: #fde68a !important;
    border-color: #f59e0b !important;
  }
}

/* Locked course styling */
.cd-card.course-distribution__section--locked {
  background-color: #f9fafb;

  .cd-capacity {
    background-color: #f1f5f9;
    color: #64748b;
    border-color: #e2e8f0;
  }
}

.cd-icon-btn--note {
  position: relative;
}

.cd-note-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ef4444;
  color: #ffffff;
  border-radius: 10px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

/* Table-style participants layout */
.cd-participants {
  margin: 0;
  background-color: #ffffff;
}

.cd-participants__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

/* Modern grid layout */
.cd-grid {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1.5fr 1.5fr 80px;
  gap: 12px;
  align-items: center;
  padding: 0 20px;
}

.cd-grid--header {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.cd-col--person {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cd-col--center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Student rows */
.cd-rows {
  display: flex;
  flex-direction: column;
}

.cd-row {
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 0;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f8fafc;
  }

  &:last-child {
    border-bottom: none;
  }
}

/* Student info styling */
.cd-chip {
  background-color: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}

.cd-name {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

/* Add schedule info styling */
.cd-schedule-info {
  display: flex;
  gap: 6px;
  margin-top: 4px;

  .cd-schedule-chip {
    background-color: #f1f5f9;
    color: #64748b;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: #e2e8f0;
    }
  }
}

/* Modern preference buttons */
.cd-pref-btn {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
}

.cd-pref-btn--first {
  background-color: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;

  &:hover:not(:disabled) {
    background-color: #bbf7d0;
  }
}

.cd-pref-btn--second {
  background-color: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;

  &:hover:not(:disabled) {
    background-color: #bfdbfe;
  }
}

.cd-pref-btn--third {
  background-color: #fed7aa;
  border-color: #fdba74;
  color: #ea580c;

  &:hover:not(:disabled) {
    background-color: #fdba74;
  }
}

.cd-pref-btn--current {
  background-color: #f0f9ff;
  border-color: #0ea5e9;
  color: #0c4a6e;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.cd-pref-btn--locked {
  border-color: #d1d5db !important;
  color: #9ca3af !important;
  background-color: #f9fafb !important;
  cursor: not-allowed;
}

.cd-pref-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modern wait button */
.cd-wait-btn {
  height: 32px;
  width: 32px;
  font-size: 12px;
  font-weight: 600;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #e2e8f0;
    border-color: #cbd5e1;
    color: #475569;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Empty state */
.cd-empty-text {
  color: #9ca3af;
  font-size: 13px;
  padding: 20px;
  text-align: center;
  font-style: italic;
}

/* Chevron button for expand/collapse */
.cd-icon-btn--chev {
  border: none;
  background: transparent;

  &:hover {
    background-color: #f3f4f6;
    border: none;
  }
}
</style>
