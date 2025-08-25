<template>
  <div class="modal-overlay" @click="cancelSelection">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Assign {{ courseName }} to Schedule</h3>
        <button @click="cancelSelection" class="close-btn" aria-label="Close">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Selected Items Summary -->
        <div v-if="selectedTeachers.length > 0 || selectedRoomId" class="selection-section selected-summary">
          <label class="section-label">Currently Selected:</label>
          
          <!-- Selected Teachers -->
          <div v-if="selectedTeachers.length > 0" class="selected-items">
            <div class="selected-label">Teachers:</div>
            <div class="selected-teacher-tags">
              <div
                v-for="teacherId in selectedTeachers"
                :key="teacherId"
                class="selected-tag teacher-tag"
                :class="{ primary: isPrimary(teacherId) }"
              >
                <span class="tag-text">{{ getTeacherName(teacherId) }}</span>
                <span v-if="isPrimary(teacherId)" class="primary-indicator" title="Primary teacher">★</span>
                <button @click="removeTeacher(teacherId)" class="remove-btn" title="Remove teacher">&times;</button>
              </div>
            </div>
          </div>

          <!-- Selected Room -->
          <div v-if="selectedRoomId" class="selected-items">
            <div class="selected-label">Room:</div>
            <div class="selected-room-tags">
              <div class="selected-tag room-tag">
                <span class="tag-text">{{ getRoomName(selectedRoomId) }}</span>
                <button @click="removeRoom()" class="remove-btn" title="Remove room">&times;</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduling options -->
        <div class="selection-section scheduling-options">
          <label class="section-label">Scheduling options:</label>
          <label class="checkbox-row">
            <input
              type="checkbox"
              v-model="isRecurring"
              class="checkbox-input"
              aria-describedby="recurring-help"
            />
            <span>Schedule multiple times this week</span>
          </label>
          <p id="recurring-help" class="help-text">
            If checked, you can add this course to multiple day/period slots without it being hidden from the Available list.
          </p>
        </div>

        <!-- Teacher Selection -->
        <div class="selection-section">
          <label class="section-label">Add Teachers:</label>
          <div class="compact-selector">
            <div class="search-dropdown" :class="{ active: teacherDropdownOpen }">
              <input
                v-model="teacherSearchTerm"
                type="text"
                placeholder="Search and select teachers..."
                class="search-input compact"
                @focus="teacherDropdownOpen = true"
                @blur="closeTeacherDropdown"
              />
              <div v-if="teacherDropdownOpen" class="dropdown-list teacher-dropdown">
                <div
                  v-for="teacher in filteredAvailableTeachers"
                  :key="teacher.id"
                  class="dropdown-item"
                  @mousedown.prevent="selectTeacher(teacher.id)"
                >
                  <div class="teacher-info">
                    <span class="teacher-name">{{ teacher.name || `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}` }}</span>
                    <span v-if="teacher.email" class="teacher-email">{{ teacher.email }}</span>
                  </div>
                </div>
                <div v-if="filteredAvailableTeachers.length === 0" class="dropdown-item no-results">
                  No teachers found
                </div>
              </div>
            </div>
            <div v-if="selectedTeachers.length > 1" class="primary-teacher-section">
              <label class="primary-label">Primary teacher:</label>
              <select v-model="primaryTeacherId" class="primary-select">
                <option 
                  v-for="teacherId in selectedTeachers" 
                  :key="teacherId" 
                  :value="teacherId"
                >
                  {{ getTeacherName(teacherId) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Room Selection -->
        <div class="selection-section">
          <label class="section-label">Add Room:</label>
          <div class="compact-selector">
            <div class="search-dropdown" :class="{ active: roomDropdownOpen }">
              <input
                v-model="roomSearchTerm"
                type="text"
                placeholder="Search and select room..."
                class="search-input compact"
                @focus="roomDropdownOpen = true"
                @blur="closeRoomDropdown"
              />
              <div v-if="roomDropdownOpen" class="dropdown-list room-dropdown">
                <div
                  v-for="room in filteredAvailableRooms"
                  :key="room.id"
                  class="dropdown-item"
                  @mousedown.prevent="selectRoom(room.id)"
                >
                  <span class="room-name">{{ room.name || room.room_name }}</span>
                  <span v-if="room.capacity" class="room-capacity">Capacity: {{ room.capacity }}</span>
                </div>
                <div v-if="filteredAvailableRooms.length === 0" class="dropdown-item no-results">
                  No rooms found
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="cancelSelection" class="cancel-btn">Cancel</button>
        <button @click="submitAssignment" class="submit-btn" :disabled="!isValid">Assign Course</button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue';

export default {
  name: 'TeacherRoomSelectionModal',
  props: {
    courseId: { type: [String, Number], required: true },
    courseName: { type: String, required: true },
    dayId: { type: [String, Number], required: true },
    periodId: { type: [String, Number], required: true },
    teachers: { type: Array, default: () => [] },
    rooms: { type: Array, default: () => [] },
    // Preselect teachers (possible_staff_ids from the course)
    preselectedTeacherIds: { type: Array, default: () => [] },
    // NEW: Preselect room (id calculated in the grid from possible_room_* fields)
    preselectedRoomId: { type: [String, Number], default: null },
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    // Helpers
    const asId = (v) => (v == null ? null : String(v));
    const uniq = (arr) => Array.from(new Set(arr));

    // Scheduling option
    const isRecurring = ref(false); // unchecked by default → one-off

    // Search terms
    const teacherSearchTerm = ref('');
    const roomSearchTerm = ref('');

    // Dropdown state
    const teacherDropdownOpen = ref(false);
    const roomDropdownOpen = ref(false);

    // Selection state
    const selectedTeachers = ref([]); // array of string ids
    const primaryTeacherId = ref(null); // string id
    const selectedRoomId = ref(null); // string id

    // Track if user changed selection to avoid overriding with new preselect data
    const userEdited = ref(false);

    // Filtered lists
    const filteredTeachers = computed(() => {
      if (!teacherSearchTerm.value) return props.teachers;
      const q = teacherSearchTerm.value.toLowerCase();
      return props.teachers.filter((t) => {
        const name = (t.name || `${t.first_name ?? ''} ${t.last_name ?? ''}`).trim();
        const email = t.email || '';
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    });

    const filteredRooms = computed(() => {
      if (!roomSearchTerm.value) return props.rooms;
      const q = roomSearchTerm.value.toLowerCase();
      return props.rooms.filter((r) => (r.name || r.room_name || '').toLowerCase().includes(q));
    });

    // Available (not selected) filtered lists for dropdowns
    const filteredAvailableTeachers = computed(() => {
      return filteredTeachers.value.filter(t => !isTeacherSelected(t.id));
    });

    const filteredAvailableRooms = computed(() => {
      return filteredRooms.value.filter(r => selectedRoomId.value !== asId(r.id));
    });

    // Validation: at least one teacher required
    const isValid = computed(() => selectedTeachers.value.length > 0);

    // Keep primary in sync
    watch(selectedTeachers, (newList) => {
      if (primaryTeacherId.value && !newList.includes(primaryTeacherId.value)) {
        primaryTeacherId.value = null;
      }
      if (!primaryTeacherId.value && newList.length === 1) {
        primaryTeacherId.value = newList[0];
      }
    });

    function isTeacherSelected(id) {
      const sid = asId(id);
      return selectedTeachers.value.includes(sid);
    }
    function isPrimary(id) {
      return primaryTeacherId.value === asId(id);
    }

    function toggleTeacher(id) {
      userEdited.value = true;
      const sid = asId(id);
      const idx = selectedTeachers.value.indexOf(sid);
      if (idx > -1) selectedTeachers.value.splice(idx, 1);
      else selectedTeachers.value.push(sid);
    }

    function setPrimaryTeacher(id) {
      userEdited.value = true;
      const sid = asId(id);
      if (selectedTeachers.value.includes(sid)) {
        primaryTeacherId.value = sid;
      }
    }

    function selectRoom(id) {
      const sid = asId(id);
      selectedRoomId.value = sid;
      userEdited.value = true;
      roomSearchTerm.value = '';
      roomDropdownOpen.value = false;
    }

    function removeRoom() {
      selectedRoomId.value = null;
      userEdited.value = true;
    }

    function selectTeacher(id) {
      const sid = asId(id);
      if (!selectedTeachers.value.includes(sid)) {
        selectedTeachers.value.push(sid);
        userEdited.value = true;
        if (selectedTeachers.value.length === 1) {
          primaryTeacherId.value = sid;
        }
      }
      teacherSearchTerm.value = '';
      teacherDropdownOpen.value = false;
    }

    function removeTeacher(id) {
      const sid = asId(id);
      const idx = selectedTeachers.value.indexOf(sid);
      if (idx > -1) {
        selectedTeachers.value.splice(idx, 1);
        userEdited.value = true;
        if (primaryTeacherId.value === sid) {
          primaryTeacherId.value = selectedTeachers.value.length > 0 ? selectedTeachers.value[0] : null;
        }
      }
    }

    function getTeacherName(teacherId) {
      const teacher = props.teachers.find(t => asId(t.id) === teacherId);
      if (!teacher) return `Teacher ${teacherId}`;
      return teacher.name || `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() || `Teacher ${teacherId}`;
    }

    function getRoomName(roomId) {
      const room = props.rooms.find(r => asId(r.id) === roomId);
      if (!room) return `Room ${roomId}`;
      return room.name || room.room_name || `Room ${roomId}`;
    }

    function closeTeacherDropdown() {
      setTimeout(() => {
        teacherDropdownOpen.value = false;
      }, 150);
    }

    function closeRoomDropdown() {
      setTimeout(() => {
        roomDropdownOpen.value = false;
      }, 150);
    }

    function submitAssignment() {
      if (!isValid.value) return;
      const payload = {
        courseId: asId(props.courseId),
        courseName: props.courseName,
        teacherIds: selectedTeachers.value.slice(), // strings
        primaryTeacherId: primaryTeacherId.value,
        roomId: selectedRoomId.value,
        periodId: asId(props.periodId),
        dayId: asId(props.dayId),
        frequency: isRecurring.value ? 'recurring' : 'one-off',
        source: 'modal-assignment',
        timestamp: new Date().toISOString(),
      };
      emit('submit', payload);
    }

    function cancelSelection() {
      emit('cancel');
    }

    // Init preselection for teachers and room
    function initPreselection() {
      // Only run if we haven't let user edit yet (fresh open)
      if (userEdited.value) return;

      // Teachers: intersect preselected with the teachers actually available in this modal
      const teacherIdSet = new Set(props.teachers.map((t) => asId(t.id)));
      const pre = uniq((props.preselectedTeacherIds || []).map(asId)).filter((id) => id && teacherIdSet.has(id));
      selectedTeachers.value = pre;
      primaryTeacherId.value = pre.length ? pre[0] : null;

      // Room: only set if a preselected id exists and that room is in the rooms list
      if (!selectedRoomId.value && props.preselectedRoomId != null) {
        const rid = asId(props.preselectedRoomId);
        const exists = props.rooms.some((r) => asId(r.id) === rid);
        if (rid && exists) selectedRoomId.value = rid;
      }
    }

    onMounted(() => {
      initPreselection();
    });

    // If the course or preselect props change while the modal remains mounted, re-init
    watch(
      () => [props.courseId, props.preselectedTeacherIds, props.preselectedRoomId, props.teachers, props.rooms],
      () => {
        // treat as fresh open for a different course / refreshed data
        userEdited.value = false;
        initPreselection();
      },
      { deep: true }
    );

    return {
      // helpers
      asId,

      // scheduling
      isRecurring,

      // search and state
      teacherSearchTerm,
      roomSearchTerm,
      teacherDropdownOpen,
      roomDropdownOpen,
      selectedTeachers,
      primaryTeacherId,
      selectedRoomId,

      // computed
      filteredTeachers,
      filteredRooms,
      filteredAvailableTeachers,
      filteredAvailableRooms,
      isValid,

      // class helpers
      isTeacherSelected,
      isPrimary,

      // actions
      toggleTeacher,
      setPrimaryTeacher,
      selectTeacher,
      removeTeacher,
      selectRoom,
      removeRoom,
      getTeacherName,
      getRoomName,
      closeTeacherDropdown,
      closeRoomDropdown,
      submitAssignment,
      cancelSelection,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  width: 90vw; max-width: 600px; max-height: 80vh;
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #e0e0e0;
}
.modal-header h3 { margin: 0; color: #333; font-size: 18px; }
.close-btn {
  background: none; border: none; font-size: 24px; cursor: pointer; color: #666;
  padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { color: #333; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.selection-section { margin-bottom: 24px; }
.scheduling-options { margin-top: -8px; }
.section-label { display: block; font-weight: bold; margin-bottom: 8px; color: #333; }
.checkbox-row { display: inline-flex; align-items: center; gap: 8px; user-select: none; }
.checkbox-input { width: 16px; height: 16px; }
.help-text { margin: 6px 0 0; font-size: 12px; color: #666; }

/* Selected Items Summary */
.selected-summary {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
}

.selected-items {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.selected-items:last-child {
  margin-bottom: 0;
}

.selected-label {
  font-weight: 500;
  color: #495057;
  min-width: 70px;
  padding-top: 2px;
}

.selected-teacher-tags,
.selected-room-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 14px;
}

.teacher-tag.primary {
  background: #fff3e0;
  border-color: #ff9800;
}

.room-tag {
  background: #e8f5e8;
  border-color: #4caf50;
}

.tag-text {
  color: #333;
}

.primary-indicator {
  color: #ff9800;
  font-weight: bold;
}

.remove-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.remove-btn:hover {
  background: #dc3545;
  color: white;
}

/* Compact Selectors */
.compact-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-dropdown {
  position: relative;
}

.search-input.compact {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.search-input.compact:focus {
  outline: none;
  border-color: #007cba;
  box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.2);
}

.search-dropdown.active .search-input.compact {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: #007cba;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #007cba;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}
.dropdown-item:last-child {
  border-bottom: none;
}
.dropdown-item:hover {
  background: #f8f9fa;
}
.dropdown-item.no-results {
  color: #6c757d;
  cursor: default;
  font-style: italic;
}
.dropdown-item.no-results:hover {
  background: white;
}

.primary-teacher-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.primary-label {
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.primary-select {
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}
.primary-select:focus {
  outline: none;
  border-color: #007cba;
  box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.2);
}

/* Dropdown teacher info styling */
.dropdown-item .teacher-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.dropdown-item .teacher-name {
  font-weight: 500;
  color: #333;
}
.dropdown-item .teacher-email {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
.dropdown-item .room-name {
  font-weight: 500;
  color: #333;
}
.dropdown-item .room-capacity {
  font-size: 12px;
  color: #666;
}

.search-box { margin-bottom: 12px; }
.search-input {
  width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;
}
.search-input:focus { outline: none; border-color: #007cba; box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.2); }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 16px 20px; border-top: 1px solid #e0e0e0;
}
.cancel-btn, .submit-btn {
  padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; border: 1px solid; transition: all 0.2s;
}
.cancel-btn { background: white; border-color: #ddd; color: #666; }
.cancel-btn:hover { background-color: #f8f9fa; }
.submit-btn { background: #007cba; border-color: #007cba; color: white; }
.submit-btn:hover:not(:disabled) { background: #005a84; border-color: #005a84; }
.submit-btn:disabled { background: #ccc; border-color: #ccc; cursor: not-allowed; opacity: 0.6; }

</style>
