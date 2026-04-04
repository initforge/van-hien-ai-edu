/**
 * Shared string constants for API functions (backend only).
 * These mirror the frontend constants in src/lib/utils.ts for use
 * in SQL queries and API responses where runtime string matching is needed.
 */

/** Submission grading status */
export const SUBMISSION_STATUS = /** @type {const} */ ({
  PENDING: 'pending',
  AI_GRADED: 'ai_graded',
  RETURNED: 'returned',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
});
