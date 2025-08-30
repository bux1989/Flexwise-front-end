// Shared utilities index
export * from './attendanceHelpers'
export * from './lessonHelpers'

// General utility functions
export const getPriorityValue = (priority: string): number => {
  switch (priority) {
    case 'urgent': return 3;
    case 'high': return 2;
    case 'medium': return 1;
    default: return 0;
  }
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
