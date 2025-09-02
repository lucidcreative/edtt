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
  serial,
  decimal,
  unique,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - handles both teachers and students
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique(), // NULL for students
  username: varchar("username", { length: 50 }).unique(), // For students
  role: varchar("role", { length: 20 }).notNull().$type<'teacher' | 'student' | 'admin'>(),
  passwordHash: varchar("password_hash", { length: 255 }), // NULL for students
  pinHash: varchar("pin_hash", { length: 255 }), // NULL for teachers
  nickname: varchar("nickname", { length: 50 }), // NULL for teachers
  name: varchar("name", { length: 100 }), // Full name for students
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  tempPasswordFlag: boolean("temp_password_flag").default(false),
  requiresPinChange: boolean("requires_pin_change").default(false),
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
  // Time tracking settings
  timeTrackingEnabled: boolean("time_tracking_enabled").default(false),
  maxDailyHours: decimal("max_daily_hours", { precision: 4, scale: 2 }).default('8.00'),
  tokensPerHour: integer("tokens_per_hour").default(5),
  minClockInDuration: integer("min_clock_in_duration").default(15), // minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  teacherIdIdx: index("classrooms_teacher_id_idx").on(table.teacherId),
  joinCodeIdx: index("classrooms_join_code_idx").on(table.joinCode),
  createdAtIdx: index("classrooms_created_at_idx").on(table.createdAt),
  isActiveIdx: index("classrooms_is_active_idx").on(table.isActive)
}));

// Student-Classroom relationships
export const studentClassrooms = pgTable("student_classrooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow()
}, (table) => ({
  studentIdIdx: index("student_classrooms_student_id_idx").on(table.studentId),
  classroomIdIdx: index("student_classrooms_classroom_id_idx").on(table.classroomId),
  uniqueStudentClassroom: unique("unique_student_classroom").on(table.studentId, table.classroomId)
}));

// Classroom enrollment requests
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  enrollmentStatus: varchar("enrollment_status", { length: 20 }).notNull().$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id)
}, (table) => ({
  studentIdIdx: index("enrollments_student_id_idx").on(table.studentId),
  classroomIdIdx: index("enrollments_classroom_id_idx").on(table.classroomId),
  enrollmentStatusIdx: index("enrollments_status_idx").on(table.enrollmentStatus),
  uniqueStudentClassroomEnrollment: unique("unique_student_classroom_enrollment").on(table.studentId, table.classroomId)
}));

// Assignments table
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  category: varchar("category", { length: 50 }),
  tokenReward: integer("token_reward").default(10),
  maxSubmissions: integer("max_submissions").default(1),
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true),
  isRFP: boolean("is_rfp").default(false),
  resourceUrl: varchar("resource_url", { length: 1000 }),
  learningObjectives: text("learning_objectives").array(),
  // Launch scheduling fields
  launchType: varchar("launch_type", { length: 20 }).default('immediate').$type<'immediate' | 'scheduled' | 'manual'>(),
  scheduledUnlockDate: timestamp("scheduled_unlock_date"),
  visibility: varchar("visibility", { length: 20 }).default('public').$type<'public' | 'private'>(),
  selectedStudents: jsonb("selected_students").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("assignments_classroom_id_idx").on(table.classroomId),
  teacherIdIdx: index("assignments_teacher_id_idx").on(table.teacherId),
  categoryIdx: index("assignments_category_idx").on(table.category),
  isActiveIdx: index("assignments_is_active_idx").on(table.isActive),
  dueDateIdx: index("assignments_due_date_idx").on(table.dueDate),
  createdAtIdx: index("assignments_created_at_idx").on(table.createdAt)
}));

// Assignment resources table for dynamic link management
export const assignmentResources = pgTable("assignment_resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  
  title: varchar("title", { length: 200 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  linkType: varchar("link_type", { length: 50 }).notNull(), // 'google_drive', 'youtube', 'padlet', 'website', etc.
  description: text("description"),
  accessLevel: varchar("access_level", { length: 20 }).notNull().$type<'public' | 'classroom' | 'teacher_only'>().default('classroom'),
  
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  assignmentIdIdx: index("assignment_resources_assignment_id_idx").on(table.assignmentId),
  classroomIdIdx: index("assignment_resources_classroom_id_idx").on(table.classroomId),
  linkTypeIdx: index("assignment_resources_link_type_idx").on(table.linkType),
  displayOrderIdx: index("assignment_resources_display_order_idx").on(table.displayOrder)
}));

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
}, (table) => ({
  assignmentIdIdx: index("submissions_assignment_id_idx").on(table.assignmentId),
  studentIdIdx: index("submissions_student_id_idx").on(table.studentId),
  statusIdx: index("submissions_status_idx").on(table.status),
  submittedAtIdx: index("submissions_submitted_at_idx").on(table.submittedAt),
  reviewedByIdx: index("submissions_reviewed_by_idx").on(table.reviewedBy),
  assignmentStudentUnique: unique("assignment_student_submission_unique").on(table.assignmentId, table.studentId)
}));

// Enhanced proposals table for special projects and comprehensive proposal management
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").references(() => assignments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  
  // Proposal content and metadata
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(), // The proposal text/pitch
  scopeOfWork: text("scope_of_work"), // Detailed project scope
  attachmentUrls: text("attachment_urls").array(), // File attachments/links
  estimatedCompletionTime: varchar("estimated_completion_time", { length: 50 }), // Timeline estimate
  
  // Status and workflow management
  status: varchar("status", { length: 20 }).notNull().$type<'draft' | 'submitted' | 'pending' | 'under_review' | 'needs_revision' | 'approved' | 'rejected' | 'in_progress' | 'completed'>().default('draft'),
  priority: varchar("priority", { length: 10 }).$type<'low' | 'medium' | 'high' | 'urgent'>().default('medium'),
  
  // Project tracking
  progressPercentage: integer("progress_percentage").default(0),
  milestones: text("milestones").array(), // Project milestones
  completedMilestones: text("completed_milestones").array(), // Completed milestones
  
  // Review and feedback system
  teacherFeedback: text("teacher_feedback"),
  internalNotes: text("internal_notes"), // Teacher's private notes
  studentResponse: text("student_response"), // Student's response to feedback
  
  // Dates and deadlines
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  approvedAt: timestamp("approved_at"),
  dueDate: timestamp("due_date"),
  
  // Revision tracking
  revisionCount: integer("revision_count").default(0),
  lastRevisionDate: timestamp("last_revision_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  assignmentIdIdx: index("proposals_assignment_id_idx").on(table.assignmentId),
  studentIdIdx: index("proposals_student_id_idx").on(table.studentId),
  classroomIdIdx: index("proposals_classroom_id_idx").on(table.classroomId),
  statusIdx: index("proposals_status_idx").on(table.status),
  priorityIdx: index("proposals_priority_idx").on(table.priority),
  createdAtIdx: index("proposals_created_at_idx").on(table.createdAt),
  assignmentStudentProposalUnique: unique("assignment_student_proposal_unique").on(table.assignmentId, table.studentId)
}));

// Proposal feedback and communication tracking
export const proposalFeedback = pgTable("proposal_feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "cascade" }).notNull(),
  fromUserId: uuid("from_user_id").references(() => users.id).notNull(),
  toUserId: uuid("to_user_id").references(() => users.id).notNull(),
  
  feedbackType: varchar("feedback_type", { length: 30 }).notNull().$type<'initial_review' | 'revision_request' | 'approval' | 'rejection' | 'student_response' | 'progress_update'>(),
  feedbackContent: text("feedback_content").notNull(),
  isPublic: boolean("is_public").default(true), // Whether student can see this feedback
  
  // Communication tracking
  responseRequested: boolean("response_requested").default(false),
  responseReceived: boolean("response_received").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
}, (table) => ({
  proposalIdIdx: index("proposal_feedback_proposal_id_idx").on(table.proposalId),
  fromUserIdIdx: index("proposal_feedback_from_user_id_idx").on(table.fromUserId),
  toUserIdIdx: index("proposal_feedback_to_user_id_idx").on(table.toUserId),
  feedbackTypeIdx: index("proposal_feedback_type_idx").on(table.feedbackType)
}));

// Proposal notifications for real-time updates
export const proposalNotifications = pgTable("proposal_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  notificationType: varchar("notification_type", { length: 30 }).notNull().$type<'status_change' | 'feedback_received' | 'deadline_reminder' | 'approval' | 'rejection' | 'revision_request'>(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url", { length: 500 }), // URL to relevant page
  
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
}, (table) => ({
  proposalIdIdx: index("proposal_notifications_proposal_id_idx").on(table.proposalId),
  userIdIdx: index("proposal_notifications_user_id_idx").on(table.userId),
  notificationTypeIdx: index("proposal_notifications_type_idx").on(table.notificationType),
  isReadIdx: index("proposal_notifications_is_read_idx").on(table.isRead)
}));

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
}, (table) => ({
  classroomIdIdx: index("store_items_classroom_id_idx").on(table.classroomId),
  categoryIdx: index("store_items_category_idx").on(table.category),
  costIdx: index("store_items_cost_idx").on(table.cost),
  isActiveIdx: index("store_items_is_active_idx").on(table.isActive),
  createdAtIdx: index("store_items_created_at_idx").on(table.createdAt)
}));

// Store purchases
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  storeItemId: uuid("store_item_id").references(() => storeItems.id).notNull(),
  tokensSpent: integer("tokens_spent").notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<'pending' | 'fulfilled' | 'cancelled'>().default('pending'),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  fulfilledAt: timestamp("fulfilled_at")
}, (table) => ({
  studentIdIdx: index("purchases_student_id_idx").on(table.studentId),
  storeItemIdIdx: index("purchases_store_item_id_idx").on(table.storeItemId),
  statusIdx: index("purchases_status_idx").on(table.status),
  purchasedAtIdx: index("purchases_purchased_at_idx").on(table.purchasedAt)
}));

// Time tracking entries
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  clockInTime: timestamp("clock_in_time").notNull(),
  clockOutTime: timestamp("clock_out_time"),
  duration: integer("duration"), // in minutes
  tokensEarned: integer("tokens_earned").default(0),
  status: varchar("status", { length: 20 }).notNull().$type<'active' | 'completed' | 'auto_clocked_out'>().default('active'),
  notes: text("notes"),
  isValidated: boolean("is_validated").default(false),
  validatedBy: uuid("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at")
}, (table) => ({
  studentIdIdx: index("time_entries_student_id_idx").on(table.studentId),
  classroomIdIdx: index("time_entries_classroom_id_idx").on(table.classroomId),
  clockInTimeIdx: index("time_entries_clock_in_time_idx").on(table.clockInTime),
  statusIdx: index("time_entries_status_idx").on(table.status)
}));

// Badges
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  color: varchar("color", { length: 20 }).default('#3B82F6'),
  criteria: jsonb("criteria").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("badges_classroom_id_idx").on(table.classroomId),
  isActiveIdx: index("badges_is_active_idx").on(table.isActive)
}));

// Student badges earned
export const studentBadges = pgTable("student_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  awardedBy: uuid("awarded_by").references(() => users.id)
}, (table) => ({
  studentIdIdx: index("student_badges_student_id_idx").on(table.studentId),
  badgeIdIdx: index("student_badges_badge_id_idx").on(table.badgeId),
  uniqueStudentBadge: unique("unique_student_badge").on(table.studentId, table.badgeId)
}));

// Challenges
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull().$type<'individual' | 'team' | 'classroom'>(),
  targetMetric: varchar("target_metric", { length: 50 }).notNull(), // 'assignments_completed', 'tokens_earned', 'time_logged', etc.
  targetValue: integer("target_value").notNull(),
  tokenReward: integer("token_reward").default(0),
  badgeReward: uuid("badge_reward").references(() => badges.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("challenges_classroom_id_idx").on(table.classroomId),
  typeIdx: index("challenges_type_idx").on(table.type),
  isActiveIdx: index("challenges_is_active_idx").on(table.isActive),
  startDateIdx: index("challenges_start_date_idx").on(table.startDate),
  endDateIdx: index("challenges_end_date_idx").on(table.endDate)
}));

// Challenge progress tracking
export const challengeProgress = pgTable("challenge_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: uuid("challenge_id").references(() => challenges.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  currentValue: integer("current_value").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  lastUpdated: timestamp("last_updated").defaultNow()
}, (table) => ({
  challengeIdIdx: index("challenge_progress_challenge_id_idx").on(table.challengeId),
  studentIdIdx: index("challenge_progress_student_id_idx").on(table.studentId),
  uniqueChallengeStudent: unique("unique_challenge_student").on(table.challengeId, table.studentId)
}));

// Announcements
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<'general' | 'assignment' | 'achievement' | 'reminder'>().default('general'),
  priority: varchar("priority", { length: 10 }).notNull().$type<'low' | 'medium' | 'high'>().default('medium'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("announcements_classroom_id_idx").on(table.classroomId),
  authorIdIdx: index("announcements_author_id_idx").on(table.authorId),
  typeIdx: index("announcements_type_idx").on(table.type),
  priorityIdx: index("announcements_priority_idx").on(table.priority),
  isActiveIdx: index("announcements_is_active_idx").on(table.isActive),
  createdAtIdx: index("announcements_created_at_idx").on(table.createdAt)
}));

// Announcement read tracking
export const announcementReads = pgTable("announcement_reads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at").defaultNow()
}, (table) => ({
  announcementIdIdx: index("announcement_reads_announcement_id_idx").on(table.announcementId),
  studentIdIdx: index("announcement_reads_student_id_idx").on(table.studentId),
  uniqueAnnouncementStudent: unique("unique_announcement_student").on(table.announcementId, table.studentId)
}));

// Schema for insert operations
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

export const insertAssignmentResourceSchema = createInsertSchema(assignmentResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSubmissionSchema = createInsertSchema(submissions);

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProposalFeedbackSchema = createInsertSchema(proposalFeedback).omit({
  id: true,
  createdAt: true
});

export const insertProposalNotificationSchema = createInsertSchema(proposalNotifications).omit({
  id: true,
  createdAt: true
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  approvedAt: true
});

export const insertStoreItemSchema = createInsertSchema(storeItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
  fulfilledAt: true
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  validatedAt: true
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentBadgeSchema = createInsertSchema(studentBadges).omit({
  id: true,
  earnedAt: true
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertChallengeProgressSchema = createInsertSchema(challengeProgress).omit({
  id: true,
  updatedAt: true
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

// Group buy template data - templates for creating group buy initiatives
export const groupBuyTemplateData = [
  {
    id: "classroom-supplies",
    title: "Classroom Supplies Fund",
    description: "Pool tokens to purchase supplies for the entire classroom",
    category: "supplies",
    goalAmount: 500,
    icon: "📚"
  },
  {
    id: "class-party",
    title: "Class Celebration Fund",
    description: "Contribute tokens for a special class celebration or party",
    category: "events",
    goalAmount: 300,
    icon: "🎉"
  },
  {
    id: "learning-materials",
    title: "Educational Materials",
    description: "Fund new educational materials and resources for everyone",
    category: "education",
    goalAmount: 400,
    icon: "🎓"
  }
];

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type AssignmentResource = typeof assignmentResources.$inferSelect;
export type InsertAssignmentResource = z.infer<typeof insertAssignmentResourceSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type ProposalFeedback = typeof proposalFeedback.$inferSelect;
export type InsertProposalFeedback = z.infer<typeof insertProposalFeedbackSchema>;

export type ProposalNotification = typeof proposalNotifications.$inferSelect;
export type InsertProposalNotification = z.infer<typeof insertProposalNotificationSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type StudentBadge = typeof studentBadges.$inferSelect;
export type InsertStudentBadge = z.infer<typeof insertStudentBadgeSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = z.infer<typeof insertChallengeProgressSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type InsertAnnouncementRead = z.infer<typeof insertAnnouncementReadSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  teacherClassrooms: many(classrooms),
  studentClassrooms: many(studentClassrooms),
  enrollments: many(enrollments),
  assignments: many(assignments),
  submissions: many(submissions),
  proposals: many(proposals),
  proposalFeedback: many(proposalFeedback),
  proposalNotifications: many(proposalNotifications),
  assignmentResources: many(assignmentResources),
  purchases: many(purchases),
  studentBadges: many(studentBadges),
  challengeProgress: many(challengeProgress),
  authoredAnnouncements: many(announcements),
  announcementReads: many(announcementReads)
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [proposals.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [proposals.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [proposals.classroomId],
    references: [classrooms.id]
  }),
  feedback: many(proposalFeedback),
  notifications: many(proposalNotifications)
}));

export const proposalFeedbackRelations = relations(proposalFeedback, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalFeedback.proposalId],
    references: [proposals.id]
  }),
  fromUser: one(users, {
    fields: [proposalFeedback.fromUserId],
    references: [users.id]
  }),
  toUser: one(users, {
    fields: [proposalFeedback.toUserId],
    references: [users.id]
  })
}));

export const proposalNotificationsRelations = relations(proposalNotifications, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalNotifications.proposalId],
    references: [proposals.id]
  }),
  user: one(users, {
    fields: [proposalNotifications.userId],
    references: [users.id]
  })
}));

export const assignmentResourcesRelations = relations(assignmentResources, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentResources.assignmentId],
    references: [assignments.id]
  }),
  classroom: one(classrooms, {
    fields: [assignmentResources.classroomId],
    references: [classrooms.id]
  }),
  creator: one(users, {
    fields: [assignmentResources.createdBy],
    references: [users.id]
  })
}));