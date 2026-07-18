import { useEffect, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  School,
  X,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../../app/AuthProvider.jsx";
import { connectRealtime } from "../../lib/realtimeClient.js";
import { Brand } from "../ui/Brand.jsx";

const navItems = [
  { to: "/teacher", label: "Lớp học", icon: School, end: true },
];

function Navigation({ onNavigate }) {
  return (
    <nav className="mt-10 space-y-2" aria-label="Điều hướng giáo viên">
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

export function TeacherShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { account, session, signOut } = useAuth();
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");

  useEffect(() => {
    if (!session?.access_token) return undefined;
    const socket = connectRealtime(session.access_token);
    socket.on("connect", () => setRealtimeStatus("connected"));
    socket.on("disconnect", () => setRealtimeStatus("offline"));
    socket.on("connect_error", () => setRealtimeStatus("offline"));
    socket.on("class.membership.updated", (detail) => {
      window.dispatchEvent(new CustomEvent("eduone:class-membership-updated", { detail }));
    });
    return () => socket.close();
  }, [session?.access_token]);

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-slate-200 bg-white px-5 py-7 lg:flex lg:flex-col">
        <Brand />
        <Navigation />
        <div className="mt-auto border-t border-slate-100 pt-5">
          <p className="text-xs font-black uppercase text-slate-400">Không gian giáo viên</p>
          <p className="mt-2 truncate text-sm font-extrabold text-slate-800">{account?.fullName}</p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/30" aria-label="Đóng điều hướng" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative h-full w-[280px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button className="icon-button inline-grid" onClick={() => setMobileNavOpen(false)} aria-label="Đóng menu" title="Đóng menu"><X size={20} /></button>
            </div>
            <Navigation onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
          <button className="icon-button mr-3 inline-grid lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Mở menu" title="Mở menu"><Menu size={21} /></button>
          <div className="lg:hidden"><Brand compact /></div>
          <div className="ml-4 hidden sm:block lg:ml-0">
            <p className="text-xs font-black uppercase text-emerald-700">EduOne Teacher</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Quản lý lớp phụ trách</p>
          </div>

          <div className={`ml-auto hidden items-center gap-2 text-xs font-bold md:flex ${realtimeStatus === "connected" ? "text-emerald-700" : "text-slate-400"}`}>
            <span className={`h-2 w-2 rounded-full ${realtimeStatus === "connected" ? "bg-emerald-500" : "bg-slate-300"}`} />
            {realtimeStatus === "connected" ? "Đã đồng bộ" : "Ngoại tuyến"}
          </div>

          <div className="relative ml-auto md:ml-5">
            <button className="flex items-center gap-2" aria-label="Mở hồ sơ giáo viên" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
              <div className="avatar bg-emerald-700">{account?.fullName?.charAt(0) || "G"}</div>
              <div className="hidden text-left sm:block">
                <p className="max-w-40 truncate text-sm font-extrabold">{account?.fullName || "Giáo viên"}</p>
                <p className="text-xs text-slate-500">Giáo viên</p>
              </div>
              <ChevronDown className="hidden text-slate-400 sm:block" size={15} />
            </button>
            {profileOpen && (
              <div className="header-popover">
                <p className="text-xs font-black uppercase text-slate-400">Tài khoản giáo viên</p>
                <p className="mt-3 truncate text-sm font-extrabold text-slate-900">{account?.fullName}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{account?.email}</p>
                <button type="button" className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={signOut}>
                  <LogOut size={16} />Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-7 md:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
