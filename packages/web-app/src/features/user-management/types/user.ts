export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'teacher' | 'parent' | 'external';
  created_at: string;
  last_login?: string;
  active: boolean;
}

export interface Teacher extends User {
  role: 'teacher';
  subjects: string[];
  classes: string[];
}

export interface Parent extends User {
  role: 'parent';
  children: Student[];
}

export interface Student {
  id: number;
  name: string;
  class: string;
  parent_ids: number[];
}

export interface SystemStats {
  total_students: number;
  total_teachers: number;
  total_parents: number;
  active_sessions: number;
  system_health: string;
}
