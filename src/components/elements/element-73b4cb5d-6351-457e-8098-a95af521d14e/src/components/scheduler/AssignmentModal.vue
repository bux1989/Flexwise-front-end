<template>
  <div v-if="visible" class="assignment-modal-backdrop" @click="$emit('close')">
    <div class="assignment-modal" @click.stop>
      <div class="modal-header">
        <h3>Assign {{ preSelectedCourse?.name || preSelectedCourse?.course_name || 'Course' }}</h3>
        <button @click="$emit('close')" class="close-btn" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div v-if="isReadOnly" class="read-only-notice">
          <p>📖 Read-only mode — Assignment details are shown for information only.</p>
        </div>

        <template v-else>
          <!-- Context -->
          <div class="context-row" v-if="preSelectedCourse">
            <div class="context-chip">Day: <strong>{{ formattedDay }}</strong></div>
            <div class="context-chip">Period: <strong>{{ formattedPeriod }}</strong></div>
          </div>

          <!-- Frequency -->
          <label class="freq-row">
            <input
              type="checkbox"
              v-model="frequencyChecked"
              :aria-checked="frequencyChecked ? 'true' : 'false'"
            />
            <span>Schedule multiple times this week</span>
          </label>
          <p class="freq-warning" v-if="frequencyChecked">
            Multiple times per week means some children, teachers, and the room may be shared across repeated
            sessions. The course will remain in the Available list so you can add another occurrence.
          </p>

          <!-- Teachers -->
          <div class="section">
            <div class="section-title">Teachers</div>
            <div class="teacher-list">
              <label
                v-for="t in teachers"
                :key="t.id"
                class="teacher-item"
              >
                <input
                  type="checkbox"
                  :value="t.id"
                  v-model="selectedTeacherIds"
                />
                <span class="t-name">{{ t.name }}</span>
                <input
                  type="radio"
                  :value="t.id"
                  v-model="primaryTeacherId"
                  :disabled="!selectedTeacherIds.includes(t.id)"
                  title="Primary teacher"
                  class="primary-radio"
                />
              </label>
            </div>
            <div class="helper" v-if="selectedTeacherIds.length === 0">
              Select at least one teacher (optional).
            </div>
          </div>

          <!-- Room -->
          <div class="section">
            <div class="section-title">Room</div>
            <select class="room-select" v-model="selectedRoomId">
              <option :value="null">No room</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
        <button
          v-if="!isReadOnly"
          @click="submit"
          class="btn btn-primary"
        >
          Assign Course
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssignmentModal',
  props: {
    visible: { type: Boolean, default: false },
    dayId: { type: [String, Number], default: null },
    periodId: { type: [String, Number], default: null },
    period: { type: Object, default: null },
    preSelectedCourse: { type: Object, default: null },
    teachers: { type: Array, default: () => [] },
    rooms: { type: Array, default: () => [] },
    schoolDays: { type: Array, default: () => [] },
    isReadOnly: { type: Boolean, default: false },

    // Checkbox defaults to unchecked every time
    defaultFrequencyChecked: { type: Boolean, default: false },
  },
  emits: ['close', 'submit'],
  data() {
    return {
      frequencyChecked: this.defaultFrequencyChecked,
      selectedTeacherIds: [],
      primaryTeacherId: null,
      selectedRoomId: null,
    };
  },
  watch: {
    visible(n) { if (n) this.resetForm(); },
    preSelectedCourse() { this.resetForm(); },
  },
  computed: {
    formattedDay() {
      const d = Array.isArray(this.schoolDays)
        ? this.schoolDays.find((x) => String(x.id) === String(this.dayId))
        : null;
      return d?.name || `Day ${this.dayId}`;
    },
    formattedPeriod() {
      return this.period?.name || `Period ${this.periodId}`;
    },
  },
  methods: {
    resetForm() {
      this.frequencyChecked = this.defaultFrequencyChecked;
      this.selectedTeacherIds = [];
      this.primaryTeacherId = null;
      this.selectedRoomId = null;
    },
    submit() {
      if (this.primaryTeacherId && !this.selectedTeacherIds.includes(this.primaryTeacherId)) {
        this.selectedTeacherIds = [...this.selectedTeacherIds, this.primaryTeacherId];
      }
      this.$emit('submit', {
        dayId: this.dayId,
        periodId: this.periodId,
        courseId: this.preSelectedCourse?.id || null,
        courseName: this.preSelectedCourse?.name || this.preSelectedCourse?.course_name || '',
        courseCode: this.preSelectedCourse?.code || this.preSelectedCourse?.course_code || '',
        teacherIds: this.selectedTeacherIds,
        primaryTeacherId: this.primaryTeacherId,
        roomId: this.selectedRoomId,
        frequency: this.frequencyChecked ? 'recurring' : 'one-off',
        timestamp: new Date().toISOString(),
      });
    },
  },
};
</script>

<style scoped>
.assignment-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.assignment-modal {
  background: #fff; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  max-width: 720px; width: 96vw; max-height: 86vh; overflow: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 { margin: 0; font-size: 1.05rem; color: #111827; }
.close-btn { background: transparent; border: 0; font-size: 22px; color: #6b7280; cursor: pointer; }
.close-btn:hover { color: #374151; }

.modal-body { padding: 14px 16px; }
.read-only-notice {
  background: #f0f8ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 10px; margin-bottom: 12px;
}
.context-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.context-chip {
  background: #eef2ff; color: #1e3a8a; border: 1px solid #c7d2fe; padding: 2px 6px; border-radius: 9999px; font-size: 12px;
}

.freq-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; margin-bottom: 6px; }
.freq-warning { margin: 0 0 12px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px; font-size: 0.92em; }

.section { margin-top: 8px; }
.section-title { font-weight: 700; color: #111827; margin-bottom: 6px; }

.teacher-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; }
.teacher-item {
  display: grid; grid-template-columns: 18px 1fr 18px; align-items: center; gap: 8px;
  padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff;
}
.t-name { color: #374151; }
.primary-radio { justify-self: end; }

.helper { color: #6b7280; font-size: 12px; margin-top: 4px; }

.room-select {
  width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: #111827;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid #e5e7eb;
}
.btn {
  padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d5db; cursor: pointer; font-weight: 700; font-size: 14px;
}
.btn-secondary { background: #fff; color: #111827; }
.btn-secondary:hover { background: #f9fafb; }
.btn-primary { background: #007cba; color: #fff; border-color: #007cba; }
.btn-primary:hover { background: #066aa0; }
</style>
