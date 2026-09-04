import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () =>
  uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const userRole = pgEnum("user_role", ["teacher", "admin"]);
export const submissionMode = pgEnum("submission_mode", [
  "teacher_managed",
  "self_submit",
]);
export const accessTokenType = pgEnum("access_token_type", [
  "student",
  "parent",
]);
export const paymentStatus = pgEnum("payment_status", [
  "draft",
  "needs_confirmation",
  "confirmed",
  "rejected",
]);
export const studentAssignmentStatus = pgEnum("student_assignment_status", [
  "pending",
  "submitted",
  "reviewed",
  "rejected",
]);
export const submittedBy = pgEnum("submitted_by", ["teacher", "student"]);

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRole("role").default("teacher").notNull(),
  ...timestamps,
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: text("provider").default("google").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    ...timestamps,
  },
  (table) => [unique().on(table.provider, table.providerAccountId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => [index().on(table.userId, table.expiresAt)],
);

export const students = pgTable(
  "students",
  {
    id: id(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    defaultPriceVnd: bigint("default_price_vnd", { mode: "number" })
      .default(0)
      .notNull(),
    submissionMode: submissionMode("submission_mode")
      .default("self_submit")
      .notNull(),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.teacherId, table.id),
    index("students_teacher_active_idx")
      .on(table.teacherId)
      .where(sql`${table.deletedAt} IS NULL`),
    check("students_price_non_negative", sql`${table.defaultPriceVnd} >= 0`),
  ],
);

export const classes = pgTable(
  "classes",
  {
    id: id(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    subject: text("subject"),
    defaultPriceVnd: bigint("default_price_vnd", { mode: "number" }),
    note: text("note"),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.teacherId, table.name),
    unique().on(table.teacherId, table.id),
    index("classes_teacher_active_idx")
      .on(table.teacherId)
      .where(sql`${table.deletedAt} IS NULL`),
    check(
      "classes_price_non_negative",
      sql`${table.defaultPriceVnd} IS NULL OR ${table.defaultPriceVnd} >= 0`,
    ),
  ],
);

export const classStudents = pgTable(
  "class_students",
  {
    classId: uuid("class_id").notNull(),
    studentId: uuid("student_id").notNull(),
    teacherId: uuid("teacher_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.classId, table.studentId] }),
    foreignKey({
      columns: [table.teacherId, table.classId],
      foreignColumns: [classes.teacherId, classes.id],
    }),
    foreignKey({
      columns: [table.teacherId, table.studentId],
      foreignColumns: [students.teacherId, students.id],
    }),
    index("class_students_student_idx").on(table.studentId),
  ],
);

export const accessTokens = pgTable(
  "access_tokens",
  {
    id: id(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    tokenType: accessTokenType("token_type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index().on(table.studentId, table.tokenType)],
);

export const teachingSessions = pgTable(
  "teaching_sessions",
  {
    id: id(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    taughtAt: timestamp("taught_at", { withTimezone: true }).notNull(),
    priceVnd: bigint("price_vnd", { mode: "number" }).notNull(),
    note: text("note"),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index().on(table.studentId, table.taughtAt),
    check("teaching_sessions_price_non_negative", sql`${table.priceVnd} >= 0`),
  ],
);

export const sessionLessons = pgTable(
  "session_lessons",
  {
    teachingSessionId: uuid("teaching_session_id")
      .notNull()
      .references(() => teachingSessions.id, { onDelete: "restrict" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.teachingSessionId, table.lessonId] }),
    index("session_lessons_lesson_idx").on(table.lessonId),
  ],
);

export const sessionFiles = pgTable(
  "session_files",
  {
    teachingSessionId: uuid("teaching_session_id")
      .notNull()
      .references(() => teachingSessions.id, { onDelete: "restrict" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.teachingSessionId, table.fileId] }),
    index("session_files_session_idx").on(table.teachingSessionId),
  ],
);

export const files = pgTable(
  "files",
  {
    id: id(),
    storageKey: text("storage_key").notNull().unique(),
    originalName: text("original_name"),
    mimeType: text("mime_type").notNull(),
    extension: text("extension"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksum: text("checksum"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "files_size_limit",
      sql`${table.sizeBytes} > 0 AND ${table.sizeBytes} <= 20971520`,
    ),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.teacherId, table.id),
    index("lessons_teacher_active_idx")
      .on(table.teacherId)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const lessonFiles = pgTable(
  "lesson_files",
  {
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.lessonId, table.fileId] })],
);

export const assignments = pgTable(
  "assignments",
  {
    id: id(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    lessonId: uuid("lesson_id"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    classIds: jsonb("class_ids").default("[]").notNull(),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.teacherId, table.id),
    foreignKey({
      columns: [table.teacherId, table.lessonId],
      foreignColumns: [lessons.teacherId, lessons.id],
    }),
    index()
      .on(table.teacherId)
      .where(sql`${table.deletedAt} IS NULL`),
    index("assignments_lesson_idx").on(table.lessonId),
  ],
);

export const studentAssignments = pgTable(
  "student_assignments",
  {
    id: id(),
    assignmentId: uuid("assignment_id").notNull(),
    studentId: uuid("student_id").notNull(),
    teacherId: uuid("teacher_id").notNull(),
    status: studentAssignmentStatus("status").default("pending").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    ...timestamps,
  },
  (table) => [
    unique().on(table.assignmentId, table.studentId),
    foreignKey({
      columns: [table.teacherId, table.assignmentId],
      foreignColumns: [assignments.teacherId, assignments.id],
    }),
    foreignKey({
      columns: [table.teacherId, table.studentId],
      foreignColumns: [students.teacherId, students.id],
    }),
    index().on(table.studentId, table.status),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    studentAssignmentId: uuid("student_assignment_id")
      .notNull()
      .references(() => studentAssignments.id, { onDelete: "restrict" }),
    submittedBy: submittedBy("submitted_by").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    attemptNo: integer("attempt_no").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique().on(table.studentAssignmentId, table.attemptNo),
    check("submissions_attempt_positive", sql`${table.attemptNo} > 0`),
  ],
);

export const assignmentFiles = pgTable(
  "assignment_files",
  {
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.assignmentId, table.fileId] })],
);

export const submissionFiles = pgTable(
  "submission_files",
  {
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "restrict" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.submissionId, table.fileId] })],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    amountVnd: bigint("amount_vnd", { mode: "number" }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    appliesToMonth: text("applies_to_month").notNull(),
    status: paymentStatus("status").default("draft").notNull(),
    receiptFileId: uuid("receipt_file_id").references(() => files.id, {
      onDelete: "restrict",
    }),
    ocrDetectedAmountVnd: bigint("ocr_detected_amount_vnd", { mode: "number" }),
    ocrConfidence: numeric("ocr_confidence"),
    confirmedBy: uuid("confirmed_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index().on(table.studentId, table.paidAt),
    index().on(table.studentId, table.appliesToMonth),
    check("payments_amount_positive", sql`${table.amountVnd} > 0`),
    check(
      "payments_applies_to_month_format",
      sql`${table.appliesToMonth} ~ '^\\d{4}-(0[1-9]|1[0-2])$'`,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
}));
export const studentsRelations = relations(students, ({ one, many }) => ({
  teacher: one(users, { fields: [students.teacherId], references: [users.id] }),
  sessions: many(teachingSessions),
  assignments: many(studentAssignments),
  payments: many(payments),
}));
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  teacher: one(users, {
    fields: [assignments.teacherId],
    references: [users.id],
  }),
  students: many(studentAssignments),
  files: many(assignmentFiles),
}));
export const studentAssignmentsRelations = relations(
  studentAssignments,
  ({ one, many }) => ({
    assignment: one(assignments, {
      fields: [studentAssignments.assignmentId],
      references: [assignments.id],
    }),
    student: one(students, {
      fields: [studentAssignments.studentId],
      references: [students.id],
    }),
    submissions: many(submissions),
  }),
);
