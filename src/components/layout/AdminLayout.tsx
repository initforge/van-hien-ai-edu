import React from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="font-body text-on-surface bg-surface min-h-screen flex">
      <AdminSidebar />
      <main className="ml-72 min-h-screen bg-surface flex-1">
        <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-30 bg-[#1B4F72]/90 backdrop-blur-xl flex justify-between items-center h-20 px-10 border-b border-white/10">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/50">search</span>
              <input className="w-full bg-white/10 border-none focus:ring-1 focus:ring-white/30 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/40" placeholder="Tìm kiếm..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <button className="hover:text-white transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          </div>
        </header>
        <div className="pt-28 px-10 pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
