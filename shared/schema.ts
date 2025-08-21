import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp, 
  uuid,
  jsonb,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - handles both teachers and students
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique(), // NULL for students
  role: varchar("role", { length: 20 }).notNull().$type<'teacher' | 'student' | 'admin'>(),
  passwordHash: varchar("password_hash", { length: 255 }), // NULL for students
  pinHash: varchar("pin_hash", { length: 255 }), // NULL for teachers
  nickname: varchar("nickname", { length: 50 }), // NULL for teachers
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  tempPasswordFlag: boolean("temp_password_flag").default(false),
  emailVerified: boolean("email_verified").default(false),
  accountApproved: boolean("account_approved").default(false),
  loginAttempts: integer("login_attempts").default(0),
  lockoutUntil: timestamp("lockout_until"),
  tokens: integer("tokens").default(0),
  level: integer("level").default(1),
  totalEarnings: integer("total_earnings").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login")
});

// Classrooms table
export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 6 }), // Keep for backwards compatibility
  subject: varchar("subject", { length: 50 }),
  gradeLevel: varchar("grade_level", { length: 20 }),
  academicYear: varchar("academic_year", { length: 10 }),
  joinCode: varchar("join_code", { length: 6 }).notNull().unique(),
  autoApproveStudents: boolean("auto_approve_students").default(true),
  baseTokenRate: integer("base_token_rate").default(1),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Student-Classroom relationships
export const studentClassrooms = pgTable("student_classrooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow()
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  tokenReward: integer("token_reward").default(0),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Assignment submissions
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").references(() => assignments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  submissionText: text("submission_text"),
  submissionUrl: varchar("submission_url", { length: 500 }),
  tokensAwarded: integer("tokens_awarded").default(0),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id)
});

// Store items
export const storeItems = pgTable("store_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  cost: integer("cost").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  category: varchar("category", { length: 50 }),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  isActive: boolean("is_active").default(true),
  inventory: integer("inventory").default(-1), // -1 means unlimited
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Store purchases
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  storeItemId: uuid("store_item_id").references(() => storeItems.id).notNull(),
  tokensSpent: integer("tokens_spent").notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<'pending' | 'fulfilled' | 'cancelled'>().default('pending'),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  fulfilledAt: timestamp("fulfilled_at")
});

// Badges/Achievements
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }),
  requirements: jsonb("requirements").default({}),
  classroomId: uuid("classroom_id").references(() => classrooms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Student badges earned
export const studentBadges = pgTable("student_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow()
});

// Challenges
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  targetValue: integer("target_value").notNull(),
  tokenReward: integer("token_reward").default(0),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});

// Student challenge progress
export const challengeProgress = pgTable("challenge_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  challengeId: uuid("challenge_id").references(() => challenges.id).notNull(),
  currentValue: integer("current_value").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Student classroom enrollment tracking
export const classroomEnrollments = pgTable("classroom_enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  enrollmentStatus: varchar("enrollment_status", { length: 20 }).notNull().default('approved').$type<'pending' | 'approved' | 'denied' | 'withdrawn'>(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id)
});

// Announcements and communication
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default('normal').$type<'low' | 'normal' | 'high' | 'urgent'>(),
  category: varchar("category", { length: 50 }).default('general'),
  scheduledFor: timestamp("scheduled_for"),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Track which students have read announcements
export const announcementReads = pgTable("announcement_reads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at").defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teacherClassrooms: many(classrooms),
  studentClassrooms: many(studentClassrooms),
  classroomEnrollments: many(classroomEnrollments),
  assignments: many(assignments),
  submissions: many(submissions),
  purchases: many(purchases),
  studentBadges: many(studentBadges),
  challengeProgress: many(challengeProgress),
  authoredAnnouncements: many(announcements),
  announcementReads: many(announcementReads)
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classrooms.teacherId],
    references: [users.id]
  }),
  studentClassrooms: many(studentClassrooms),
  enrollments: many(classroomEnrollments),
  assignments: many(assignments),
  storeItems: many(storeItems),
  badges: many(badges),
  challenges: many(challenges),
  announcements: many(announcements)
}));

export const studentClassroomsRelations = relations(studentClassrooms, ({ one }) => ({
  student: one(users, {
    fields: [studentClassrooms.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [studentClassrooms.classroomId],
    references: [classrooms.id]
  })
}));

export const classroomEnrollmentsRelations = relations(classroomEnrollments, ({ one }) => ({
  student: one(users, {
    fields: [classroomEnrollments.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [classroomEnrollments.classroomId],
    references: [classrooms.id]
  }),
  approver: one(users, {
    fields: [classroomEnrollments.approvedBy],
    references: [users.id]
  })
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [announcements.classroomId],
    references: [classrooms.id]
  }),
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id]
  }),
  reads: many(announcementReads)
}));

export const announcementReadsRelations = relations(announcementReads, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementReads.announcementId],
    references: [announcements.id]
  }),
  student: one(users, {
    fields: [announcementReads.studentId],
    references: [users.id]
  })
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [assignments.classroomId],
    references: [classrooms.id]
  }),
  teacher: one(users, {
    fields: [assignments.teacherId],
    references: [users.id]
  }),
  submissions: many(submissions)
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id]
  }),
  reviewer: one(users, {
    fields: [submissions.reviewedBy],
    references: [users.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertClassroomSchema = createInsertSchema(classrooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true
});

export const insertStoreItemSchema = createInsertSchema(storeItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true
});

export const insertClassroomEnrollmentSchema = createInsertSchema(classroomEnrollments).omit({
  id: true,
  enrolledAt: true,
  approvedAt: true
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAnnouncementReadSchema = createInsertSchema(announcementReads).omit({
  id: true,
  readAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ClassroomEnrollment = typeof classroomEnrollments.$inferSelect;
export type InsertClassroomEnrollment = z.infer<typeof insertClassroomEnrollmentSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type InsertAnnouncementRead = z.infer<typeof insertAnnouncementReadSchema>;
export type StudentClassroom = typeof studentClassrooms.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type StudentBadge = typeof studentBadges.$inferSelect;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
