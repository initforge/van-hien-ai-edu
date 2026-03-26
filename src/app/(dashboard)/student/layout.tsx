import React from 'react';
import Link from 'next/link';

import { StudentSidebar } from './Sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      {/* SideNavBar (Shared Component Identity) */}
      <StudentSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Top Header can be injected here if needed, but the original HTML didn't have a global one for Student. We just render children. */}
        {children}
      </main>
    </div>
  );
}
