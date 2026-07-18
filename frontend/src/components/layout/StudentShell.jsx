import { useState } from "react";
import {
  Bell,
  BookOpenCheck,
  ChevronDown,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Radio,
  School,
  X,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { useStudentData } from "../../app/StudentDataProvider.jsx";
import { gradeLabel } from "../../lib/academicCatalog.js";
import { Brand } from "../ui/Brand.jsx";

const navItems = [
  { to: "/student", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/student/path", label: "Lộ trình học", icon: Map },
  { to: "/student/content", label: "Nội dung", icon: BookOpenCheck },
  { to: "/student/ai-lessons", label: "Bài giảng của lớp", icon: GraduationCap },
  { to: "/student/classes", label: "Lớp học", icon: School },
  { to: "/student/community", label: "Cộng đồng", icon: Users },
];

function Navigation({ onNavigate }) {
  return (
    <nav className="mt-10 space-y-2" aria-label="Điều hướng học sinh">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-item ${isActive ? "nav-item-active" : "nav-item-idle"}`
          }
        >
          <Icon size={19} strokeWidth={2.3} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function StudentShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const { dashboard, realtimeStatus } = useStudentData();
  const { account, signOut } = useAuth();
  const gamification = dashboard?.gamification;
  const student = dashboard?.student;

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-slate-200 bg-white px-5 py-7 lg:flex lg:flex-col">
        <Brand />
        <Navigation />

        <div className="mt-auto rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800">
            <Radio size={15} aria-hidden="true" />
            AI Tutor có kiểm duyệt
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-700">
            Chỉ sử dụng bài học đã được giáo viên duyệt.
          </p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/30"
            aria-label="Đóng điều hướng"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative h-full w-[280px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                className="icon-button inline-grid"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Đóng menu"
                title="Đóng menu"
              >
                <X size={20} />
              </button>
            </div>
            <Navigation onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
          <button
            className="icon-button mr-3 inline-grid lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Mở menu"
            title="Mở menu"
          >
            <Menu size={21} />
          </button>
          <div className="lg:hidden">
            <Brand compact />
          </div>

          <div className="ml-4 hidden min-w-0 flex-1 items-center gap-4 sm:flex lg:ml-0">
            <div className="level-token">{gamification?.level || 1}</div>
            <div className="min-w-0 max-w-[620px] flex-1">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Cấp {gamification?.level || 1} · Nhà thám hiểm</span>
                <span className="tabular-nums">
                  {gamification?.totalExp?.toLocaleString("vi-VN") || 0} / {gamification?.nextLevelAt?.toLocaleString("vi-VN") || 500} XP
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-[width] duration-700"
                  style={{ width: `${gamification?.levelProgress || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div
              className={`hidden items-center gap-2 text-xs font-bold md:flex ${
                realtimeStatus === "connected" ? "text-emerald-700" : "text-slate-400"
              }`}
              title={realtimeStatus === "connected" ? "Đã đồng bộ realtime" : "Đang kết nối realtime"}
            >
              <span className={`h-2 w-2 rounded-full ${realtimeStatus === "connected" ? "bg-emerald-500" : "bg-slate-300"}`} />
              {realtimeStatus === "connected" ? "Đã đồng bộ" : "Ngoại tuyến"}
            </div>
            <div className="hidden items-center gap-1 rounded-full bg-orange-50 px-3 py-2 text-sm font-black text-orange-600 sm:flex">
              <Flame size={17} fill="currentColor" aria-hidden="true" />
              {gamification?.streak?.current_streak || 0}
            </div>
            <div className="relative">
              <button
                className="icon-button inline-grid"
                aria-label="Thông báo"
                title="Thông báo"
                aria-expanded={activePanel === "notifications"}
                onClick={() => setActivePanel((current) => current === "notifications" ? null : "notifications")}
              >
                <Bell size={20} />
              </button>
              {activePanel === "notifications" && (
                <div className="header-popover" role="status">
                  <p className="text-xs font-black uppercase text-slate-400">Thông báo mới</p>
                  <p className="mt-3 text-sm font-extrabold text-slate-800">Vòng lặp kỳ diệu đã sẵn sàng</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Bạn đã đủ điều kiện STEAM và hoàn thành node tiên quyết.</p>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-2"
                aria-label="Mở hồ sơ"
                title="Hồ sơ"
                aria-expanded={activePanel === "profile"}
                onClick={() => setActivePanel((current) => current === "profile" ? null : "profile")}
              >
                <div className="avatar">{student?.fullName?.charAt(0) || account?.fullName?.charAt(0) || "E"}</div>
                <div className="hidden text-left xl:block">
                  <div className="max-w-32 truncate text-sm font-extrabold">{student?.fullName || account?.fullName || "Đang tải"}</div>
                  <div className="text-xs text-slate-500">Học sinh</div>
                </div>
                <ChevronDown className="hidden text-slate-400 xl:block" size={15} />
              </button>
              {activePanel === "profile" && (
                <div className="header-popover">
                  <p className="text-xs font-black uppercase text-slate-400">Hồ sơ học tập</p>
                  <p className="mt-3 text-sm font-extrabold text-slate-900">{student?.fullName || account?.fullName || "Học sinh EduOne"}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{account?.email}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-700">{gradeLabel(account?.gradeLevel)}</p>
                  <button
                    type="button"
                    className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50"
                    onClick={signOut}
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-7 md:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
