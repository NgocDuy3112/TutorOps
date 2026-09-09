export type DashboardCalendarTeacherDto = {
  id: string;
  email: string;
  fullName: string | null;
};

export type DashboardCalendarStudentDto = {
  id: string;
  name: string;
};

export type DashboardCalendarSessionDto = {
  id: string;
  studentId: string;
  studentName: string;
  taughtAt: string;
  priceVnd: number;
  status: string;
  note: string | null;
};

export type DashboardCalendarAssignmentStudentDto = {
  id: string;
  name: string;
  status: string;
};

export type DashboardCalendarAssignmentDto = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  studentCount: number;
  students: DashboardCalendarAssignmentStudentDto[];
};

export type DashboardCalendarDto = {
  teacher: DashboardCalendarTeacherDto;
  students: DashboardCalendarStudentDto[];
  sessions: DashboardCalendarSessionDto[];
  assignments: DashboardCalendarAssignmentDto[];
};

export type OverviewTodaySessionDto = {
  id: string;
  studentId: string;
  studentName: string;
  taughtAt: string;
  endsAt: string | null;
  priceVnd: number;
  status: string;
};

export type OverviewDeadlineDto = {
  id: string;
  title: string;
  dueAt: string;
  studentCount: number;
};

export type OverviewDebtorDto = {
  id: string;
  name: string;
  balance: number;
};

export type DashboardOverviewDto = {
  classCount: number;
  sessionsThisMonth: number;
  sessionsLastMonth: number;
  paidThisMonth: number;
  paidLastMonth: number;
  outstanding: number;
  debtCount: number;
  todaySessions: OverviewTodaySessionDto[];
  upcomingDeadlines: OverviewDeadlineDto[];
  topDebtors: OverviewDebtorDto[];
};
