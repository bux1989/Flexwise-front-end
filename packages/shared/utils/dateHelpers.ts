// Shared date and time utility functions

export const formatDateTime = (includeTime: boolean = true): string => {
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

export const formatTimestamp = (): string => {
  return new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCompactTimestamp = (): string => {
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
