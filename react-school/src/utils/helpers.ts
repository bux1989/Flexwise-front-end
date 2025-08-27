export const getSubstituteLessons = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return [
    {
      date: tomorrow.toLocaleDateString('de-DE', { 
        weekday: 'long',
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      }),
      time: '13:30 - 14:15',
      class: 'Klasse 9A',
      subject: 'Deutsch',
      room: 'Raum 112',
      forTeacher: 'Frau Weber'
    }
  ];
};

export const getPriorityValue = (priority: string) => {
  switch (priority) {
    case 'urgent': return 3;
    case 'high': return 2;
    case 'medium': return 1;
    default: return 0;
  }
};

export const needsAttendanceTracking = (lessonTime: string, lessonEndTime: string, selectedDate: Date, isCurrent: boolean = false) => {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  if (!isToday) return false;
  
  const currentTime = new Date();
  const [startHours, startMinutes] = lessonTime.split(':').map(Number);
  
  const lessonStartTime = new Date();
  lessonStartTime.setHours(startHours, startMinutes, 0, 0);
  
  if (isCurrent) {
    return true;
  }
  
  return currentTime >= lessonStartTime;
};

export const getAttendanceStatus = (lesson: any) => {
  if (!lesson.attendance) return 'none';
  
  const { present, late, absent } = lesson.attendance;
  const recordedAttendance = present.length + late.length + absent.length;
  
  if (recordedAttendance === 0) return 'none';
  if (recordedAttendance === lesson.enrolled) return 'complete';
  return 'incomplete';
};

export const getAttendanceSummary = (lesson: any) => {
  if (!lesson.attendance) return null;
  const { present, late, absent } = lesson.attendance;
  return {
    present: present.length,
    late: late.length,
    absent: absent.length
  };
};

export const getAttendanceNumbers = (lesson: any) => {
  const preExistingAbsentCount = lesson.preExistingAbsences?.length || 0;
  
  if (!lesson.attendance) {
    return {
      potentialPresent: lesson.enrolled - preExistingAbsentCount,
      absent: preExistingAbsentCount,
      present: 0,
      missing: 0
    };
  }
  
  const { present, late, absent } = lesson.attendance;
  const recordedPresent = present.length + late.length;
  const recordedAbsent = absent.length;
  const missing = lesson.enrolled - recordedPresent - recordedAbsent;
  
  return {
    present: recordedPresent,
    missing: missing,
    absent: recordedAbsent,
    potentialPresent: lesson.enrolled - recordedAbsent
  };
};

export const formatDateTime = (includeTime: boolean = true) => {
  const currentDate = new Date();
  return currentDate.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  });
};

export const formatTimestamp = () => {
  return new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCompactTimestamp = () => {
  return new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit', 
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const createLessonNoteWithMetadata = (
  content: string,
  createdBy: string,
  createdAt: string,
  editedBy?: string,
  editedAt?: string
): string => {
  let metadata = `**Klassenbuch-Eintrag**\n(${createdBy}: ${createdAt}`;
  
  if (editedBy && editedAt) {
    metadata += `; zuletzt: ${editedBy} ${editedAt}`;
  }
  
  metadata += ')';
  
  return `${metadata}\n\n${content}`;
};

export const parseLessonNote = (lessonNote: string): {
  content: string;
  metadata: string;
  hasMetadata: boolean;
} => {
  if (!lessonNote) {
    return { content: '', metadata: '', hasMetadata: false };
  }
  
  // Simple parsing for metadata
  if (lessonNote.startsWith('**Klassenbuch-Eintrag**')) {
    const lines = lessonNote.split('\n');
    const metadataEnd = lines.findIndex((line, index) => index > 0 && line === '');
    
    if (metadataEnd > 0) {
      const metadata = lines.slice(0, metadataEnd).join('\n');
      const content = lines.slice(metadataEnd + 1).join('\n');
      return { content, metadata, hasMetadata: true };
    }
  }
  
  return { content: lessonNote, metadata: '', hasMetadata: false };
};
