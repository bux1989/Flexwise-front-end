
<template>
  <div v-if="show" class="lesson-info-box" :style="position">
    <div class="info-box-header">
      <h3>
        <!-- Show correct header for Termin -->
        {{ lesson?.subject_name === 'Termin' ? 'Termin Info' : 'Lesson Details' }}
      </h3>
      <button class="close-button" @click="onClose">&times;</button>
    </div>
    <div class="info-box-content">
      <div v-if="lesson">
        <!-- Termin-specific fields -->
        <template v-if="lesson.subject_name === 'Termin'">
          <div class="detail-row" v-if="lesson.teacher_names && lesson.teacher_names.length">
            <strong>Participants:</strong> {{ lesson.teacher_names.join(', ') }}
          </div>
          <div class="detail-row" v-if="lesson.meeting_name">
            <strong>Termin Name:</strong> {{ lesson.meeting_name }}
          </div>
          <div class="detail-row" v-if="lesson.notes">
            <strong>Notes:</strong> {{ lesson.notes }}
          </div>
          <div class="detail-row" v-if="lesson.room_name || lesson.scheduled_room_name">
            <strong>Room:</strong> {{ lesson.room_name || lesson.scheduled_room_name }}
          </div>
        </template>
        <!-- Regular lesson fields -->
        <template v-else>
          <div class="detail-row" v-if="lesson.teacher_names && lesson.teacher_names.length">
            <strong>Teacher(s):</strong> {{ lesson.teacher_names.join(', ') }}
          </div>
          <div class="detail-row" v-if="lesson.class_name">
            <strong>Class:</strong> {{ lesson.class_name }}
          </div>
          <div class="detail-row" v-if="lesson.subject_name">
            <strong>Subject:</strong> {{ lesson.subject_name }}
          </div>
          <div class="detail-row" v-if="!lesson.subject_name && lesson.course_name">
            <strong>Course:</strong> {{ lesson.course_name }}
          </div>
          <div class="detail-row" v-if="lesson.room_name || lesson.scheduled_room_name">
            <strong>Room:</strong> {{ lesson.room_name || lesson.scheduled_room_name }}
          </div>
          <div class="detail-row" v-if="lesson.enrolled_students_names && lesson.enrolled_students_names.length">
            <strong>Students:</strong>
            <ul class="students-list">
              <li v-for="(student, index) in displayedStudents" :key="index">{{ student }}</li>
            </ul>
          </div>
          <div class="detail-row" v-if="!lesson.class_name && !lesson.subject_name && !lesson.course_name">
            <em>No lesson details available</em>
          </div>
        </template>
      </div>
      <div v-else>
        <em>No lesson selected</em>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'InfoBox',
  props: {
    show: { type: Boolean, default: false },
    lesson: { type: Object, default: null },
    position: { type: Object, default: () => ({ top: '0px', left: '0px' }) }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const displayedStudents = computed(() => 
      props.lesson?.enrolled_students_names?.slice(0, 5) || []
    );
    const onClose = () => { emit('close'); };
    return { displayedStudents, onClose };
  }
};
</script>

<style lang="scss" scoped>
.lesson-info-box {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  max-width: 300px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

  .info-box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

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

  .info-box-content {
    .detail-row {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .students-list {
      margin-top: 4px;
      padding-left: 16px;
      margin-bottom: 0;

      li {
        margin-bottom: 2px;
      }
    }
  }
}
</style>