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
      <div v-if="unresolvedProblems.length > 0" class="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
        <h3 class="text-red-800 font-medium mb-2 flex items-center gap-2">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Problems Requiring Resolution ({{ unresolvedProblems.length }})
        </h3>
        <div class="space-y-2">
          <div 
            v-for="note in unresolvedProblems" 
            :key="note.id" 
            class="flex items-start justify-between bg-white p-2 rounded border border-red-200"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-red-700">{{ getCourseName(note.course_id) }}</span>
                <span class="text-xs text-red-600">{{ note.author }}</span>
                <span class="text-xs text-red-500">{{ formatDate(note.created_at) }}</span>
              </div>
              <p class="text-red-800 text-sm">{{ note.text }}</p>
            </div>
            <button
              @click="onResolveNote(note.id)"
              class="ml-3 h-6 px-3 py-1 bg-green-100 text-green-700 text-xs hover:bg-green-200 border-0 rounded transition-colors"
            >
              Resolve
            </button>
          </div>
        </div>
      </div>

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

export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    const isEditing = computed(() => {
      return false;
    });

    // State
    const loading = ref(true);
    const searchQuery = ref('');
    const selectedDayNumber = ref(1);
    const allStudents = ref([]);
    const allCourses = ref([]);
    const daysOfWeek = ref([]);
    const currentSemester = ref('');
    const courseNotes = ref([]);
    const visibleParticipants = ref(new Set());
    const collapsedCourseDetails = ref(new Set());

    // Mock data for WeWeb compatibility
    const initializeMockData = () => {
      daysOfWeek.value = [
        { day_id: 1, day_number: 1, name_en: 'Monday' },
        { day_id: 2, day_number: 2, name_en: 'Tuesday' },
        { day_id: 3, day_number: 3, name_en: 'Wednesday' },
        { day_id: 4, day_number: 4, name_en: 'Thursday' },
        { day_id: 5, day_number: 5, name_en: 'Friday' }
      ];

      allCourses.value = [
        {
          id: 'course-1',
          name: 'Computer',
          teacher: 'Steffi J',
          room: 'Computer',
          day: 'Monday',
          max_capacity: 12,
          is_locked: false,
          notes_count: 0
        },
        {
          id: 'course-2', 
          name: 'Lego-Bau',
          teacher: 'Anna K',
          room: 'Werkraum',
          day: 'Monday',
          max_capacity: 10,
          is_locked: false,
          notes_count: 0
        },
        {
          id: 'course-3',
          name: 'Lese-Club',
          teacher: 'Maria L',
          room: 'Bibliothek',
          day: 'Monday', 
          max_capacity: 8,
          is_locked: false,
          notes_count: 0
        }
      ];

      allStudents.value = [
        {
          id: 'student-1',
          name: 'Anna Meier',
          current_enrollment: null,
          first_choice: 'course-1',
          second_choice: 'course-2',
          third_choice: 'course-3'
        },
        {
          id: 'student-2',
          name: 'Max Schmidt', 
          current_enrollment: 'course-1',
          first_choice: 'course-1',
          second_choice: 'course-2',
          third_choice: 'course-3'
        },
        {
          id: 'student-3',
          name: 'Lea Müller',
          current_enrollment: 'course-1',
          first_choice: 'course-1',
          second_choice: 'course-3',
          third_choice: 'course-2'
        }
      ];

      courseNotes.value = [
        {
          id: 'note-1',
          course_id: 'course-1',
          text: 'Need to check equipment before class starts',
          author: 'Test Admin',
          is_problem: true,
          is_resolved: false,
          created_at: new Date().toISOString()
        }
      ];

      currentSemester.value = 'Fall 2024';
      loading.value = false;
    };

    // Computed properties
    const selectedDayName = computed(() => {
      const day = daysOfWeek.value.find(d => d.day_number === selectedDayNumber.value);
      return day?.name_en || 'Monday';
    });

    const filteredStudents = computed(() => {
      if (!searchQuery.value.trim()) return allStudents.value;
      const query = searchQuery.value.toLowerCase();
      return allStudents.value.filter(student => 
        student.name.toLowerCase().includes(query)
      );
    });

    const filteredCourses = computed(() => {
      return allCourses.value;
    });

    const waitingListStudents = computed(() => {
      return filteredStudents.value.filter(student => !student.current_enrollment);
    });

    const goingHomeStudents = computed(() => {
      return []; // Empty for this demo
    });

    const enrolledByCourseId = computed(() => {
      const enrolled = {};
      allCourses.value.forEach(course => {
        enrolled[course.id] = filteredStudents.value.filter(student => 
          student.current_enrollment === course.id
        );
      });
      return enrolled;
    });

    const totalEnrolledForDay = computed(() => {
      return filteredStudents.value.filter(student => student.current_enrollment).length;
    });

    const unresolvedProblems = computed(() => {
      return courseNotes.value.filter(note => note.is_problem && !note.is_resolved);
    });

    // Helper functions
    const getCourseName = (courseId) => {
      const course = allCourses.value.find(c => c.id === courseId);
      return course?.name || 'Unknown Course';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const formatPreferenceDisplay = (courseId) => {
      if (courseId === 'go-home') return 'Home';
      const course = allCourses.value.find(c => c.id === courseId);
      return course?.name || 'Unknown';
    };

    const isCurrentChoice = (student, choiceNumber) => {
      const choice = choiceNumber === 1 ? student.first_choice :
                   choiceNumber === 2 ? student.second_choice : 
                   student.third_choice;
      return student.current_enrollment === choice;
    };

    const isLockedTarget = (courseId) => {
      if (!courseId || courseId === 'go-home') return false;
      const course = allCourses.value.find(c => c.id === courseId);
      return !!course?.is_locked;
    };

    const displayRosterCount = (course) => {
      return enrolledByCourseId.value[course.id]?.length || 0;
    };

    const getCourseStatus = (course) => {
      const enrolled = displayRosterCount(course);
      const capacity = course.max_capacity;
      
      if (course.is_locked) return 'locked';
      if (enrolled > capacity) return 'overfilled';
      if (enrolled >= capacity * 0.8) return 'near_full';
      return 'normal';
    };

    const statusSectionClass = (course) => {
      const status = getCourseStatus(course);
      return {
        'course-distribution__section--near-full': status === 'near_full',
        'course-distribution__section--overfilled': status === 'overfilled',
        'course-distribution__section--locked': status === 'locked'
      };
    };

    const capacityPillClass = (course) => {
      const status = getCourseStatus(course);
      return {
        'cd-capacity--normal': status === 'normal',
        'cd-capacity--near': status === 'near_full',
        'cd-capacity--over': status === 'overfilled',
        'cd-capacity--locked': status === 'locked'
      };
    };

    const statusBadgeText = (course) => {
      const status = getCourseStatus(course);
      return status === 'overfilled' ? 'Overfilled' : '';
    };

    const isParticipantsVisible = (courseId) => {
      return visibleParticipants.value.has(courseId);
    };

    const toggleParticipants = (courseId) => {
      if (visibleParticipants.value.has(courseId)) {
        visibleParticipants.value.delete(courseId);
      } else {
        visibleParticipants.value.add(courseId);
      }
    };

    const toggleCourseDetails = (courseId) => {
      if (collapsedCourseDetails.value.has(courseId)) {
        collapsedCourseDetails.value.delete(courseId);
      } else {
        collapsedCourseDetails.value.add(courseId);
      }
    };

    // Event handlers
    const onDayChange = async (day) => {
      if (isEditing.value) return;
      selectedDayNumber.value = parseInt(day, 10);
      emit('trigger-event', { name: 'dayChange', event: { value: selectedDayNumber.value } });
    };

    const onSearchChange = (query) => {
      if (isEditing.value) return;
      searchQuery.value = query;
      emit('trigger-event', { name: 'searchChange', event: { value: query } });
    };

    const onStudentMove = async (studentId, targetId) => {
      if (isEditing.value) return;
      console.log('Moving student', studentId, 'to', targetId);
      
      // Update student enrollment in mock data
      const student = allStudents.value.find(s => s.id === studentId);
      if (student) {
        if (targetId === 'waiting') {
          student.current_enrollment = null;
        } else {
          student.current_enrollment = targetId;
        }
      }
      
      emit('trigger-event', { name: 'studentMove', event: { studentId, courseId: targetId } });
    };

    const onLockToggle = async (courseId, lockState) => {
      if (isEditing.value) return;
      console.log('Toggling lock for course', courseId, 'to', lockState);
      
      // Update course lock state in mock data
      const course = allCourses.value.find(c => c.id === courseId);
      if (course) {
        course.is_locked = lockState;
      }
      
      emit('trigger-event', { name: 'courseLockToggle', event: { courseId, lockState } });
    };

    const onApproveClick = (courseId) => {
      if (isEditing.value) return;
      console.log('Approving course', courseId);
      emit('trigger-event', { name: 'courseApprove', event: { courseId } });
    };

    const onNotesClick = (courseId) => {
      if (isEditing.value) return;
      console.log('Opening notes for course', courseId);
      emit('trigger-event', { name: 'courseNotesOpen', event: { courseId } });
    };

    const onResolveNote = async (noteId) => {
      if (isEditing.value) return;
      console.log('Resolving note', noteId);
      
      // Update note in mock data
      const note = courseNotes.value.find(n => n.id === noteId);
      if (note) {
        note.is_resolved = true;
        note.resolved_at = new Date().toISOString();
      }
      
      emit('trigger-event', { name: 'problemResolved', event: { noteId } });
    };

    // Initialize data when component mounts
    onMounted(() => {
      initializeMockData();
    });

    return {
      // State
      loading,
      searchQuery,
      selectedDayNumber,
      currentSemester,
      courseNotes,
      
      // Computed
      selectedDayName,
      filteredCourses,
      waitingListStudents,
      goingHomeStudents,
      enrolledByCourseId,
      totalEnrolledForDay,
      unresolvedProblems,
      daysOfWeek,
      allCourses,
      
      // Helper functions
      getCourseName,
      formatDate,
      formatPreferenceDisplay,
      isCurrentChoice,
      isLockedTarget,
      displayRosterCount,
      getCourseStatus,
      statusSectionClass,
      capacityPillClass,
      statusBadgeText,
      isParticipantsVisible,
      toggleParticipants,
      toggleCourseDetails,
      
      // Event handlers
      onDayChange,
      onSearchChange,
      onStudentMove,
      onLockToggle,
      onApproveClick,
      onNotesClick,
      onResolveNote,
      
      // Props
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
    display: none;
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

/* Tailwind-like utilities for the Problems Section */
.mb-4 { margin-bottom: 1rem; }
.p-3 { padding: 0.75rem; }
.bg-red-50 { background-color: #fef2f2; }
.border-l-4 { border-left-width: 4px; }
.border-red-400 { border-left-color: #f87171; }
.rounded { border-radius: 0.375rem; }
.text-red-800 { color: #991b1b; }
.font-medium { font-weight: 500; }
.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
.h-4 { height: 1rem; }
.w-4 { width: 1rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; }
.bg-white { background-color: #ffffff; }
.p-2 { padding: 0.5rem; }
.border { border-width: 1px; }
.border-red-200 { border-color: #fecaca; }
.flex-1 { flex: 1 1 0%; }
.font-medium { font-weight: 500; }
.text-red-700 { color: #b91c1c; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-red-600 { color: #dc2626; }
.text-red-500 { color: #ef4444; }
.text-red-800 { color: #991b1b; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.ml-3 { margin-left: 0.75rem; }
.h-6 { height: 1.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.bg-green-100 { background-color: #dcfce7; }
.text-green-700 { color: #15803d; }
.hover\:bg-green-200:hover { background-color: #bbf7d0; }
.border-0 { border-width: 0px; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
</style>
