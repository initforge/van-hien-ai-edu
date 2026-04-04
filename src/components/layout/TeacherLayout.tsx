import React from "react";
import { Outlet } from "react-router-dom";
import { TeacherSidebar } from "./TeacherSidebar";

export default function TeacherLayout() {
  return (
    <div className="font-body text-on-surface bg-surface min-h-screen flex">
      <TeacherSidebar />
      <main className="ml-72 min-h-screen bg-surface flex-1">
        {/* TopAppBar Shell */}
        <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-30 bg-[#f9f9f6]/80 backdrop-blur-xl flex justify-end items-center h-20 px-10 border-b border-outline-variant/15">
          <div className="flex items-center gap-4 text-outline">
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">notifications</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">calendar_today</span></button>
            <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">chat_bubble</span></button>
          </div>
        </header>
        <div className="pt-28 px-10 pb-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
