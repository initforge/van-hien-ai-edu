"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard, IconClass, IconLibrary, IconExam, IconGrading,
  IconCharacter, IconMultiverse, IconRubric, IconAnalytics,
  IconHome, IconAssignment, IconResults, IconChat, IconProfile, IconLogout, IconScroll
} from "@/components/ui/Icons";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  dashboard: IconDashboard,
  class: IconClass,
  library: IconLibrary,
  exam: IconExam,
  grading: IconGrading,
  character: IconCharacter,
  multiverse: IconMultiverse,
  rubric: IconRubric,
  analytics: IconAnalytics,
  home: IconHome,
  assignment: IconAssignment,
  results: IconResults,
  chat: IconChat,
  profile: IconProfile,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

interface SidebarProps {
  items: NavItem[];
  userName?: string;
  userRole?: string;
}

export default function Sidebar({ items, userName, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 pb-6 mb-2">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-white">
          <IconScroll size={22} className="text-gold" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem" }}>
            Văn Học AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const IconComp = iconMap[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              {IconComp && <IconComp size={18} />}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-[#A93226] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {userName && (
        <div className="mt-auto px-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{userName}</div>
              {userRole && <div className="text-xs text-white/50">{userRole}</div>}
            </div>
            <button className="text-white/40 hover:text-white transition-colors" title="Đăng xuất">
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
