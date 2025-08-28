export interface Message {
  id: number;
  subject: string;
  content: string;
  sender: string;
  recipients: string[];
  sent_at: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: {
    day: number;
    month: string;
    year: number;
  };
  time?: string;
  location?: string;
  type: 'meeting' | 'holiday' | 'exam' | 'activity';
  rsvp?: 'attending' | 'maybe' | 'not_attending' | null;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}
