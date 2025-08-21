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
  parentTransactionId: uuid("parent_transaction_id").references(() => tokenTransactions.id),
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
export type StudentBadge = typeof studentBadges.$inferSelect;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
