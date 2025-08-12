/**
 * Conflict Detection Utility for Schedule Table
 * Detects various types of scheduling conflicts in draft lessons
 */

/**
 * Create localized conflict messages
 */
const createLocalizedMessage = (messageKey, params = {}, language = 'de') => {
  const templates = {
    de: {
      teacherDoubleBooking: 'Lehrer ist für {count} Stunden zur gleichen Zeit eingeteilt',
      roomDoubleBooking: 'Raum ist für {count} Stunden zur gleichen Zeit belegt',
      classDoubleBooking: 'Klasse ist für {count} Stunden zur gleichen Zeit eingeteilt',
      teacherOverload: 'Lehrer hat {assigned} Stunden zugewiesen, aber das Limit ist {limit}',
      roomInactive: 'Raum "{room}" ist inaktiv/nicht verfügbar',
      missingData: 'Fehlende erforderliche Daten: {missing}',
      classWrongRoom: 'Klasse "{class}" ist in "{room}" eingeteilt, welcher "{assignedClass}" zugewiesen ist'
    },
    en: {
      teacherDoubleBooking: 'Teacher is scheduled for {count} lessons at the same time',
      roomDoubleBooking: 'Room is booked for {count} lessons at the same time',
      classDoubleBooking: 'Class is scheduled for {count} lessons at the same time',
      teacherOverload: 'Teacher assigned {assigned} lessons, but limit is {limit}',
      roomInactive: 'Room "{room}" is inactive/unavailable',
      missingData: 'Missing required data: {missing}',
      classWrongRoom: 'Class "{class}" scheduled in "{room}" which is assigned to "{assignedClass}"'
    }
  };

  let template = templates[language]?.[messageKey] || templates.en[messageKey] || messageKey;
  
  // Replace parameters
  Object.keys(params).forEach(key => {
    template = template.replace(`{${key}}`, params[key]);
  });
  
  return template;
};

/**
 * Types of conflicts
 */
export const CONFLICT_TYPES = {
  TEACHER_DOUBLE_BOOKING: 'teacher_double_booking',
  ROOM_DOUBLE_BOOKING: 'room_double_booking', 
  CLASS_DOUBLE_BOOKING: 'class_double_booking',
  TEACHER_OVERLOAD: 'teacher_overload',
  ROOM_INACTIVE: 'room_inactive',
  MISSING_DATA: 'missing_data',
  CLASS_WRONG_ROOM: 'class_wrong_room'
};

/**
 * Conflict severity levels
 */
export const CONFLICT_SEVERITY = {
  ERROR: 'error',     // Blocking conflicts that must be resolved
  WARNING: 'warning'  // Non-blocking conflicts that can be ignored
};

/**
 * Create a unique key for day/period combination
 */
const getDayPeriodKey = (dayId, periodId) => `${dayId}-${periodId}`;

/**
 * Detect teacher double-booking conflicts
 */
const detectTeacherDoubleBooking = (draftLessons, language = 'de') => {
  const conflicts = [];
  const teacherSchedule = new Map();

  // Group lessons by teacher and time slot
  draftLessons.forEach(lesson => {
    if (!lesson.staff_ids || !Array.isArray(lesson.staff_ids)) return;
    
    const key = getDayPeriodKey(lesson.day_id, lesson.period_id);
    
    lesson.staff_ids.forEach(teacherId => {
      if (!teacherSchedule.has(teacherId)) {
        teacherSchedule.set(teacherId, new Map());
      }
      
      const timeSlots = teacherSchedule.get(teacherId);
      if (!timeSlots.has(key)) {
        timeSlots.set(key, []);
      }
      
      timeSlots.get(key).push(lesson);
    });
  });

  // Check for conflicts
  teacherSchedule.forEach((timeSlots, teacherId) => {
    timeSlots.forEach((lessons, timeKey) => {
      if (lessons.length > 1) {
        conflicts.push({
          type: CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING,
          severity: CONFLICT_SEVERITY.ERROR,
          teacherId,
          dayId: lessons[0].day_id,
          periodId: lessons[0].period_id,
          dayName: lessons[0].day_name_de || lessons[0].day_name_en,
          blockNumber: lessons[0].block_number,
          lessons,
          message: createLocalizedMessage('teacherDoubleBooking', { count: lessons.length }, language)
        });
      }
    });
  });

  return conflicts;
};

/**
 * Detect room double-booking conflicts
 */
const detectRoomDoubleBooking = (draftLessons, language = 'de') => {
  const conflicts = [];
  const roomSchedule = new Map();

  // Group lessons by room and time slot
  draftLessons.forEach(lesson => {
    if (!lesson.room_id) return;
    
    const key = getDayPeriodKey(lesson.day_id, lesson.period_id);
    
    if (!roomSchedule.has(lesson.room_id)) {
      roomSchedule.set(lesson.room_id, new Map());
    }
    
    const timeSlots = roomSchedule.get(lesson.room_id);
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    
    timeSlots.get(key).push(lesson);
  });

  // Check for conflicts
  roomSchedule.forEach((timeSlots, roomId) => {
    timeSlots.forEach((lessons, timeKey) => {
      if (lessons.length > 1) {
        conflicts.push({
          type: CONFLICT_TYPES.ROOM_DOUBLE_BOOKING,
          severity: CONFLICT_SEVERITY.ERROR,
          roomId,
          roomName: lessons[0].room_name,
          dayId: lessons[0].day_id,
          periodId: lessons[0].period_id,
          dayName: lessons[0].day_name_de || lessons[0].day_name_en,
          blockNumber: lessons[0].block_number,
          lessons,
          message: createLocalizedMessage('roomDoubleBooking', { count: lessons.length }, language)
        });
      }
    });
  });

  return conflicts;
};

/**
 * Detect class double-booking conflicts
 */
const detectClassDoubleBooking = (draftLessons, language = 'de') => {
  const conflicts = [];
  const classSchedule = new Map();

  // Group lessons by class and time slot
  draftLessons.forEach(lesson => {
    if (!lesson.class_id) return;
    
    const key = getDayPeriodKey(lesson.day_id, lesson.period_id);
    
    if (!classSchedule.has(lesson.class_id)) {
      classSchedule.set(lesson.class_id, new Map());
    }
    
    const timeSlots = classSchedule.get(lesson.class_id);
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    
    timeSlots.get(key).push(lesson);
  });

  // Check for conflicts
  classSchedule.forEach((timeSlots, classId) => {
    timeSlots.forEach((lessons, timeKey) => {
      if (lessons.length > 1) {
        conflicts.push({
          type: CONFLICT_TYPES.CLASS_DOUBLE_BOOKING,
          severity: CONFLICT_SEVERITY.ERROR,
          classId,
          className: lessons[0].class_name,
          dayId: lessons[0].day_id,
          periodId: lessons[0].period_id,
          dayName: lessons[0].day_name_de || lessons[0].day_name_en,
          blockNumber: lessons[0].block_number,
          lessons,
          message: createLocalizedMessage('classDoubleBooking', { count: lessons.length }, language)
        });
      }
    });
  });

  return conflicts;
};

/**
 * Detect teacher overload conflicts
 */
const detectTeacherOverload = (draftLessons, teachers, language = 'de') => {
  const conflicts = [];
  const teacherWorkload = new Map();

  // Count lessons per teacher
  draftLessons.forEach(lesson => {
    if (!lesson.staff_ids || !Array.isArray(lesson.staff_ids)) return;
    
    lesson.staff_ids.forEach(teacherId => {
      if (!teacherWorkload.has(teacherId)) {
        teacherWorkload.set(teacherId, 0);
      }
      teacherWorkload.set(teacherId, teacherWorkload.get(teacherId) + 1);
    });
  });

  // Check against teacher limits
  teacherWorkload.forEach((lessonCount, teacherId) => {
    const teacher = teachers.find(t => 
      t.id === teacherId || 
      t.user_id === teacherId || 
      t.profile_id === teacherId
    );
    
    if (teacher && teacher.total_hours && lessonCount > teacher.total_hours) {
      conflicts.push({
        type: CONFLICT_TYPES.TEACHER_OVERLOAD,
        severity: CONFLICT_SEVERITY.WARNING,
        teacherId,
        teacherName: teacher.name,
        lessonCount,
        maxLessons: teacher.total_hours,
        message: createLocalizedMessage('teacherOverload', { assigned: lessonCount, limit: teacher.total_hours }, language)
      });
    }
  });

  return conflicts;
};

/**
 * Detect inactive room conflicts
 */
const detectRoomInactive = (draftLessons, rooms, language = 'de') => {
  const conflicts = [];

  draftLessons.forEach(lesson => {
    if (!lesson.room_id) return;
    
    const room = rooms.find(r => r.id === lesson.room_id);
    if (room && room.is_active === false) {
      conflicts.push({
        type: CONFLICT_TYPES.ROOM_INACTIVE,
        severity: CONFLICT_SEVERITY.ERROR,
        lessonId: lesson.id,
        roomId: lesson.room_id,
        roomName: lesson.room_name,
        dayName: lesson.day_name_de || lesson.day_name_en,
        blockNumber: lesson.block_number,
        lesson,
        message: createLocalizedMessage('roomInactive', { room: lesson.room_name }, language)
      });
    }
  });

  return conflicts;
};

/**
 * Detect missing key data conflicts
 */
const detectMissingData = (draftLessons, language = 'de') => {
  const conflicts = [];

  draftLessons.forEach(lesson => {
    const missing = [];
    
    if (!lesson.staff_ids || !lesson.staff_ids.length) {
      missing.push('teacher');
    }
    if (!lesson.class_id) {
      missing.push('class');
    }
    if (!lesson.subject_id) {
      missing.push('subject');
    }
    if (!lesson.room_id) {
      missing.push('room');
    }

    if (missing.length > 0) {
      conflicts.push({
        type: CONFLICT_TYPES.MISSING_DATA,
        severity: CONFLICT_SEVERITY.ERROR,
        lessonId: lesson.id,
        dayName: lesson.day_name_de || lesson.day_name_en,
        blockNumber: lesson.block_number,
        missing,
        lesson,
        message: createLocalizedMessage('missingData', { missing: missing.join(', ') }, language)
      });
    }
  });

  return conflicts;
};

/**
 * Detect class in wrong room conflicts
 */
const detectClassWrongRoom = (draftLessons, classes, rooms, language = 'de') => {
  const conflicts = [];

  draftLessons.forEach(lesson => {
    if (!lesson.class_id || !lesson.room_id) return;
    
    const currentClass = classes.find(c => c.id === lesson.class_id);
    const room = rooms.find(r => r.id === lesson.room_id);
    
    if (currentClass && room && room.assigned_class_id && 
        room.assigned_class_id !== lesson.class_id) {
      const assignedClass = classes.find(c => c.id === room.assigned_class_id);
      
      conflicts.push({
        type: CONFLICT_TYPES.CLASS_WRONG_ROOM,
        severity: CONFLICT_SEVERITY.WARNING,
        lessonId: lesson.id,
        classId: lesson.class_id,
        className: lesson.class_name,
        roomId: lesson.room_id,
        roomName: lesson.room_name,
        assignedClassName: assignedClass?.name,
        dayName: lesson.day_name_de || lesson.day_name_en,
        blockNumber: lesson.block_number,
        lesson,
        message: createLocalizedMessage('classWrongRoom', { 
          class: lesson.class_name, 
          room: lesson.room_name, 
          assignedClass: assignedClass?.name 
        }, language)
      });
    }
  });

  return conflicts;
};

/**
 * Main conflict detection function
 */
export const detectConflicts = (draftLessons, teachers = [], classes = [], rooms = [], language = 'de') => {
  const allConflicts = [
    ...detectTeacherDoubleBooking(draftLessons, language),
    ...detectRoomDoubleBooking(draftLessons, language),
    ...detectClassDoubleBooking(draftLessons, language),
    ...detectTeacherOverload(draftLessons, teachers, language),
    ...detectRoomInactive(draftLessons, rooms, language),
    ...detectMissingData(draftLessons, language),
    ...detectClassWrongRoom(draftLessons, classes, rooms, language)
  ];

  // Sort conflicts by day and period
  allConflicts.sort((a, b) => {
    if (a.dayId !== b.dayId) {
      return (a.dayId || 0) - (b.dayId || 0);
    }
    return (a.blockNumber || 0) - (b.blockNumber || 0);
  });

  return allConflicts;
};

/**
 * Get conflicts for a specific lesson
 */
export const getConflictsForLesson = (lessonId, allConflicts) => {
  return allConflicts.filter(conflict => {
    // Direct lesson match
    if (conflict.lessonId === lessonId) return true;
    
    // Check if lesson is in conflict's lessons array
    if (conflict.lessons && conflict.lessons.some(l => l.id === lessonId)) return true;
    
    return false;
  });
};

/**
 * Get conflicts for a specific cell (day/period combination)
 */
export const getConflictsForCell = (dayId, periodId, allConflicts) => {
  return allConflicts.filter(conflict => 
    conflict.dayId === dayId && 
    (conflict.periodId === periodId || conflict.blockNumber === periodId)
  );
};

/**
 * Check if there are any blocking conflicts
 */
export const hasBlockingConflicts = (conflicts, ignoredConflicts = []) => {
  return conflicts.some(conflict => 
    conflict.severity === CONFLICT_SEVERITY.ERROR &&
    !ignoredConflicts.includes(conflict.id || `${conflict.type}-${conflict.lessonId}`)
  );
};

/**
 * Format conflict message for display
 */
export const formatConflictMessage = (conflict, language = 'de') => {
  const translations = {
    de: {
      [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Lehrer Doppelbelegung',
      [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Raum Doppelbelegung',
      [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Klasse Doppelbelegung',
      [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Lehrer Überlastung',
      [CONFLICT_TYPES.ROOM_INACTIVE]: 'Raum Inaktiv',
      [CONFLICT_TYPES.MISSING_DATA]: 'Fehlende Daten',
      [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Klasse im falschen Raum'
    },
    en: {
      [CONFLICT_TYPES.TEACHER_DOUBLE_BOOKING]: 'Teacher Double-booking',
      [CONFLICT_TYPES.ROOM_DOUBLE_BOOKING]: 'Room Double-booking',
      [CONFLICT_TYPES.CLASS_DOUBLE_BOOKING]: 'Class Double-booking',
      [CONFLICT_TYPES.TEACHER_OVERLOAD]: 'Teacher Overload',
      [CONFLICT_TYPES.ROOM_INACTIVE]: 'Room Inactive',
      [CONFLICT_TYPES.MISSING_DATA]: 'Missing Data',
      [CONFLICT_TYPES.CLASS_WRONG_ROOM]: 'Class in Wrong Room'
    }
  };

  const typeLabel = translations[language]?.[conflict.type] || conflict.type;
  return `${typeLabel}: ${conflict.message}`;
};