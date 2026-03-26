// Custom SVG icons for Văn Học AI — replacing all emoji with proper design icons
// Designed to work with currentColor for easy theming

import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

const Icon = ({ children, size = 20, className = "" }: IconProps & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const IconDashboard = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>
);

export const IconClass = (p: IconProps) => (
  <Icon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Icon>
);

export const IconLibrary = (p: IconProps) => (
  <Icon {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></Icon>
);

export const IconExam = (p: IconProps) => (
  <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>
);

export const IconGrading = (p: IconProps) => (
  <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>
);

export const IconCharacter = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></Icon>
);

export const IconMultiverse = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><line x1="6" y1="7" x2="10" y2="10"/><line x1="18" y1="7" x2="14" y2="10"/><line x1="6" y1="17" x2="10" y2="14"/><line x1="18" y1="17" x2="14" y2="14"/></Icon>
);

export const IconRubric = (p: IconProps) => (
  <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>
);

export const IconAnalytics = (p: IconProps) => (
  <Icon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>
);

export const IconHome = (p: IconProps) => (
  <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>
);

export const IconAssignment = (p: IconProps) => (
  <Icon {...p}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></Icon>
);

export const IconResults = (p: IconProps) => (
  <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>
);

export const IconChat = (p: IconProps) => (
  <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>
);

export const IconProfile = (p: IconProps) => (
  <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>
);

export const IconScroll = (p: IconProps) => (
  <Icon {...p}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/></Icon>
);

export const IconStar = (p: IconProps) => (
  <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/></Icon>
);

export const IconAI = (p: IconProps) => (
  <Icon {...p}><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4h-1l-3 6-3-6H8a4 4 0 0 1-4-4v-2a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>
);

export const IconClock = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>
);

export const IconFilter = (p: IconProps) => (
  <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Icon>
);

export const IconSend = (p: IconProps) => (
  <Icon {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Icon>
);

export const IconFire = (p: IconProps) => (
  <Icon {...p}><path d="M12 22c4-3.5 6-7.5 6-11a6 6 0 0 0-12 0c0 3.5 2 7.5 6 11z" fill="currentColor" stroke="none"/></Icon>
);

export const IconAward = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89l1.523 8.11-5-3-5 3 1.523-8.11"/></Icon>
);

export const IconEye = (p: IconProps) => (
  <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>
);

export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Icon>
);

export const IconLogout = (p: IconProps) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>
);

export const IconBranch = (p: IconProps) => (
  <Icon {...p}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v6a3 3 0 0 0 3 3h6"/><line x1="18" y1="9" x2="18" y2="15"/></Icon>
);

export const IconSparkle = (p: IconProps) => (
  <Icon {...p}><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" fill="currentColor" stroke="none" /></Icon>
);
