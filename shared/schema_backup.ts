// Add after the proposals table

// Proposal feedback and communication tracking
export const proposalFeedback = pgTable("proposal_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").references(() => proposals.id, { onDelete: "cascade" }),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  
  feedbackType: varchar("feedback_type", { length: 30 }), // 'initial_review', 'revision_request', 'approval', 'rejection', 'student_response'
  feedbackContent: text("feedback_content").notNull(),
  isPublic: boolean("is_public").default(true), // Whether student can see this feedback
  
  // Communication tracking
  responseRequested: boolean("response_requested").default(false),
  responseReceived: boolean("response_received").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
});

// Proposal notifications for real-time updates
export const proposalNotifications = pgTable("proposal_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").references(() => proposals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  
  notificationType: varchar("notification_type", { length: 30 }), // 'status_change', 'feedback_received', 'deadline_reminder', 'approval', 'rejection'
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url", { length: 500 }), // URL to relevant page
  
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at")
});

// Special project templates for quick creation
export const proposalTemplates = pgTable("proposal_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").references(() => users.id),
  classroomId: varchar("classroom_id").references(() => classrooms.id),
  
  templateName: varchar("template_name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // 'research', 'creative', 'technical', 'business'
  
  // Template content
  titleTemplate: varchar("title_template", { length: 200 }),
  contentTemplate: text("content_template"),
  scopeTemplate: text("scope_template"),
  milestonesTemplate: text("milestones_template").array(),
  
  // Default settings
  defaultDurationDays: integer("default_duration_days").default(14),
  defaultPriority: varchar("default_priority", { length: 10 }).default('medium'),
  suggestedAttachments: text("suggested_attachments").array(),
  
  isPublic: boolean("is_public").default(false), // Whether other teachers can use this template
  useCount: integer("use_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
