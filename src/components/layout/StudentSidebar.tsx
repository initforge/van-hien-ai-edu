import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, isActiveNav } from "./sidebarUtils";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/student/dashboard", icon: "dashboard" },
  { name: "Phòng thi", href: "/student/exam-room", icon: "history_edu" },
  { name: "Chat Nhân vật AI", href: "/student/character-chat", icon: "theater_comedy" },
  { name: "Đa Vũ Trụ", href: "/student/multiverse", icon: "hub" },
  { name: "Kết quả", href: "/student/results", icon: "workspace_premium" },
  { name: "Hồ sơ của tôi", href: "/student/profile", icon: "person" },
];

export function StudentSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f9f9f6] flex flex-col py-6 z-40 border-r border-outline-variant/10 shadow-[0_12px_40px_-10px_rgba(26,28,27,0.06)]">
      <div className="px-6 mb-10">
        <h1 className="font-headline italic text-xl text-[#003857] font-bold">Hành trình Văn học</h1>
        <p className="text-xs text-slate-500 font-label tracking-wider mt-1">{user?.name || 'Học sinh'}</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveNav(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors group ${
                isActive
                  ? "bg-[#1b4f72] text-white shadow-inner"
                  : "text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              <span
                className={`material-symbols-outlined mr-3 ${isActive ? "" : "text-slate-400 group-hover:text-primary"}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto space-y-2 border-t border-surface-container-high pt-6">
        <button
          onClick={logout}
          className="w-full bg-tertiary/10 text-tertiary py-3 rounded-lg font-bold mb-4 flex items-center justify-center gap-2 hover:bg-tertiary hover:text-white transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
