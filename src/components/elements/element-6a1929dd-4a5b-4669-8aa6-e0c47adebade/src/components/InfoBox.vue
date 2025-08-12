
<template>
  <div v-if="show" class="lesson-info-box" :style="position">
    <div class="info-box-header">
      <h3>
        <!-- Show correct header for Termin -->
        {{ lesson?.subject_name === 'Termin' ? t('terminInfo') : t('lessonDetails') }}
      </h3>
      <button class="close-button" @click="onClose">&times;</button>
    </div>
    <div class="info-box-content">
      <div v-if="lesson">
        <!-- Termin-specific fields -->
        <template v-if="lesson.subject_name === 'Termin'">
          <div class="detail-row" v-if="lesson.teacher_names && lesson.teacher_names.length">
            <strong>{{ t('participants') }}:</strong> {{ lesson.teacher_names.join(', ') }}
          </div>
          <div class="detail-row" v-if="lesson.meeting_name">
            <strong>{{ t('terminName') }}:</strong> {{ lesson.meeting_name }}
          </div>
          <div class="detail-row" v-if="lesson.notes">
            <strong>{{ t('notes') }}:</strong> {{ lesson.notes }}
          </div>
          <div class="detail-row" v-if="lesson.room_name || lesson.scheduled_room_name">
            <strong>{{ t('room') }}:</strong> {{ lesson.room_name || lesson.scheduled_room_name }}
          </div>
        </template>
        <!-- Regular lesson fields -->
        <template v-else>
          <div class="detail-row" v-if="lesson.teacher_names && lesson.teacher_names.length">
            <strong>{{ t('teachers') }}:</strong> {{ lesson.teacher_names.join(', ') }}
          </div>
          <div class="detail-row" v-if="lesson.class_name">
            <strong>{{ t('class') }}:</strong> {{ lesson.class_name }}
          </div>
          <div class="detail-row" v-if="lesson.subject_name">
            <strong>{{ t('subject') }}:</strong> {{ lesson.subject_name }}
          </div>
          <div class="detail-row" v-if="!lesson.subject_name && lesson.course_name">
            <strong>{{ t('course') }}:</strong> {{ lesson.course_name }}
          </div>
          <div class="detail-row" v-if="lesson.room_name || lesson.scheduled_room_name">
            <strong>{{ t('room') }}:</strong> {{ lesson.room_name || lesson.scheduled_room_name }}
          </div>
          <div class="detail-row" v-if="lesson.enrolled_students_names && lesson.enrolled_students_names.length">
            <strong>{{ t('students') }}:</strong>
            <ul class="students-list">
              <li v-for="(student, index) in displayedStudents" :key="index">{{ student }}</li>
            </ul>
          </div>
          <div class="detail-row" v-if="!lesson.class_name && !lesson.subject_name && !lesson.course_name">
            <em>{{ t('noLessonDetails') }}</em>
          </div>
        </template>
      </div>
      <div v-else>
        <em>{{ t('noLessonSelected') }}</em>
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
    position: { type: Object, default: () => ({ top: '0px', left: '0px' }) },
    language: { type: String, default: 'de' }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // Translation utilities
    const translations = {
      de: {
        terminInfo: 'Termin Info',
        lessonDetails: 'Unterrichtsdetails',
        participants: 'Teilnehmer',
        terminName: 'Termin Name',
        notes: 'Notizen',
        room: 'Raum',
        teachers: 'Lehrer',
        class: 'Klasse',
        subject: 'Fach',
        course: 'Kurs',
        students: 'Schüler',
        noLessonDetails: 'Keine Unterrichtsdetails verfügbar',
        noLessonSelected: 'Keine Unterrichtsstunde ausgewählt'
      },
      en: {
        terminInfo: 'Appointment Info',
        lessonDetails: 'Lesson Details',
        participants: 'Participants',
        terminName: 'Appointment Name',
        notes: 'Notes',
        room: 'Room',
        teachers: 'Teacher(s)',
        class: 'Class',
        subject: 'Subject',
        course: 'Course',
        students: 'Students',
        noLessonDetails: 'No lesson details available',
        noLessonSelected: 'No lesson selected'
      }
    };

    const t = (key) => translations[props.language]?.[key] || translations.de[key] || key;

    const displayedStudents = computed(() => 
      props.lesson?.enrolled_students_names?.slice(0, 5) || []
    );
    
    const onClose = () => { emit('close'); };
    
    return { displayedStudents, onClose, t };
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
