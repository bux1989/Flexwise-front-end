// Lesson scheduling hooks for Stundenplan module
import { useState, useEffect } from 'react';

export interface SubstituteLesson {
  date: string;
  time: string;
  class: string;
  subject: string;
  room: string;
  forTeacher: string;
}

// Custom hooks for scheduling functionality
export function useSubstituteLessons(): SubstituteLesson[] {
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
}

// Mobile-specific helper functions for scheduling
export function useMobileSubjectAbbreviation(subject: string): string {
  const abbreviations: Record<string, string> = {
    'Mathematik': 'Ma',
    'Deutsch': 'De',
    'Englisch': 'En',
    'Französisch': 'Fr',
    'Spanisch': 'Sp',
    'Geschichte': 'Ge',
    'Erdkunde': 'Ek',
    'Biologie': 'Bio',
    'Chemie': 'Ch',
    'Physik': 'Ph',
    'Sport': 'Sp',
    'Kunst': 'Ku',
    'Musik': 'Mu',
    'Religion': 'Re',
    'Ethik': 'Et',
    'Politik': 'Pol',
    'Wirtschaft': 'Wi',
    'Informatik': 'If'
  };
  
  return abbreviations[subject] || subject;
}

export function useMobileTeacherAbbreviation(teacherName: string): string {
  if (!teacherName) return '';
  
  // Extract first letter of first name and first 2-3 letters of last name
  const parts = teacherName.split(' ');
  if (parts.length < 2) return teacherName;
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  const firstInitial = firstName.charAt(0);
  const lastNameAbbrev = lastName.length > 3 ? lastName.substring(0, 3) : lastName;
  
  return `${firstInitial}.${lastNameAbbrev}`;
}

export function useTeacherAbbreviation(teacherName: string): string {
  // Same as mobile version for consistency
  return useMobileTeacherAbbreviation(teacherName);
}

// Lesson status helpers
export function useLessonStatus(startTime: Date, endTime: Date) {
  const [isCurrent, setIsCurrent] = useState(false);
  const [isUpcoming, setIsUpcoming] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
      
      setIsCurrent(now >= startTime && now <= endTime);
      setIsUpcoming(startTime > now && startTime <= thirtyMinutesFromNow);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return { isCurrent, isUpcoming };
}

export function useLessonStatusColor(
  isCurrent: boolean,
  isUpcoming: boolean,
  isSubstitute: boolean,
  isCancelled: boolean
): string {
  if (isCancelled) return 'bg-red-50';
  if (isCurrent) return 'bg-blue-50 border-l-4 border-blue-400';
  if (isUpcoming) return 'bg-yellow-50';
  if (isSubstitute) return 'bg-purple-50';
  return 'bg-gray-50';
}
