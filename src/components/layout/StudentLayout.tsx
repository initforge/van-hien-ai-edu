import React from "react";
import { Outlet } from "react-router-dom";
import { StudentSidebar } from "./StudentSidebar";

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      <StudentSidebar />
      <main className="ml-64 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
