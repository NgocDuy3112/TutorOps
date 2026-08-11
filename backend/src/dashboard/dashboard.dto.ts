export type DashboardCalendarTeacherDto = {
  id: string;
  email: string;
  fullName: string | null;
};

export type DashboardCalendarStudentDto = {
  id: string;
  name: string;
  defaultPriceVnd: number;
};

export type DashboardCalendarSessionDto = {
  id: string;
  studentId: string;
  studentName: string;
  taughtAt: string;
  priceVnd: number;
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
