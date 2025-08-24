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
  // Indexes for foreign keys and frequent queries
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
  // Indexes for foreign keys and frequent queries
  studentIdIdx: index("student_classrooms_student_id_idx").on(table.studentId),
  classroomIdIdx: index("student_classrooms_classroom_id_idx").on(table.classroomId),
  // Unique constraint to prevent duplicate enrollments
  studentClassroomUnique: unique("student_classroom_unique").on(table.studentId, table.classroomId)
}));

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
  resources: jsonb("resources").default([]), // Array of resource links
  isActive: boolean("is_active").default(true),
  isRFP: boolean("is_rfp").default(false), // RFP (Request for Proposal) mode
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Indexes for foreign keys and frequent queries
  classroomIdIdx: index("assignments_classroom_id_idx").on(table.classroomId),
  teacherIdIdx: index("assignments_teacher_id_idx").on(table.teacherId),
  dueDateIdx: index("assignments_due_date_idx").on(table.dueDate),
  createdAtIdx: index("assignments_created_at_idx").on(table.createdAt),
  isActiveIdx: index("assignments_is_active_idx").on(table.isActive),
  categoryIdx: index("assignments_category_idx").on(table.category),
  isRFPIdx: index("assignments_is_rfp_idx").on(table.isRFP)
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
  // Indexes for foreign keys and frequent queries
  assignmentIdIdx: index("submissions_assignment_id_idx").on(table.assignmentId),
  studentIdIdx: index("submissions_student_id_idx").on(table.studentId),
  statusIdx: index("submissions_status_idx").on(table.status),
  submittedAtIdx: index("submissions_submitted_at_idx").on(table.submittedAt),
  reviewedByIdx: index("submissions_reviewed_by_idx").on(table.reviewedBy),
  // Unique constraint to prevent duplicate submissions
  assignmentStudentUnique: unique("assignment_student_submission_unique").on(table.assignmentId, table.studentId)
}));

// Proposals table for RFP assignments
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").references(() => assignments.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  content: text("content").notNull(), // The proposal text/pitch
  status: varchar("status", { length: 20 }).notNull().$type<'pending' | 'approved' | 'not_selected'>().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Indexes for foreign keys and frequent queries
  assignmentIdIdx: index("proposals_assignment_id_idx").on(table.assignmentId),
  studentIdIdx: index("proposals_student_id_idx").on(table.studentId),
  statusIdx: index("proposals_status_idx").on(table.status),
  createdAtIdx: index("proposals_created_at_idx").on(table.createdAt),
  // Unique constraint to prevent duplicate proposals per assignment
  assignmentStudentProposalUnique: unique("assignment_student_proposal_unique").on(table.assignmentId, table.studentId)
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
  // Indexes for foreign keys and frequent queries
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
  // Indexes for foreign keys and frequent queries
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
  totalMinutes: integer("total_minutes").default(0),
  tokensEarned: integer("tokens_earned").default(0),
  status: varchar("status", { length: 20 }).notNull().$type<'active' | 'completed' | 'cancelled'>().default('active'),
  ipAddress: varchar("ip_address", { length: 45 }), // For basic abuse prevention
  notes: text("notes"),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Indexes for foreign keys and frequent queries
  studentIdIdx: index("time_entries_student_id_idx").on(table.studentId),
  classroomIdIdx: index("time_entries_classroom_id_idx").on(table.classroomId),
  statusIdx: index("time_entries_status_idx").on(table.status),
  clockInTimeIdx: index("time_entries_clock_in_time_idx").on(table.clockInTime),
  createdAtIdx: index("time_entries_created_at_idx").on(table.createdAt)
}));

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

// Student classroom enrollment tracking (matches database table 'enrollments')
export const classroomEnrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  enrollmentStatus: varchar("enrollment_status", { length: 20 }).notNull().default('pending').$type<'pending' | 'approved' | 'denied' | 'withdrawn'>(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id)
}, (table) => ({
  uniqueStudentClassroom: unique().on(table.studentId, table.classroomId)
}));

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
}, (table) => ({
  // Indexes for foreign keys and frequent queries
  classroomIdIdx: index("announcements_classroom_id_idx").on(table.classroomId),
  authorIdIdx: index("announcements_author_id_idx").on(table.authorId),
  publishedIdx: index("announcements_published_idx").on(table.published),
  priorityIdx: index("announcements_priority_idx").on(table.priority),
  createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
  categoryIdx: index("announcements_category_idx").on(table.category)
}));

// Track which students have read announcements
export const announcementReads = pgTable("announcement_reads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: uuid("announcement_id").references(() => announcements.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  readAt: timestamp("read_at").defaultNow()
}, (table) => ({
  // Indexes for foreign keys and frequent queries
  announcementIdIdx: index("announcement_reads_announcement_id_idx").on(table.announcementId),
  studentIdIdx: index("announcement_reads_student_id_idx").on(table.studentId),
  readAtIdx: index("announcement_reads_read_at_idx").on(table.readAt),
  // Unique constraint to prevent duplicate read records
  announcementStudentUnique: unique("announcement_student_read_unique").on(table.announcementId, table.studentId)
}));

// Audit logging for all critical operations
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id),
  action: varchar("action", { length: 50 }).notNull(), // 'token_award', 'token_purchase', 'submission_grade', etc.
  entityType: varchar("entity_type", { length: 30 }).notNull(), // 'token', 'assignment', 'submission', etc.
  entityId: uuid("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata").default({}),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // Indexes for audit log queries
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  classroomIdIdx: index("audit_logs_classroom_id_idx").on(table.classroomId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  entityTypeIdx: index("audit_logs_entity_type_idx").on(table.entityType),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
}));

// Time-tracking sessions with anti-cheat measures
export const timeSessions = pgTable("time_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").default(0), // in minutes
  status: varchar("status", { length: 20 }).notNull().$type<'active' | 'completed' | 'abandoned' | 'terminated'>().default('active'),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgentHash: varchar("user_agent_hash", { length: 64 }).notNull(), // SHA-256 hash
  fingerprintHash: varchar("fingerprint_hash", { length: 64 }), // Browser fingerprint hash
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  idleTime: integer("idle_time").default(0), // total idle time in minutes
  tokensEarned: integer("tokens_earned").default(0),
  notes: text("notes"),
  terminatedBy: uuid("terminated_by").references(() => users.id),
  terminationReason: varchar("termination_reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Indexes for time session queries
  studentIdIdx: index("time_sessions_student_id_idx").on(table.studentId),
  classroomIdIdx: index("time_sessions_classroom_id_idx").on(table.classroomId),
  statusIdx: index("time_sessions_status_idx").on(table.status),
  startTimeIdx: index("time_sessions_start_time_idx").on(table.startTime),
  ipAddressIdx: index("time_sessions_ip_address_idx").on(table.ipAddress),
  userAgentHashIdx: index("time_sessions_user_agent_hash_idx").on(table.userAgentHash),
  // Constraint to prevent multiple active sessions
  uniqueActiveSession: unique("unique_active_student_session").on(table.studentId, table.status)
}));

// Heartbeat tracking for idle detection
export const sessionHeartbeats = pgTable("session_heartbeats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => timeSessions.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  activity: varchar("activity", { length: 30 }).notNull(), // 'click', 'keypress', 'focus', 'blur'
  metadata: jsonb("metadata").default({})
}, (table) => ({
  sessionIdIdx: index("session_heartbeats_session_id_idx").on(table.sessionId),
  timestampIdx: index("session_heartbeats_timestamp_idx").on(table.timestamp)
}));

// Analytics materialized views (computed nightly)
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  analyticsType: varchar("analytics_type", { length: 30 }).notNull(), // 'daily', 'weekly', 'monthly'
  data: jsonb("data").notNull(), // Precomputed analytics data
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("analytics_snapshots_classroom_id_idx").on(table.classroomId),
  snapshotDateIdx: index("analytics_snapshots_date_idx").on(table.snapshotDate),
  analyticsTypeIdx: index("analytics_snapshots_type_idx").on(table.analyticsType),
  // Unique constraint for snapshots
  uniqueSnapshot: unique("unique_analytics_snapshot").on(table.classroomId, table.snapshotDate, table.analyticsType)
}));

// PHASE 1C: TOKEN ECONOMY FOUNDATION

// Student token wallets with comprehensive tracking
export const studentWallets = pgTable("student_wallets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalEarned: decimal("total_earned", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  uniqueStudentClassroom: unique().on(table.studentId, table.classroomId)
}));

// Comprehensive token transaction logging
export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: uuid("wallet_id").references(() => studentWallets.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionType: varchar("transaction_type", { length: 30 }).notNull().$type<'earned' | 'spent' | 'awarded' | 'bonus' | 'penalty' | 'correction' | 'refund'>(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description").notNull(),
  referenceType: varchar("reference_type", { length: 30 }),
  referenceId: uuid("reference_id"),
  createdBy: uuid("created_by").references(() => users.id),
  metadata: jsonb("metadata").default({}),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 }),
  auditHash: varchar("audit_hash", { length: 255 }),
  parentTransactionId: uuid("parent_transaction_id"),
  isCorrection: boolean("is_correction").default(false),
  correctionReason: text("correction_reason")
});

// Token earning categories for organization and analytics
export const tokenCategories = pgTable("token_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  defaultAmount: decimal("default_amount", { precision: 10, scale: 2 }),
  colorCode: varchar("color_code", { length: 7 }),
  iconName: varchar("icon_name", { length: 30 }),
  activeStatus: boolean("active_status").default(true),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  uniqueCategoryName: unique().on(table.classroomId, table.name)
}));

// Quick award presets for efficient teacher workflows
export const teacherAwardPresets = pgTable("teacher_award_presets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  presetName: varchar("preset_name", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid("category_id").references(() => tokenCategories.id),
  descriptionTemplate: text("description_template"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used")
});

// Student milestone tracking for engagement
export const studentMilestones = pgTable("student_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  milestoneType: varchar("milestone_type", { length: 30 }).notNull().$type<'balance_reached' | 'earning_streak' | 'category_mastery'>(),
  milestoneValue: integer("milestone_value").notNull(),
  achievedAt: timestamp("achieved_at").defaultNow(),
  acknowledged: boolean("acknowledged").default(false),
  academicPeriod: varchar("academic_period", { length: 20 })
});

// PHASE 1D: DIGITAL STORE SYSTEM

// Comprehensive store item management
export const storeItemsAdvanced = pgTable("store_items_advanced", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  
  // Item classification and behavior
  itemType: varchar("item_type", { length: 30 }).notNull().$type<'physical' | 'digital' | 'privilege' | 'academic_benefit'>(),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  
  // Inventory and availability management
  inventoryType: varchar("inventory_type", { length: 20 }).notNull().$type<'unlimited' | 'limited' | 'one_time'>(),
  totalQuantity: integer("total_quantity"), // NULL for unlimited items
  availableQuantity: integer("available_quantity"), // Current available stock
  maxPerStudent: integer("max_per_student").default(1), // Purchase limits per student
  
  // Digital subscription configuration
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }).$type<'weekly' | 'biweekly' | 'monthly'>(),
  recurringAmount: decimal("recurring_amount", { precision: 10, scale: 2 }), // Amount charged per interval
  trialPeriodDays: integer("trial_period_days").default(0),
  
  // Visual and organizational elements
  imageUrl: varchar("image_url", { length: 500 }),
  colorTheme: varchar("color_theme", { length: 7 }), // Hex color for UI theming
  priorityOrder: integer("priority_order").default(0), // For featured item ordering
  
  // Availability scheduling
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  
  // Status and metadata
  activeStatus: boolean("active_status").default(true),
  featured: boolean("featured").default(false),
  tags: text("tags").array().default([]), // Searchable keywords
  metadata: jsonb("metadata").default({}), // Flexible additional configuration
  
  createdBy: uuid("created_by").references(() => users.id), // Teacher who created the item
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Student purchase transaction records
export const storePurchases = pgTable("store_purchases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  itemId: uuid("item_id").references(() => storeItemsAdvanced.id).notNull(),
  
  // Purchase details
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price at time of purchase
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Transaction processing
  transactionId: uuid("transaction_id").references(() => tokenTransactions.id), // Link to token deduction
  purchaseStatus: varchar("purchase_status", { length: 20 }).default('completed').$type<'pending' | 'completed' | 'delivered' | 'refunded' | 'cancelled'>(),
  
  // Delivery and fulfillment
  deliveryMethod: varchar("delivery_method", { length: 30 }).$type<'immediate' | 'teacher_approval' | 'physical_pickup'>(),
  deliveredAt: timestamp("delivered_at"),
  deliveryNotes: text("delivery_notes"),
  
  // Subscription management
  isSubscription: boolean("is_subscription").default(false),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).$type<'active' | 'cancelled' | 'expired'>(),
  nextBillingDate: timestamp("next_billing_date"),
  subscriptionCancelledAt: timestamp("subscription_cancelled_at"),
  
  purchaseDate: timestamp("purchase_date").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 })
});

// Student wishlists for goal-setting and planning
export const studentWishlists = pgTable("student_wishlists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  itemId: uuid("item_id").references(() => storeItemsAdvanced.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  priority: integer("priority").default(1), // 1 = highest priority
  notes: text("notes"), // Student's personal notes about the item
  targetDate: timestamp("target_date"), // When student hopes to purchase
  notificationsEnabled: boolean("notifications_enabled").default(true)
}, (table) => ({
  uniqueStudentItem: unique().on(table.studentId, table.itemId) // Prevent duplicate wishlist entries
}));

// Store analytics and insights
export const storeAnalytics = pgTable("store_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  itemId: uuid("item_id").references(() => storeItemsAdvanced.id).notNull(),
  
  // Daily aggregated metrics
  analyticsDate: timestamp("analytics_date").notNull(),
  viewCount: integer("view_count").default(0),
  wishlistAdds: integer("wishlist_adds").default(0),
  purchaseCount: integer("purchase_count").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  
  // Student engagement metrics
  uniqueViewers: integer("unique_viewers").default(0),
  averageTimeViewed: integer("average_time_viewed").default(0), // In seconds
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0.0000"), // Views to purchases
  
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  uniqueDateItem: unique().on(table.classroomId, table.itemId, table.analyticsDate)
}));

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

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
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
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type StoreItem = typeof storeItems.$inferSelect;
export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type StudentBadgeType = typeof studentBadges.$inferSelect;
export type ChallengeProgressType = typeof challengeProgress.$inferSelect;
export type ClassroomEnrollment = typeof classroomEnrollments.$inferSelect;
export type InsertClassroomEnrollment = z.infer<typeof insertClassroomEnrollmentSchema>;

// PHASE 1C TOKEN ECONOMY TYPES
export type StudentWallet = typeof studentWallets.$inferSelect;
export type InsertStudentWallet = typeof studentWallets.$inferInsert;

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

export type TokenCategory = typeof tokenCategories.$inferSelect;
export type InsertTokenCategory = typeof tokenCategories.$inferInsert;

export type TeacherAwardPreset = typeof teacherAwardPresets.$inferSelect;
export type InsertTeacherAwardPreset = typeof teacherAwardPresets.$inferInsert;

export type StudentMilestone = typeof studentMilestones.$inferSelect;
export type InsertStudentMilestone = typeof studentMilestones.$inferInsert;

// Phase 1C Insert Schemas
export const insertStudentWalletSchema = createInsertSchema(studentWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).omit({
  id: true,
  transactionDate: true
});

export const insertTokenCategorySchema = createInsertSchema(tokenCategories).omit({
  id: true,
  createdAt: true
});

export const insertTeacherAwardPresetSchema = createInsertSchema(teacherAwardPresets).omit({
  id: true,
  createdAt: true,
  usageCount: true,
  lastUsed: true
});

export const insertStudentMilestoneSchema = createInsertSchema(studentMilestones).omit({
  id: true,
  achievedAt: true
});

// Phase 1D Store System Insert Schemas
export const insertStoreItemAdvancedSchema = createInsertSchema(storeItemsAdvanced).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStorePurchaseSchema = createInsertSchema(storePurchases).omit({
  id: true,
  purchaseDate: true
});

export const insertStudentWishlistSchema = createInsertSchema(studentWishlists).omit({
  id: true,
  addedAt: true
});

export const insertStoreAnalyticsSchema = createInsertSchema(storeAnalytics).omit({
  id: true,
  createdAt: true
});

// Phase 1D Store System Types
export type StoreItemAdvanced = typeof storeItemsAdvanced.$inferSelect;
export type InsertStoreItemAdvanced = z.infer<typeof insertStoreItemAdvancedSchema>;

export type StorePurchase = typeof storePurchases.$inferSelect;
export type InsertStorePurchase = z.infer<typeof insertStorePurchaseSchema>;

export type StudentWishlist = typeof studentWishlists.$inferSelect;
export type InsertStudentWishlist = z.infer<typeof insertStudentWishlistSchema>;

export type StoreAnalytics = typeof storeAnalytics.$inferSelect;
export type InsertStoreAnalytics = z.infer<typeof insertStoreAnalyticsSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type InsertAnnouncementRead = z.infer<typeof insertAnnouncementReadSchema>;
export type StudentClassroom = typeof studentClassrooms.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type StudentBadgeOld = typeof studentBadges.$inferSelect;
export type ChallengeProgressOld = typeof challengeProgress.$inferSelect;

// Phase 2A Assignment Management Tables

// Comprehensive assignment configuration and management
export const assignmentsAdvanced = pgTable("assignments_advanced", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: varchar("classroom_id").references(() => classrooms.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").references(() => users.id),
  
  // Assignment identification and organization
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  learningObjectives: text("learning_objectives").array(),
  category: varchar("category", { length: 50 }), // 'homework', 'project', 'quiz', 'presentation'
  subjectTags: text("subject_tags").array(),
  
  // Submission requirements and expectations
  submissionInstructions: text("submission_instructions").notNull(),
  acceptedLinkTypes: text("accepted_link_types").array(), // 'google_drive', 'dropbox', 'youtube', 'padlet'
  requiredPermissions: text("required_permissions"), // 'view', 'comment', 'edit'
  submissionFormatNotes: text("submission_format_notes"),
  
  // Timeline and deadline management
  assignedDate: timestamp("assigned_date").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  lateSubmissionAllowed: boolean("late_submission_allowed").default(true),
  latePenaltyPercentage: varchar("late_penalty_percentage").default("0.00"),
  
  // Token economy integration
  baseTokenReward: varchar("base_token_reward").notNull(),
  earlySubmissionBonus: varchar("early_submission_bonus").default("0.00"),
  qualityBonusMax: varchar("quality_bonus_max").default("0.00"),
  
  // Assignment status and availability
  status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'published', 'closed', 'archived'
  visibleToStudents: boolean("visible_to_students").default(false),
  maxSubmissions: integer("max_submissions").default(1),
  
  // Professional skills tracking weights
  deadlineWeight: varchar("deadline_weight").default("0.25"),
  instructionFollowingWeight: varchar("instruction_following_weight").default("0.25"),
  communicationWeight: varchar("communication_weight").default("0.25"),
  presentationWeight: varchar("presentation_weight").default("0.25"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 })
});

// Student assignment submissions with comprehensive tracking
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assignmentsAdvanced.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").references(() => users.id, { onDelete: "cascade" }),
  classroomId: varchar("classroom_id").references(() => classrooms.id, { onDelete: "cascade" }),
  
  // Submission content and metadata
  submissionUrl: text("submission_url").notNull(),
  linkType: varchar("link_type", { length: 50 }), // 'google_drive', 'dropbox', 'youtube', etc.
  linkTitle: varchar("link_title", { length: 200 }),
  studentNotes: text("student_notes"),
  
  // Submission tracking and validation
  submittedAt: timestamp("submitted_at").defaultNow(),
  isLateSubmission: boolean("is_late_submission").default(false),
  submissionNumber: integer("submission_number").default(1), // For resubmissions
  linkValidated: boolean("link_validated").default(false),
  validationCheckedAt: timestamp("validation_checked_at"),
  
  // Review and evaluation status
  reviewStatus: varchar("review_status", { length: 20 }).default("pending").$type<'pending' | 'reviewing' | 'graded' | 'pending_approval' | 'completed' | 'needs_revision'>(), // Submission review workflow status
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  
  // Token awards and scoring
  tokensAwarded: varchar("tokens_awarded").default("0.00"),
  baseTokensAwarded: varchar("base_tokens_awarded").default("0.00"),
  bonusTokensAwarded: varchar("bonus_tokens_awarded").default("0.00"),
  latePenaltyApplied: varchar("late_penalty_applied").default("0.00"),
  
  // Professional skills scoring
  deadlinessScore: varchar("deadliness_score"), // 0-100 score for meeting deadlines
  instructionFollowingScore: varchar("instruction_following_score"),
  communicationScore: varchar("communication_score"),
  presentationScore: varchar("presentation_score"),
  overallProfessionalScore: varchar("overall_professional_score"),
  
  // Feedback and improvement tracking
  teacherFeedback: text("teacher_feedback"),
  improvementSuggestions: text("improvement_suggestions").array(),
  studentReflection: text("student_reflection"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Assignment feedback and communication tracking
export const assignmentFeedback = pgTable("assignment_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => assignmentSubmissions.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  
  feedbackType: varchar("feedback_type", { length: 30 }), // 'initial_review', 'revision_request', 'final_approval', 'student_question'
  feedbackContent: text("feedback_content").notNull(),
  isPublic: boolean("is_public").default(true), // Whether student can see this feedback
  
  // Professional communication tracking
  communicationQuality: varchar("communication_quality", { length: 20 }), // 'professional', 'casual', 'needs_improvement'
  responseRequested: boolean("response_requested").default(false),
  responseReceived: boolean("response_received").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
});

// Assignment templates for teacher efficiency
export const assignmentTemplates = pgTable("assignment_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id),
  
  templateName: varchar("template_name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  subjectArea: varchar("subject_area", { length: 50 }),
  
  // Template content
  titleTemplate: varchar("title_template", { length: 200 }),
  descriptionTemplate: text("description_template"),
  learningObjectivesTemplate: text("learning_objectives_template").array(),
  submissionInstructionsTemplate: text("submission_instructions_template"),
  
  // Default settings
  defaultTokenReward: varchar("default_token_reward"),
  defaultDurationDays: integer("default_duration_days"),
  recommendedLinkTypes: text("recommended_link_types").array(),
  
  isPublic: boolean("is_public").default(false), // Whether other teachers can use this template
  useCount: integer("use_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Phase 2A Assignment Management Insert Schemas
export const insertAssignmentAdvancedSchema = createInsertSchema(assignmentsAdvanced).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertAssignmentFeedbackSchema = createInsertSchema(assignmentFeedback).omit({
  id: true,
  createdAt: true
});

export const insertAssignmentTemplateSchema = createInsertSchema(assignmentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Phase 2A Assignment Management Types
export type AssignmentAdvanced = typeof assignmentsAdvanced.$inferSelect;
export type InsertAssignmentAdvanced = z.infer<typeof insertAssignmentAdvancedSchema>;

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = z.infer<typeof insertAssignmentSubmissionSchema>;

export type AssignmentFeedback = typeof assignmentFeedback.$inferSelect;
export type InsertAssignmentFeedback = z.infer<typeof insertAssignmentFeedbackSchema>;

export type AssignmentTemplate = typeof assignmentTemplates.$inferSelect;
export type InsertAssignmentTemplate = z.infer<typeof insertAssignmentTemplateSchema>;

// PHASE 2B: STUDENT MARKETPLACE & PEER-TO-PEER COMMERCE

// Student seller registration and business profiles
export const marketplaceSellers = pgTable("marketplace_sellers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  
  // Business profile information
  businessName: varchar("business_name", { length: 100 }).notNull(),
  businessDescription: text("business_description"),
  sellerBio: text("seller_bio"),
  businessCategory: varchar("business_category", { length: 50 }), // 'digital_services', 'physical_products', 'tutoring', etc.
  
  // Seller status and performance
  sellerStatus: varchar("seller_status", { length: 20 }).default('pending').$type<'pending' | 'approved' | 'active' | 'suspended' | 'inactive'>(),
  approvalDate: timestamp("approval_date"),
  approvedBy: uuid("approved_by").references(() => users.id), // Teacher who approved seller status
  
  // Business metrics and reputation
  totalSalesCount: integer("total_sales_count").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  
  // Business settings and preferences
  autoApproveOrders: boolean("auto_approve_orders").default(true),
  customMessageTemplate: text("custom_message_template"), // Template for order confirmations
  businessHours: jsonb("business_hours"), // When seller is available for orders/communication
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  uniqueStudentClassroom: unique().on(table.studentId, table.classroomId) // One seller profile per student per classroom
}));

// Student marketplace listings with comprehensive product information
export const marketplaceListings = pgTable("marketplace_listings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid("seller_id").references(() => marketplaceSellers.id).notNull(),
  
  // Product/service information
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  tags: text("tags").array().default([]), // Searchable keywords
  
  // Pricing and availability
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }), // For tracking sales and discounts
  listingType: varchar("listing_type", { length: 20 }).notNull().$type<'physical_product' | 'digital_product' | 'service' | 'tutoring' | 'custom_order'>(),
  
  // Inventory management
  inventoryType: varchar("inventory_type", { length: 20 }).notNull().$type<'unlimited' | 'limited' | 'made_to_order'>(),
  quantityAvailable: integer("quantity_available"), // NULL for unlimited/service items
  quantitySold: integer("quantity_sold").default(0),
  maxOrdersPerCustomer: integer("max_orders_per_customer").default(1),
  
  // Listing status and visibility
  status: varchar("status", { length: 20 }).default('draft').$type<'draft' | 'pending_approval' | 'active' | 'paused' | 'sold_out' | 'archived'>(),
  featured: boolean("featured").default(false), // Promoted listings
  priorityOrder: integer("priority_order").default(0), // For seller's own organization
  
  // Media and presentation
  primaryImageUrl: varchar("primary_image_url", { length: 500 }),
  additionalImagesUrls: text("additional_images_urls").array().default([]), // Array of additional image URLs
  videoUrl: varchar("video_url", { length: 500 }), // Optional product demonstration video
  
  // Delivery and fulfillment
  deliveryMethod: varchar("delivery_method", { length: 30 }).default('in_person').$type<'digital_delivery' | 'in_person' | 'teacher_facilitated'>(),
  estimatedDeliveryDays: integer("estimated_delivery_days").default(1),
  customDeliveryNotes: text("custom_delivery_notes"),
  
  // Performance tracking
  viewCount: integer("view_count").default(0),
  wishlistCount: integer("wishlist_count").default(0),
  inquiryCount: integer("inquiry_count").default(0), // Number of customer questions
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 })
});

// Marketplace transactions between students
export const marketplaceTransactions = pgTable("marketplace_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: uuid("listing_id").references(() => marketplaceListings.id).notNull(),
  buyerId: uuid("buyer_id").references(() => users.id).notNull(),
  sellerId: uuid("seller_id").references(() => marketplaceSellers.id).notNull(),
  
  // Transaction details
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // Price at time of purchase
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  tokenTransactionId: uuid("token_transaction_id").references(() => tokenTransactions.id), // Link to token transfer
  
  // Order processing and status
  orderStatus: varchar("order_status", { length: 20 }).default('pending').$type<'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded' | 'disputed'>(),
  sellerNotes: text("seller_notes"), // Seller's internal notes about the order
  customerNotes: text("customer_notes"), // Buyer's special requests or instructions
  
  // Delivery and fulfillment tracking
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  deliveryConfirmation: boolean("delivery_confirmation").default(false),
  deliveryNotes: text("delivery_notes"),
  
  // Communication and feedback
  buyerSatisfied: boolean("buyer_satisfied"), // Customer satisfaction indicator
  requiresSellerResponse: boolean("requires_seller_response").default(false),
  lastCommunication: timestamp("last_communication"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 })
});

// Customer reviews and seller ratings
export const marketplaceReviews = pgTable("marketplace_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid("transaction_id").references(() => marketplaceTransactions.id).notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id).notNull(), // The buyer
  sellerId: uuid("seller_id").references(() => marketplaceSellers.id).notNull(),
  
  // Review content and ratings
  overallRating: integer("overall_rating").notNull(),
  qualityRating: integer("quality_rating"),
  communicationRating: integer("communication_rating"),
  deliveryRating: integer("delivery_rating"),
  
  reviewText: text("review_text"),
  wouldRecommend: boolean("would_recommend"),
  
  // Review status and moderation
  reviewStatus: varchar("review_status", { length: 20 }).default('published').$type<'pending' | 'published' | 'flagged' | 'hidden'>(),
  flaggedReason: text("flagged_reason"),
  moderatedBy: uuid("moderated_by").references(() => users.id), // Teacher who reviewed flagged content
  
  createdAt: timestamp("created_at").defaultNow(),
  academicPeriod: varchar("academic_period", { length: 20 })
}, (table) => ({
  uniqueTransactionReviewer: unique().on(table.transactionId, table.reviewerId) // One review per transaction per customer
}));

// Student marketplace wishlists for market research
export const marketplaceWishlists = pgTable("marketplace_wishlists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  listingId: uuid("listing_id").references(() => marketplaceListings.id).notNull(),
  priorityRank: integer("priority_rank").default(1), // Student's priority ordering
  priceAlertThreshold: decimal("price_alert_threshold", { precision: 10, scale: 2 }), // Notify if price drops below this
  notes: text("notes"), // Student's personal notes
  addedAt: timestamp("added_at").defaultNow()
}, (table) => ({
  uniqueStudentListing: unique().on(table.studentId, table.listingId) // Prevent duplicate wishlist entries
}));

// Marketplace communication between buyers and sellers
export const marketplaceMessages = pgTable("marketplace_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid("transaction_id").references(() => marketplaceTransactions.id),
  listingId: uuid("listing_id").references(() => marketplaceListings.id), // For pre-purchase inquiries
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id).notNull(),
  
  messageContent: text("message_content").notNull(),
  messageType: varchar("message_type", { length: 30 }).default('inquiry').$type<'inquiry' | 'order_update' | 'delivery_info' | 'complaint' | 'compliment'>(),
  
  // Message status and moderation
  readAt: timestamp("read_at"),
  requiresResponse: boolean("requires_response").default(false),
  flagged: boolean("flagged").default(false),
  flaggedReason: text("flagged_reason"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Marketplace Relations
export const marketplaceSellersRelations = relations(marketplaceSellers, ({ one, many }) => ({
  student: one(users, {
    fields: [marketplaceSellers.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [marketplaceSellers.classroomId],
    references: [classrooms.id]
  }),
  approver: one(users, {
    fields: [marketplaceSellers.approvedBy],
    references: [users.id]
  }),
  listings: many(marketplaceListings),
  transactions: many(marketplaceTransactions),
  reviews: many(marketplaceReviews)
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  seller: one(marketplaceSellers, {
    fields: [marketplaceListings.sellerId],
    references: [marketplaceSellers.id]
  }),
  transactions: many(marketplaceTransactions),
  wishlists: many(marketplaceWishlists),
  messages: many(marketplaceMessages)
}));

export const marketplaceTransactionsRelations = relations(marketplaceTransactions, ({ one, many }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceTransactions.listingId],
    references: [marketplaceListings.id]
  }),
  buyer: one(users, {
    fields: [marketplaceTransactions.buyerId],
    references: [users.id]
  }),
  seller: one(marketplaceSellers, {
    fields: [marketplaceTransactions.sellerId],
    references: [marketplaceSellers.id]
  }),
  tokenTransaction: one(tokenTransactions, {
    fields: [marketplaceTransactions.tokenTransactionId],
    references: [tokenTransactions.id]
  }),
  reviews: many(marketplaceReviews),
  messages: many(marketplaceMessages)
}));

export const marketplaceReviewsRelations = relations(marketplaceReviews, ({ one }) => ({
  transaction: one(marketplaceTransactions, {
    fields: [marketplaceReviews.transactionId],
    references: [marketplaceTransactions.id]
  }),
  reviewer: one(users, {
    fields: [marketplaceReviews.reviewerId],
    references: [users.id]
  }),
  seller: one(marketplaceSellers, {
    fields: [marketplaceReviews.sellerId],
    references: [marketplaceSellers.id]
  }),
  moderator: one(users, {
    fields: [marketplaceReviews.moderatedBy],
    references: [users.id]
  })
}));

export const marketplaceWishlistsRelations = relations(marketplaceWishlists, ({ one }) => ({
  student: one(users, {
    fields: [marketplaceWishlists.studentId],
    references: [users.id]
  }),
  listing: one(marketplaceListings, {
    fields: [marketplaceWishlists.listingId],
    references: [marketplaceListings.id]
  })
}));

export const marketplaceMessagesRelations = relations(marketplaceMessages, ({ one }) => ({
  transaction: one(marketplaceTransactions, {
    fields: [marketplaceMessages.transactionId],
    references: [marketplaceTransactions.id]
  }),
  listing: one(marketplaceListings, {
    fields: [marketplaceMessages.listingId],
    references: [marketplaceListings.id]
  }),
  sender: one(users, {
    fields: [marketplaceMessages.senderId],
    references: [users.id]
  }),
  recipient: one(users, {
    fields: [marketplaceMessages.recipientId],
    references: [users.id]
  })
}));

// STUDENT INVENTORY SYSTEM
// Track items students own for trading and marketplace listing
export const studentInventory = pgTable("student_inventory", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  storeItemId: uuid("store_item_id").references(() => storeItems.id).notNull(),
  purchaseId: uuid("purchase_id").references(() => purchases.id).notNull(),
  
  // Current status of the item
  status: varchar("status", { length: 20 }).notNull().$type<'owned' | 'listed_for_trade' | 'listed_for_sale' | 'in_trade' | 'sold'>().default('owned'),
  
  // Trading and marketplace tracking
  currentTradeOfferId: uuid("current_trade_offer_id"),
  currentMarketListingId: uuid("current_market_listing_id"),
  
  // Item condition and notes
  condition: varchar("condition", { length: 20 }).$type<'new' | 'like_new' | 'good' | 'fair'>().default('new'),
  studentNotes: text("student_notes"),
  
  acquiredAt: timestamp("acquired_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  studentIdIdx: index("student_inventory_student_id_idx").on(table.studentId),
  classroomIdIdx: index("student_inventory_classroom_id_idx").on(table.classroomId),
  storeItemIdIdx: index("student_inventory_store_item_id_idx").on(table.storeItemId),
  statusIdx: index("student_inventory_status_idx").on(table.status)
}));

// PEER-TO-PEER TRADING SYSTEM
// Trade offers for item-for-item exchanges (no tokens involved)
export const tradeOffers = pgTable("trade_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  
  // Offering student and their item
  offeringStudentId: uuid("offering_student_id").references(() => users.id).notNull(),
  offeredInventoryId: uuid("offered_inventory_id").references(() => studentInventory.id).notNull(),
  
  // What they want in return (optional - can be open offer)
  wantedStoreItemId: uuid("wanted_store_item_id").references(() => storeItems.id),
  wantedItemDescription: text("wanted_item_description"), // Flexible description of what they want
  
  // Trade completion
  acceptingStudentId: uuid("accepting_student_id").references(() => users.id),
  acceptedInventoryId: uuid("accepted_inventory_id").references(() => studentInventory.id),
  
  // Status and lifecycle
  status: varchar("status", { length: 20 }).notNull().$type<'open' | 'pending_acceptance' | 'completed' | 'cancelled' | 'expired'>().default('open'),
  
  // Additional details
  publicMessage: text("public_message"), // What the offering student says about the trade
  privateNotes: text("private_notes"), // Private notes from offering student
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration
  completedAt: timestamp("completed_at")
}, (table) => ({
  classroomIdIdx: index("trade_offers_classroom_id_idx").on(table.classroomId),
  offeringStudentIdIdx: index("trade_offers_offering_student_id_idx").on(table.offeringStudentId),
  acceptingStudentIdIdx: index("trade_offers_accepting_student_id_idx").on(table.acceptingStudentId),
  statusIdx: index("trade_offers_status_idx").on(table.status),
  createdAtIdx: index("trade_offers_created_at_idx").on(table.createdAt)
}));

// Trade responses/interest from other students
export const tradeResponses = pgTable("trade_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tradeOfferId: uuid("trade_offer_id").references(() => tradeOffers.id).notNull(),
  respondingStudentId: uuid("responding_student_id").references(() => users.id).notNull(),
  offeredInventoryId: uuid("offered_inventory_id").references(() => studentInventory.id).notNull(),
  
  message: text("message"), // What the responding student offers/says
  status: varchar("status", { length: 20 }).notNull().$type<'pending' | 'accepted' | 'declined' | 'withdrawn'>().default('pending'),
  
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at")
}, (table) => ({
  tradeOfferIdIdx: index("trade_responses_trade_offer_id_idx").on(table.tradeOfferId),
  respondingStudentIdIdx: index("trade_responses_responding_student_id_idx").on(table.respondingStudentId),
  statusIdx: index("trade_responses_status_idx").on(table.status)
}));

// GROUP BUY SYSTEM (GoFundMe-style collaborative purchases)
export const groupBuys = pgTable("group_buys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: uuid("classroom_id").references(() => classrooms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(), // Teacher who created it
  
  // Group buy details
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  
  // Funding details
  goalAmount: integer("goal_amount").notNull(), // Total tokens needed
  currentAmount: integer("current_amount").default(0).notNull(), // Tokens pledged so far
  minContribution: integer("min_contribution").default(1).notNull(),
  maxContribution: integer("max_contribution"), // Optional maximum per student
  
  // Availability and status
  status: varchar("status", { length: 20 }).notNull().$type<'active' | 'funded' | 'completed' | 'cancelled' | 'expired'>().default('active'),
  isActive: boolean("is_active").default(true),
  
  // Timeline
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at").notNull(), // Deadline for funding
  completedAt: timestamp("completed_at"),
  
  // Templates and categories
  isTemplate: boolean("is_template").default(false),
  templateCategory: varchar("template_category", { length: 50 }),
  
  // Rewards and delivery
  deliveryMethod: varchar("delivery_method", { length: 30 }).$type<'immediate' | 'scheduled' | 'teacher_managed'>().default('teacher_managed'),
  deliveryNotes: text("delivery_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  classroomIdIdx: index("group_buys_classroom_id_idx").on(table.classroomId),
  createdByIdx: index("group_buys_created_by_idx").on(table.createdBy),
  statusIdx: index("group_buys_status_idx").on(table.status),
  endsAtIdx: index("group_buys_ends_at_idx").on(table.endsAt),
  templateCategoryIdx: index("group_buys_template_category_idx").on(table.templateCategory)
}));

// Individual contributions to group buys
export const groupBuyContributions = pgTable("group_buy_contributions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  groupBuyId: uuid("group_buy_id").references(() => groupBuys.id).notNull(),
  studentId: uuid("student_id").references(() => users.id).notNull(),
  
  amount: integer("amount").notNull(), // Tokens contributed
  message: text("message"), // Optional message from student
  isAnonymous: boolean("is_anonymous").default(false),
  
  // Transaction tracking
  tokenTransactionId: uuid("token_transaction_id").references(() => tokenTransactions.id),
  
  contributedAt: timestamp("contributed_at").defaultNow()
}, (table) => ({
  groupBuyIdIdx: index("group_buy_contributions_group_buy_id_idx").on(table.groupBuyId),
  studentIdIdx: index("group_buy_contributions_student_id_idx").on(table.studentId),
  contributedAtIdx: index("group_buy_contributions_contributed_at_idx").on(table.contributedAt),
  // Unique constraint to prevent duplicate contributions (students can contribute multiple times)
  uniqueContribution: unique("unique_student_group_buy_contribution").on(table.groupBuyId, table.studentId, table.contributedAt)
}));

// Pre-built group buy templates for teachers
export const groupBuyTemplates = pgTable("group_buy_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull(),
  suggestedGoalAmount: integer("suggested_goal_amount").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  
  imageUrl: varchar("image_url", { length: 500 }),
  tags: text("tags").array().default([]),
  
  // Template metadata
  isPopular: boolean("is_popular").default(false),
  usageCount: integer("usage_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  categoryIdx: index("group_buy_templates_category_idx").on(table.category),
  isPopularIdx: index("group_buy_templates_is_popular_idx").on(table.isPopular)
}));

// Marketplace Insert Schemas
export const insertMarketplaceSellerSchema = createInsertSchema(marketplaceSellers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvalDate: true
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMarketplaceTransactionSchema = createInsertSchema(marketplaceTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMarketplaceReviewSchema = createInsertSchema(marketplaceReviews).omit({
  id: true,
  createdAt: true
});

export const insertMarketplaceWishlistSchema = createInsertSchema(marketplaceWishlists).omit({
  id: true,
  addedAt: true
});

export const insertMarketplaceMessageSchema = createInsertSchema(marketplaceMessages).omit({
  id: true,
  createdAt: true
});

// Economy & Marketplace Insert Schemas
export const insertStudentInventorySchema = createInsertSchema(studentInventory).omit({
  id: true,
  acquiredAt: true,
  updatedAt: true
});

export const insertTradeOfferSchema = createInsertSchema(tradeOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});

export const insertTradeResponseSchema = createInsertSchema(tradeResponses).omit({
  id: true,
  createdAt: true,
  respondedAt: true
});

export const insertGroupBuySchema = createInsertSchema(groupBuys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});

export const insertGroupBuyContributionSchema = createInsertSchema(groupBuyContributions).omit({
  id: true,
  contributedAt: true
});

export const insertGroupBuyTemplateSchema = createInsertSchema(groupBuyTemplates).omit({
  id: true,
  createdAt: true
});

// Economy & Marketplace Relations
export const studentInventoryRelations = relations(studentInventory, ({ one }) => ({
  student: one(users, {
    fields: [studentInventory.studentId],
    references: [users.id]
  }),
  classroom: one(classrooms, {
    fields: [studentInventory.classroomId],
    references: [classrooms.id]
  }),
  storeItem: one(storeItems, {
    fields: [studentInventory.storeItemId],
    references: [storeItems.id]
  }),
  purchase: one(purchases, {
    fields: [studentInventory.purchaseId],
    references: [purchases.id]
  })
}));

export const tradeOffersRelations = relations(tradeOffers, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [tradeOffers.classroomId],
    references: [classrooms.id]
  }),
  offeringStudent: one(users, {
    fields: [tradeOffers.offeringStudentId],
    references: [users.id]
  }),
  acceptingStudent: one(users, {
    fields: [tradeOffers.acceptingStudentId],
    references: [users.id]
  }),
  offeredInventory: one(studentInventory, {
    fields: [tradeOffers.offeredInventoryId],
    references: [studentInventory.id]
  }),
  acceptedInventory: one(studentInventory, {
    fields: [tradeOffers.acceptedInventoryId],
    references: [studentInventory.id]
  }),
  wantedStoreItem: one(storeItems, {
    fields: [tradeOffers.wantedStoreItemId],
    references: [storeItems.id]
  }),
  responses: many(tradeResponses)
}));

export const tradeResponsesRelations = relations(tradeResponses, ({ one }) => ({
  tradeOffer: one(tradeOffers, {
    fields: [tradeResponses.tradeOfferId],
    references: [tradeOffers.id]
  }),
  respondingStudent: one(users, {
    fields: [tradeResponses.respondingStudentId],
    references: [users.id]
  }),
  offeredInventory: one(studentInventory, {
    fields: [tradeResponses.offeredInventoryId],
    references: [studentInventory.id]
  })
}));

export const groupBuysRelations = relations(groupBuys, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [groupBuys.classroomId],
    references: [classrooms.id]
  }),
  creator: one(users, {
    fields: [groupBuys.createdBy],
    references: [users.id]
  }),
  contributions: many(groupBuyContributions)
}));

export const groupBuyContributionsRelations = relations(groupBuyContributions, ({ one }) => ({
  groupBuy: one(groupBuys, {
    fields: [groupBuyContributions.groupBuyId],
    references: [groupBuys.id]
  }),
  student: one(users, {
    fields: [groupBuyContributions.studentId],
    references: [users.id]
  }),
  tokenTransaction: one(tokenTransactions, {
    fields: [groupBuyContributions.tokenTransactionId],
    references: [tokenTransactions.id]
  })
}));

// Economy & Marketplace Types
export type StudentInventory = typeof studentInventory.$inferSelect;
export type InsertStudentInventory = z.infer<typeof insertStudentInventorySchema>;

export type TradeOffer = typeof tradeOffers.$inferSelect;
export type InsertTradeOffer = z.infer<typeof insertTradeOfferSchema>;

export type TradeResponse = typeof tradeResponses.$inferSelect;
export type InsertTradeResponse = z.infer<typeof insertTradeResponseSchema>;

export type GroupBuy = typeof groupBuys.$inferSelect;
export type InsertGroupBuy = z.infer<typeof insertGroupBuySchema>;

export type GroupBuyContribution = typeof groupBuyContributions.$inferSelect;
export type InsertGroupBuyContribution = z.infer<typeof insertGroupBuyContributionSchema>;

export type GroupBuyTemplate = typeof groupBuyTemplates.$inferSelect;
export type InsertGroupBuyTemplate = z.infer<typeof insertGroupBuyTemplateSchema>;

// Marketplace Types
export type MarketplaceSeller = typeof marketplaceSellers.$inferSelect;
export type InsertMarketplaceSeller = z.infer<typeof insertMarketplaceSellerSchema>;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;
export type InsertMarketplaceTransaction = z.infer<typeof insertMarketplaceTransactionSchema>;

export type MarketplaceReview = typeof marketplaceReviews.$inferSelect;
export type InsertMarketplaceReview = z.infer<typeof insertMarketplaceReviewSchema>;

export type MarketplaceWishlist = typeof marketplaceWishlists.$inferSelect;
export type InsertMarketplaceWishlist = z.infer<typeof insertMarketplaceWishlistSchema>;

export type MarketplaceMessage = typeof marketplaceMessages.$inferSelect;
export type InsertMarketplaceMessage = z.infer<typeof insertMarketplaceMessageSchema>;
