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
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teacherClassrooms: many(classrooms),
  studentClassrooms: many(studentClassrooms),
  assignments: many(assignments),
  submissions: many(submissions),
  purchases: many(purchases),
  studentBadges: many(studentBadges),
  challengeProgress: many(challengeProgress)
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classrooms.teacherId],
    references: [users.id]
  }),
  studentClassrooms: many(studentClassrooms),
  assignments: many(assignments),
  storeItems: many(storeItems),
  badges: many(badges),
  challenges: many(challenges)
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
export type StudentClassroom = typeof studentClassrooms.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type StudentBadge = typeof studentBadges.$inferSelect;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
