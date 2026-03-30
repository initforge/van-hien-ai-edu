import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/admin/dashboard", icon: "dashboard" },
  { name: "Quản lý Người dùng", href: "/admin/users", icon: "manage_accounts" },
  { name: "Quản lý Lớp học", href: "/admin/classes", icon: "school" },
  { name: "Nhật ký Hoạt động", href: "/admin/logs", icon: "history" },
];

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="bg-[#0D1B2A] h-screen w-72 fixed left-0 top-0 overflow-y-auto z-40 flex flex-col py-8 justify-between shadow-2xl shadow-black/30">
      <div>
        <div className="px-8 mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Văn Học AI</h1>
          <p className="text-blue-100/40 text-xs tracking-widest uppercase mt-1">Quản trị Hệ thống</p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 backdrop-blur-md border-r-4 border-[#C9A84C] text-white font-semibold"
                    : "text-blue-100/50 hover:text-white hover:bg-white/5"
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
          <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-sm font-bold text-[#C9A84C]">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-sm font-bold text-white font-serif leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-blue-100/40 uppercase tracking-widest">Quản trị viên</p>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10 space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-blue-100/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-[10px] tracking-[0.2em] uppercase">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
