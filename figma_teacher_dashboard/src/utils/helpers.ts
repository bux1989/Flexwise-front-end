export const getSubstituteLessons = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
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
    },
    {
      date: dayAfterTomorrow.toLocaleDateString('de-DE', { 
        weekday: 'long',
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      }),
      time: '09:00 - 09:45',
      class: 'Klasse 8B',
      subject: 'Geschichte',
      room: 'Raum 204',
      forTeacher: 'Dr. Hoffmann'
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
  const [endHours, endMinutes] = lessonEndTime.split(':').map(Number);
  
  const lessonStartTime = new Date();
  lessonStartTime.setHours(startHours, startMinutes, 0, 0);
  
  const lessonEnd = new Date();
  lessonEnd.setHours(endHours, endMinutes, 0, 0);
  
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

export const getTeacherAbbreviation = (teacherName: string): string => {
  // Create abbreviations for teacher names
  const abbreviations: { [key: string]: string } = {
    'Frau Müller': 'IMü',
    'Herr Schmidt': 'ISc',
    'Frau Weber': 'IWe',
    'Dr. Hoffmann': 'IHo',
    'Frau Klein': 'IKl',
    'Herr Meyer': 'IMe'
  };
  
  return abbreviations[teacherName] || teacherName;
};

export const createLessonNoteWithMetadata = (
  content: string,
  createdBy: string,
  createdAt: string,
  editedBy?: string,
  editedAt?: string
): string => {
  const createdByAbbr = getTeacherAbbreviation(createdBy);
  const editedByAbbr = editedBy ? getTeacherAbbreviation(editedBy) : '';
  
  let metadata = `**Klassenbuch-Eintrag**\n(${createdByAbbr}: ${createdAt}`;
  
  // Add "zuletzt:" if there's an edit
  if (editedBy && editedAt) {
    // Extract just the date part from timestamps for comparison
    const createdDate = createdAt.split(',')[0]; // "20.08.25"
    const editedDate = editedAt.split(',')[0]; // "21.08.25"
    
    if (createdDate === editedDate) {
      // Same date - only show time for "zuletzt:"
      const editedTime = editedAt.split(', ')[1]; // "17:39"
      metadata += `; zuletzt: ${editedByAbbr} ${editedTime}`;
    } else {
      // Different date - show full timestamp for "zuletzt:"
      metadata += `; zuletzt: ${editedByAbbr} ${editedAt}`;
    }
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
  
  // Check if it starts with our newest parentheses format
  if (lessonNote.startsWith('**Klassenbuch-Eintrag**\n(')) {
    // Find the end of metadata (double newline)
    const metadataEndIndex = lessonNote.indexOf('\n\n');
    if (metadataEndIndex !== -1) {
      const metadata = lessonNote.substring(0, metadataEndIndex);
      const content = lessonNote.substring(metadataEndIndex + 2); // +2 for '\n\n'
      return { content, metadata, hasMetadata: true };
    }
  }
  
  // Check if it starts with our previous compact metadata format
  if (lessonNote.startsWith('**Klassenbuch-Eintrag:**\n')) {
    // Find the end of metadata (double newline)
    const metadataEndIndex = lessonNote.indexOf('\n\n');
    if (metadataEndIndex !== -1) {
      const metadata = lessonNote.substring(0, metadataEndIndex);
      const content = lessonNote.substring(metadataEndIndex + 2); // +2 for '\n\n'
      return { content, metadata, hasMetadata: true };
    }
  }
  
  // Legacy format check
  if (lessonNote.startsWith('Klassenbuch-Eintrag\n')) {
    // Find the end of metadata (double newline after the colon)
    const metadataEndIndex = lessonNote.indexOf(':\n\n');
    if (metadataEndIndex !== -1) {
      const metadata = lessonNote.substring(0, metadataEndIndex + 1);
      const content = lessonNote.substring(metadataEndIndex + 3); // +3 for ':\n\n'
      return { content, metadata, hasMetadata: true };
    }
  }
  
  // If no metadata format found, treat entire content as content
  return { content: lessonNote, metadata: '', hasMetadata: false };
};