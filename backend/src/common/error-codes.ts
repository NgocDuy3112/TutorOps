/**
 * Machine-readable error codes — single source of truth.
 * Sent to clients as `message` and used for log lookups.
 * User-facing Vietnamese text lives in `frontend/src/lib/messages.ts`.
 */
export const ErrorCodes = {
  // Auth / access
  UNAUTHORIZED: "unauthorized",
  INVALID_CREDENTIALS: "invalid_credentials",
  INVALID_PASSWORD: "invalid_password",
  EMAIL_ALREADY_EXISTS: "email_already_exists",
  INVALID_OAUTH_STATE: "invalid_oauth_state",
  MISSING_GOOGLE_ID_TOKEN: "missing_google_id_token",
  INVALID_GOOGLE_IDENTITY: "invalid_google_identity",
  INVALID_TOKEN_TYPE: "invalid_token_type",
  INVALID_ACCESS_TOKEN: "invalid_access_token",

  // Assignments / submissions
  INVALID_ASSIGNMENT: "invalid_assignment",
  ASSIGNMENT_NOT_FOUND: "assignment_not_found",
  ASSIGNMENT_TARGET_REQUIRED: "assignment_target_required",
  PAST_DEADLINE_NOT_ALLOWED: "past_deadline_not_allowed",
  INVALID_STATUS: "invalid_status",
  SUBMISSION_NOT_FOUND: "submission_not_found",
  SUBMISSION_OR_STUDENT_NOT_FOUND: "submission_or_student_not_found",
  FILES_REQUIRED: "files_required",
  FILE_NOT_FOUND: "file_not_found",
  INVALID_FILE: "invalid_file",
  INVALID_SCORE_STEP: "invalid_score_step",

  // Classes / students
  CLASS_NOT_FOUND: "class_not_found",
  CLASS_OR_STUDENT_NOT_FOUND: "class_or_student_not_found",
  CLASS_STUDENT_NOT_FOUND: "class_student_not_found",
  STUDENT_NOT_FOUND: "student_not_found",

  // Sessions
  INVALID_TEACHING_SESSION: "invalid_teaching_session",
  SESSION_NOT_FOUND: "session_not_found",
  FUTURE_SESSION_NOT_ALLOWED: "future_session_not_allowed",

  // Payments / tuition
  PAYMENT_NOT_FOUND: "payment_not_found",
  MONTH_MUST_BE_YYYY_MM: "month_must_be_yyyy_mm",

  // Misc
  INVALID_PUSH_SUBSCRIPTION: "invalid_push_subscription",
  INVALID_RECEIPT_IMAGE: "invalid_receipt_image",
  INTERNAL_ERROR: "internal_error",
} as const;
