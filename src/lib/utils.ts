/**
 * Formats an ISO timestamp as a relative "X phút/giờ trước" string.
 */
export function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
}

/**
 * Formats an ISO timestamp for log display (dd/mm/yyyy, hh:mm).
 */
export function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}

/** Shared CSS token for filled icon variant */
export const FILL_SETTINGS = { fontVariationSettings: "'FILL' 1" } as const;

/** Submission status constants */
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  AI_GRADED: 'ai_graded',
  RETURNED: 'returned',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
} as const;

/** Work status constants */
export const WORK_STATUS = {
  ANALYZED: 'analyzed',
  PENDING: 'pending',
} as const;
