import React from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="font-body text-on-surface bg-surface min-h-screen flex">
      <AdminSidebar />
      <main className="ml-72 min-h-screen bg-surface flex-1">
        <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-30 bg-[#1B4F72]/90 backdrop-blur-xl flex justify-end items-center h-20 px-10 border-b border-white/10">
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
