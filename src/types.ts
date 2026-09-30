export type ReportStatus = 'approved' | 'rejected' | 'pending';

export interface User {
  nickname: string;
  staticId: string;
  discord: string;
  password?: string;
  role?: 'superadmin' | 'admin' | 'senior_instructor' | 'instructor';
  rank?: string;
  callsign?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Report {
  id: string;
  userId: string; // Static ID
  nickname: string;
  discord: string;
  date: string; // ISO date string
  
  // 4 Official Department Categories
  checkedReports: number; // Проверенный отчёт на повышение — 3 балла
  gatherings: number;     // Сборы людей на бизаки, тайники и т.д — 15 баллов
  arrests: number;        // Задержание — 2 балла
  events: number;         // Присутствие на мероприятии от фракции — 10 баллов

  // Legacy compatibility fallbacks
  gathered?: number;
  checked?: number;
  trainings?: number;

  proofUrl?: string;
  notes?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface WeeklyArchive {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  closedBy: string;
  closedAt: string;
  reportsCount: number;
  totalPoints: number;
  totalCheckedReports: number;
  totalGatherings: number;
  totalArrests: number;
  totalEvents: number;
  archivedReports: Report[];
  instructorSummary: {
    nickname: string;
    staticId: string;
    discord: string;
    points: number;
    reportsCount: number;
    checkedReports: number;
    gatherings: number;
    arrests: number;
    events: number;
  }[];
}

export type ActiveTab = 'new' | 'history' | 'instructors' | 'analytics' | 'admin' | 'archive';

export type ThemeMode = 'dark' | 'light' | 'system';
