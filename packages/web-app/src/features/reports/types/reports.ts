export interface Report {
  id: number;
  title: string;
  description: string;
  type: 'attendance' | 'performance' | 'system' | 'custom';
  generated_by: string;
  generated_at: string;
  data: any;
  access_level: 'admin' | 'teacher' | 'parent' | 'external';
}

export interface SystemStatistics {
  total_students: number;
  total_teachers: number;
  total_parents: number;
  active_sessions: number;
  system_health: 'excellent' | 'good' | 'warning' | 'critical';
  last_updated: string;
}

export interface AttendanceStats {
  overall_rate: number;
  by_class: { [className: string]: number };
  by_month: { [month: string]: number };
  trends: 'improving' | 'declining' | 'stable';
}
