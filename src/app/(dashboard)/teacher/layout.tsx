import Link from "next/link";
import { TeacherSidebar } from "./Sidebar";
import React from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-body text-on-surface bg-surface min-h-screen flex">
      {/* SideNavBar Shell */}
      <TeacherSidebar />

      {/* Main Canvas */}
      <main className="ml-72 min-h-screen bg-surface flex-1">
        {/* TopAppBar Shell */}
        <header className="fixed top-0 right-0 w-[calc(100%-18rem)] z-30 bg-[#f9f9f6]/80 backdrop-blur-xl flex justify-between items-center h-20 px-10 border-b border-outline-variant/15">
          <div className="flex items-center gap-8 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary rounded-full pl-10 pr-4 py-2 text-sm" placeholder="Tìm kiếm bài giảng, học sinh..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-outline">
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">notifications</span></button>
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">calendar_today</span></button>
              <button className="hover:text-primary transition-colors"><span className="material-symbols-outlined">chat_bubble</span></button>
            </div>
        </header>

        {/* Dashboard Content area */}
        <div className="pt-28 px-10 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
