export type AttendanceTab = 'scheduled' | 'completed';

export type AttendanceStatus = 'waiting' | 'done';

export type AttendanceUrgency = 'normal' | 'urgent' | 'emergency';

export interface AttendanceItem {
  id: string;
  patientName: string;
  protocol: string;
  exams: readonly string[];
  urgency: AttendanceUrgency;
  status: AttendanceStatus;
  scheduledAt: string;
  completedAt?: string;
}

export interface AttendanceTabCounts {
  scheduled: number;
  completed: number;
}
