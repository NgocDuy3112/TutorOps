import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { href: "/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/schedule", label: "Lịch dạy", icon: CalendarDays },
  { href: "/students", label: "Học sinh", icon: Users },
  { href: "/classes", label: "Lớp học", icon: BookOpen },
  { href: "/tuition", label: "Học phí", icon: Wallet },
];
