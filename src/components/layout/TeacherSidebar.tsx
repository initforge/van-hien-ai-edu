import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, isActiveNav } from "./sidebarUtils";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/teacher/dashboard", icon: "dashboard" },
  { name: "Lớp học", href: "/teacher/classes", icon: "school" },
  { name: "Thư viện Tác phẩm", href: "/teacher/library", icon: "auto_stories" },
  { name: "Ngân hàng Đề", href: "/teacher/exam-bank", icon: "quiz" },
  { name: "Chấm bài", href: "/teacher/grading", icon: "history_edu" },
  { name: "Nhân vật AI", href: "/teacher/characters", icon: "psychology" },
  { name: "Phân tích AI", href: "/teacher/ai-review", icon: "analytics" },
  { name: "Đa Vũ Trụ", href: "/teacher/multiverse", icon: "hub" },
];

export function TeacherSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="bg-[#1B4F72] dark:bg-[#002842] h-screen w-72 fixed left-0 top-0 overflow-y-auto z-40 flex flex-col py-8 justify-between shadow-2xl shadow-blue-900/20">
      <div>
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white font-headline">Văn Học AI</h1>
          <p className="text-blue-100/60 text-xs tracking-widest uppercase mt-1">Quản Trị Giáo Viên</p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = isActiveNav(pathname, item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 backdrop-blur-md border-r-4 border-[#C9A84C] text-white font-semibold"
                    : "text-blue-100/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className="text-xs tracking-widest uppercase">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-6 space-y-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'T'}
          </div>
          <div>
            <p className="text-sm font-bold text-white font-headline leading-tight">{user?.name || 'Giáo viên'}</p>
            <p className="text-[10px] text-blue-100/60 uppercase tracking-widest">Giáo viên Ngữ Văn</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10 space-y-1">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-blue-100/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-[10px] tracking-[0.2em] uppercase">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
