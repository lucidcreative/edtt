import {
  users,
  classrooms,
  studentClassrooms,
  classroomEnrollments,
  announcements,
  announcementReads,
  assignments,
  submissions,
  storeItems,
  purchases,
  badges,
  studentBadges,
  challenges,
  challengeProgress,
  // Phase 1C Token Economy Tables
  studentWallets,
  tokenTransactions,
  tokenCategories,
  teacherAwardPresets,
  studentMilestones,
  // Phase 1D Digital Store Tables
  storeItemsAdvanced,
  storePurchases,
  studentWishlists,
  storeAnalytics,
  type User,
  type InsertUser,
  type Classroom,
  type InsertClassroom,
  type ClassroomEnrollment,
  type InsertClassroomEnrollment,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementRead,
  type InsertAnnouncementRead,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type StoreItem,
  type InsertStoreItem,
  type Badge,
  type InsertBadge,
  type Challenge,
  type InsertChallenge,
  type StudentClassroom,
  type Purchase,
  type StudentBadge,
  type ChallengeProgress,
  // Phase 1C Token Economy Types
  type StudentWallet,
  type InsertStudentWallet,
  type TokenTransaction,
  type InsertTokenTransaction,
  type TokenCategory,
  type InsertTokenCategory,
  type TeacherAwardPreset,
  type InsertTeacherAwardPreset,
  type StudentMilestone,
  type InsertStudentMilestone,
  // Phase 1D Digital Store Types
  type StoreItemAdvanced,
  type InsertStoreItemAdvanced,
  type StorePurchase,
  type InsertStorePurchase,
  type StudentWishlist,
  type InsertStudentWishlist,
  type StoreAnalytics,
  type InsertStoreAnalytics,
  // Phase 2A Assignment Management Tables & Types
  assignmentsAdvanced,
  assignmentSubmissions,
  assignmentFeedback,
  assignmentTemplates,
  type AssignmentAdvanced,
  type InsertAssignmentAdvanced,
  type AssignmentSubmission,
  type InsertAssignmentSubmission,
  type AssignmentFeedback,
  type InsertAssignmentFeedback,
  type AssignmentTemplate,
  type InsertAssignmentTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByNickname(nickname: string, classroomId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserTokens(id: string, tokens: number): Promise<User>;
  
  // Classroom operations
  getClassroom(id: string): Promise<Classroom | undefined>;
  getClassroomByCode(code: string): Promise<Classroom | undefined>;
  getClassroomsByTeacher(teacherId: string): Promise<Classroom[]>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  updateClassroom(id: string, updates: Partial<InsertClassroom>): Promise<Classroom>;
  
  // Student-Classroom operations (legacy)
  joinClassroom(studentId: string, classroomId: string): Promise<StudentClassroom>;
  getClassroomStudents(classroomId: string): Promise<(User & { joinedAt: Date })[]>;
  getStudentClassrooms(studentId: string): Promise<Classroom[]>;
  
  // Enhanced Classroom Enrollment operations
  generateJoinCode(): string;
  getClassroomByJoinCode(joinCode: string): Promise<Classroom | undefined>;
  createEnrollment(enrollment: InsertClassroomEnrollment): Promise<ClassroomEnrollment>;
  approveEnrollment(enrollmentId: string, approverId: string): Promise<ClassroomEnrollment>;
  denyEnrollment(enrollmentId: string, approverId: string): Promise<ClassroomEnrollment>;
  getClassroomEnrollments(classroomId: string): Promise<(ClassroomEnrollment & { student: User })[]>;
  getStudentEnrollments(studentId: string): Promise<(ClassroomEnrollment & { classroom: Classroom })[]>;
  getPendingEnrollments(classroomId: string): Promise<(ClassroomEnrollment & { student: User })[]>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClassroom(classroomId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment>;
  
  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<InsertSubmission>): Promise<Submission>;
  
  // Store operations
  getStoreItem(id: string): Promise<StoreItem | undefined>;
  getStoreItemsByClassroom(classroomId: string): Promise<StoreItem[]>;
  createStoreItem(item: InsertStoreItem): Promise<StoreItem>;
  updateStoreItem(id: string, updates: Partial<InsertStoreItem>): Promise<StoreItem>;
  
  // Purchase operations
  createPurchase(purchase: Omit<Purchase, 'id' | 'purchasedAt'>): Promise<Purchase>;
  getPurchasesByStudent(studentId: string): Promise<Purchase[]>;
  
  // Badge operations
  getBadge(id: string): Promise<Badge | undefined>;
  getBadgesByClassroom(classroomId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  awardBadge(studentId: string, badgeId: string): Promise<StudentBadge>;
  getStudentBadges(studentId: string): Promise<(StudentBadge & { badge: Badge })[]>;
  
  // Challenge operations
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallengesByClassroom(classroomId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallengeProgress(studentId: string, challengeId: string, progress: number): Promise<ChallengeProgress>;
  getStudentChallengeProgress(studentId: string, classroomId: string): Promise<(ChallengeProgress & { challenge: Challenge })[]>;
  
  // Dashboard/Analytics operations
  getClassroomStats(classroomId: string): Promise<{
    totalStudents: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingSubmissions: number;
  }>;
  getLeaderboard(classroomId: string, limit?: number): Promise<User[]>;
  getStudentProgress(studentId: string, classroomId: string): Promise<{
    totalTokens: number;
    level: number;
    completedAssignments: number;
    badges: number;
  }>;
  
  // Announcement operations
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  getAnnouncementsByClassroom(classroomId: string, limit?: number): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement>;
  markAnnouncementAsRead(announcementId: string, studentId: string): Promise<AnnouncementRead>;
  getUnreadAnnouncements(classroomId: string, studentId: string): Promise<Announcement[]>;

  // PHASE 1C: TOKEN ECONOMY OPERATIONS
  
  // Student Wallet Management
  getStudentWallet(studentId: string, classroomId: string): Promise<StudentWallet | undefined>;
  createStudentWallet(wallet: InsertStudentWallet): Promise<StudentWallet>;
  updateWalletBalance(walletId: string, newBalance: number, totalEarned: number, totalSpent: number): Promise<StudentWallet>;
  
  // Token Transaction Processing
  createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction>;
  getWalletTransactions(walletId: string, limit?: number, offset?: number): Promise<TokenTransaction[]>;
  getStudentTransactions(studentId: string, classroomId: string, limit?: number): Promise<TokenTransaction[]>;
  
  // Atomic Token Award Operation
  awardTokens(data: {
    studentIds: string[];
    amount: number;
    category: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
    createdBy: string;
    classroomId: string;
  }): Promise<{ transactions: TokenTransaction[]; updatedWallets: StudentWallet[] }>;
  
  // Token Categories
  getTokenCategories(classroomId: string): Promise<TokenCategory[]>;
  createTokenCategory(category: InsertTokenCategory): Promise<TokenCategory>;
  
  // Teacher Award Presets
  getTeacherPresets(teacherId: string, classroomId: string): Promise<TeacherAwardPreset[]>;
  createAwardPreset(preset: InsertTeacherAwardPreset): Promise<TeacherAwardPreset>;
  updatePresetUsage(presetId: string): Promise<void>;
  
  // Student Milestones
  createMilestone(milestone: InsertStudentMilestone): Promise<StudentMilestone>;
  getStudentMilestones(studentId: string, classroomId: string): Promise<StudentMilestone[]>;
  checkAndCreateMilestones(studentId: string, classroomId: string, newBalance: number): Promise<StudentMilestone[]>;

  // PHASE 1D: DIGITAL STORE OPERATIONS
  
  // Store Item Management (Teacher)
  createStoreItem(item: InsertStoreItemAdvanced): Promise<StoreItemAdvanced>;
  updateStoreItem(itemId: string, updates: Partial<InsertStoreItemAdvanced>): Promise<StoreItemAdvanced>;
  deleteStoreItem(itemId: string): Promise<void>;
  getStoreItems(classroomId: string, filters?: {
    category?: string;
    itemType?: string;
    activeOnly?: boolean;
    featured?: boolean;
  }): Promise<StoreItemAdvanced[]>;
  getStoreItem(itemId: string): Promise<StoreItemAdvanced | undefined>;
  
  // Store Inventory Management
  updateItemInventory(itemId: string, quantityChange: number): Promise<StoreItemAdvanced>;
  checkItemAvailability(itemId: string, requestedQuantity: number): Promise<boolean>;
  
  // Student Shopping Experience
  getAvailableStoreItems(classroomId: string, studentId: string): Promise<StoreItemAdvanced[]>;
  getItemsInPriceRange(classroomId: string, maxPrice: number): Promise<StoreItemAdvanced[]>;
  
  // Purchase Processing
  createPurchase(purchase: InsertStorePurchase): Promise<StorePurchase>;
  processPurchase(data: {
    studentId: string;
    classroomId: string;
    itemId: string;
    quantity: number;
  }): Promise<{ purchase: StorePurchase; transaction: TokenTransaction; updatedWallet: StudentWallet }>;
  
  // Purchase History and Management
  getStudentPurchases(studentId: string, classroomId: string, limit?: number): Promise<(StorePurchase & { item: StoreItemAdvanced })[]>;
  getPurchaseById(purchaseId: string): Promise<(StorePurchase & { item: StoreItemAdvanced; student: User }) | undefined>;
  updatePurchaseStatus(purchaseId: string, status: string, deliveryNotes?: string): Promise<StorePurchase>;
  
  // Wishlist Management
  addToWishlist(wishlistItem: InsertStudentWishlist): Promise<StudentWishlist>;
  removeFromWishlist(studentId: string, itemId: string): Promise<void>;
  getStudentWishlist(studentId: string, classroomId: string): Promise<(StudentWishlist & { item: StoreItemAdvanced })[]>;
  updateWishlistPriority(wishlistId: string, priority: number): Promise<StudentWishlist>;
  
  // Subscription Management
  createSubscription(purchaseId: string, recurringData: {
    interval: string;
    amount: number;
    nextBillingDate: Date;
  }): Promise<StorePurchase>;
  processRecurringBilling(subscriptionId: string): Promise<{ success: boolean; transaction?: TokenTransaction }>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<StorePurchase>;
  getActiveSubscriptions(studentId: string, classroomId: string): Promise<StorePurchase[]>;
  
  // Store Analytics
  trackItemView(classroomId: string, itemId: string, studentId: string): Promise<void>;
  recordItemInteraction(classroomId: string, itemId: string, action: 'view' | 'wishlist_add' | 'purchase'): Promise<void>;
  getStoreAnalytics(classroomId: string, itemId?: string, dateRange?: { start: Date; end: Date }): Promise<StoreAnalytics[]>;
  
  // Teacher Store Insights
  getPopularItems(classroomId: string, limit?: number): Promise<(StoreItemAdvanced & { purchaseCount: number; revenue: number })[]>;
  getStoreRevenue(classroomId: string, period: 'week' | 'month' | 'semester'): Promise<{ totalRevenue: number; totalPurchases: number; topCategories: any[] }>;
  getStudentSpendingInsights(classroomId: string): Promise<{ studentId: string; totalSpent: number; favoriteCategory: string }[]>;
  getAnnouncementReads(announcementId: string): Promise<(AnnouncementRead & { student: User })[]>;

  // Phase 2A: Assignment Management Methods
  createAssignment(assignment: InsertAssignmentAdvanced): Promise<AssignmentAdvanced>;
  updateAssignment(assignmentId: string, updates: Partial<InsertAssignmentAdvanced>): Promise<AssignmentAdvanced>;
  deleteAssignment(assignmentId: string): Promise<void>;
  getAssignments(classroomId: string, filters?: { status?: string; category?: string; visibleToStudents?: boolean; }): Promise<AssignmentAdvanced[]>;
  getAssignment(assignmentId: string): Promise<AssignmentAdvanced | undefined>;
  getStudentAssignments(studentId: string, classroomId: string): Promise<(AssignmentAdvanced & { submission?: AssignmentSubmission })[]>;
  createSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  updateSubmission(submissionId: string, updates: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission>;
  getSubmission(submissionId: string): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissions(assignmentId: string): Promise<(AssignmentSubmission & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]>;
  getStudentSubmissions(studentId: string, classroomId: string): Promise<(AssignmentSubmission & { assignment: Pick<AssignmentAdvanced, 'id' | 'title' | 'dueDate'> })[]>;
  createAssignmentFeedback(feedback: InsertAssignmentFeedback): Promise<AssignmentFeedback>;
  getAssignmentFeedback(submissionId: string): Promise<AssignmentFeedback[]>;
  getAssignmentTemplates(createdBy?: string): Promise<AssignmentTemplate[]>;
  createAssignmentTemplate(template: InsertAssignmentTemplate): Promise<AssignmentTemplate>;
  getAssignmentAnalytics(classroomId: string, assignmentId?: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByNickname(nickname: string, classroomId: string): Promise<User | undefined> {
    const [user] = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(and(
        eq(users.nickname, nickname),
        eq(studentClassrooms.classroomId, classroomId)
      ));
    return user?.user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<Omit<InsertUser, 'role'>> & { role?: 'teacher' | 'student' | 'admin' }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserTokens(id: string, tokens: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        tokens,
        totalEarnings: sql`${users.totalEarnings} + ${tokens}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Classroom operations
  async getClassroom(id: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async getClassroomByCode(code: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.joinCode, code));
    return classroom;
  }

  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    return db.select().from(classrooms).where(eq(classrooms.teacherId, teacherId));
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    // Ensure code is set if not provided (for backwards compatibility)
    const classroomData = {
      ...classroom,
      code: classroom.code || classroom.joinCode
    };
    const [newClassroom] = await db.insert(classrooms).values(classroomData).returning();
    return newClassroom;
  }

  async updateClassroom(id: string, updates: Partial<InsertClassroom>): Promise<Classroom> {
    const [updatedClassroom] = await db
      .update(classrooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classrooms.id, id))
      .returning();
    return updatedClassroom;
  }

  // Student-Classroom operations
  async joinClassroom(studentId: string, classroomId: string): Promise<StudentClassroom> {
    const [enrollment] = await db
      .insert(studentClassrooms)
      .values({ studentId, classroomId })
      .returning();
    return enrollment;
  }

  async getClassroomStudents(classroomId: string): Promise<(User & { joinedAt: Date })[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        pinHash: users.pinHash,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        tempPasswordFlag: users.tempPasswordFlag,
        emailVerified: users.emailVerified,
        accountApproved: users.accountApproved,
        loginAttempts: users.loginAttempts,
        lockoutUntil: users.lockoutUntil,
        tokens: users.tokens,
        level: users.level,
        totalEarnings: users.totalEarnings,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLogin: users.lastLogin,
        joinedAt: studentClassrooms.joinedAt
      })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(eq(studentClassrooms.classroomId, classroomId))
      .orderBy(desc(users.tokens));
    
    return result.map(row => ({ ...row, joinedAt: row.joinedAt! }));
  }

  async getStudentClassrooms(studentId: string): Promise<Classroom[]> {
    const result = await db
      .select({ classroom: classrooms })
      .from(classrooms)
      .innerJoin(studentClassrooms, eq(classrooms.id, studentClassrooms.classroomId))
      .where(eq(studentClassrooms.studentId, studentId));
    
    return result.map(row => row.classroom);
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByClassroom(classroomId: string): Promise<Assignment[]> {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.classroomId, classroomId))
      .orderBy(desc(assignments.createdAt));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<Omit<InsertSubmission, 'status'>> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Store operations
  async getStoreItem(id: string): Promise<StoreItem | undefined> {
    const [item] = await db.select().from(storeItems).where(eq(storeItems.id, id));
    return item;
  }

  async getStoreItemsByClassroom(classroomId: string): Promise<StoreItem[]> {
    return db
      .select()
      .from(storeItems)
      .where(eq(storeItems.classroomId, classroomId))
      .orderBy(asc(storeItems.cost));
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const [newItem] = await db.insert(storeItems).values(item).returning();
    return newItem;
  }

  async updateStoreItem(id: string, updates: Partial<InsertStoreItem>): Promise<StoreItem> {
    const [updatedItem] = await db
      .update(storeItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(storeItems.id, id))
      .returning();
    return updatedItem;
  }

  // Purchase operations
  async createPurchase(purchase: Omit<Purchase, 'id' | 'purchasedAt'>): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async getPurchasesByStudent(studentId: string): Promise<Purchase[]> {
    return db
      .select()
      .from(purchases)
      .where(eq(purchases.studentId, studentId))
      .orderBy(desc(purchases.purchasedAt));
  }

  // Badge operations
  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getBadgesByClassroom(classroomId: string): Promise<Badge[]> {
    return db
      .select()
      .from(badges)
      .where(eq(badges.classroomId, classroomId))
      .orderBy(asc(badges.name));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async awardBadge(studentId: string, badgeId: string): Promise<StudentBadge> {
    const [award] = await db
      .insert(studentBadges)
      .values({ studentId, badgeId })
      .returning();
    return award;
  }

  async getStudentBadges(studentId: string): Promise<(StudentBadge & { badge: Badge })[]> {
    const result = await db
      .select({
        id: studentBadges.id,
        studentId: studentBadges.studentId,
        badgeId: studentBadges.badgeId,
        earnedAt: studentBadges.earnedAt,
        badge: badges
      })
      .from(studentBadges)
      .innerJoin(badges, eq(studentBadges.badgeId, badges.id))
      .where(eq(studentBadges.studentId, studentId))
      .orderBy(desc(studentBadges.earnedAt));
    
    return result;
  }

  // Challenge operations
  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getChallengesByClassroom(classroomId: string): Promise<Challenge[]> {
    return db
      .select()
      .from(challenges)
      .where(eq(challenges.classroomId, classroomId))
      .orderBy(desc(challenges.createdAt));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async updateChallengeProgress(studentId: string, challengeId: string, progress: number): Promise<ChallengeProgress> {
    const [existing] = await db
      .select()
      .from(challengeProgress)
      .where(and(
        eq(challengeProgress.studentId, studentId),
        eq(challengeProgress.challengeId, challengeId)
      ));

    if (existing) {
      const [updated] = await db
        .update(challengeProgress)
        .set({ 
          currentValue: progress,
          completed: progress >= (existing as any).targetValue,
          completedAt: progress >= (existing as any).targetValue ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(challengeProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db
        .insert(challengeProgress)
        .values({ studentId, challengeId, currentValue: progress })
        .returning();
      return newProgress;
    }
  }

  async getStudentChallengeProgress(studentId: string, classroomId: string): Promise<(ChallengeProgress & { challenge: Challenge })[]> {
    const result = await db
      .select({
        id: challengeProgress.id,
        studentId: challengeProgress.studentId,
        challengeId: challengeProgress.challengeId,
        currentValue: challengeProgress.currentValue,
        completed: challengeProgress.completed,
        completedAt: challengeProgress.completedAt,
        updatedAt: challengeProgress.updatedAt,
        challenge: challenges
      })
      .from(challengeProgress)
      .innerJoin(challenges, eq(challengeProgress.challengeId, challenges.id))
      .where(and(
        eq(challengeProgress.studentId, studentId),
        eq(challenges.classroomId, classroomId)
      ))
      .orderBy(desc(challengeProgress.updatedAt));
    
    return result;
  }

  // Dashboard/Analytics operations
  async getClassroomStats(classroomId: string): Promise<{
    totalStudents: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingSubmissions: number;
  }> {
    const [studentCount] = await db
      .select({ count: count() })
      .from(studentClassrooms)
      .where(eq(studentClassrooms.classroomId, classroomId));

    const [assignmentCount] = await db
      .select({ count: count() })
      .from(assignments)
      .where(eq(assignments.classroomId, classroomId));

    const [completedCount] = await db
      .select({ count: count() })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(and(
        eq(assignments.classroomId, classroomId),
        eq(submissions.status, 'approved')
      ));

    const [pendingCount] = await db
      .select({ count: count() })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(and(
        eq(assignments.classroomId, classroomId),
        eq(submissions.status, 'pending')
      ));

    return {
      totalStudents: studentCount.count,
      totalAssignments: assignmentCount.count,
      completedAssignments: completedCount.count,
      pendingSubmissions: pendingCount.count
    };
  }

  async getLeaderboard(classroomId: string, limit = 10): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(eq(studentClassrooms.classroomId, classroomId))
      .orderBy(desc(users.tokens))
      .limit(limit);
    
    return result.map(row => row.user);
  }

  async getStudentProgress(studentId: string, classroomId: string): Promise<{
    totalTokens: number;
    level: number;
    completedAssignments: number;
    badges: number;
  }> {
    const [user] = await db.select().from(users).where(eq(users.id, studentId));
    
    const [completedAssignments] = await db
      .select({ count: count() })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(and(
        eq(submissions.studentId, studentId),
        eq(assignments.classroomId, classroomId),
        eq(submissions.status, 'approved')
      ));

    const [badgeCount] = await db
      .select({ count: count() })
      .from(studentBadges)
      .where(eq(studentBadges.studentId, studentId));

    return {
      totalTokens: user?.tokens || 0,
      level: user?.level || 1,
      completedAssignments: completedAssignments.count,
      badges: badgeCount.count
    };
  }

  // Enhanced Classroom Enrollment operations
  generateJoinCode(): string {
    // Generate 6-character alphanumeric code avoiding confusing characters
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getClassroomByJoinCode(joinCode: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.joinCode, joinCode));
    return classroom;
  }

  async createEnrollment(enrollment: InsertClassroomEnrollment): Promise<ClassroomEnrollment> {
    const [newEnrollment] = await db.insert(classroomEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async approveEnrollment(enrollmentId: string, approverId: string): Promise<ClassroomEnrollment> {
    const [updated] = await db
      .update(classroomEnrollments)
      .set({ 
        enrollmentStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: approverId
      })
      .where(eq(classroomEnrollments.id, enrollmentId))
      .returning();
    return updated;
  }

  async denyEnrollment(enrollmentId: string, approverId: string): Promise<ClassroomEnrollment> {
    const [updated] = await db
      .update(classroomEnrollments)
      .set({ 
        enrollmentStatus: 'denied',
        approvedAt: new Date(),
        approvedBy: approverId
      })
      .where(eq(classroomEnrollments.id, enrollmentId))
      .returning();
    return updated;
  }

  async getClassroomEnrollments(classroomId: string): Promise<(ClassroomEnrollment & { student: User })[]> {
    const result = await db
      .select({
        id: classroomEnrollments.id,
        studentId: classroomEnrollments.studentId,
        classroomId: classroomEnrollments.classroomId,
        enrollmentStatus: classroomEnrollments.enrollmentStatus,
        enrolledAt: classroomEnrollments.enrolledAt,
        approvedAt: classroomEnrollments.approvedAt,
        approvedBy: classroomEnrollments.approvedBy,
        student: users
      })
      .from(classroomEnrollments)
      .innerJoin(users, eq(classroomEnrollments.studentId, users.id))
      .where(eq(classroomEnrollments.classroomId, classroomId))
      .orderBy(desc(classroomEnrollments.enrolledAt));
    return result;
  }

  async getStudentEnrollments(studentId: string): Promise<(ClassroomEnrollment & { classroom: Classroom })[]> {
    const result = await db
      .select({
        id: classroomEnrollments.id,
        studentId: classroomEnrollments.studentId,
        classroomId: classroomEnrollments.classroomId,
        enrollmentStatus: classroomEnrollments.enrollmentStatus,
        enrolledAt: classroomEnrollments.enrolledAt,
        approvedAt: classroomEnrollments.approvedAt,
        approvedBy: classroomEnrollments.approvedBy,
        classroom: classrooms
      })
      .from(classroomEnrollments)
      .innerJoin(classrooms, eq(classroomEnrollments.classroomId, classrooms.id))
      .where(eq(classroomEnrollments.studentId, studentId))
      .orderBy(desc(classroomEnrollments.enrolledAt));
    return result;
  }

  async getPendingEnrollments(classroomId: string): Promise<(ClassroomEnrollment & { student: User })[]> {
    const result = await db
      .select({
        id: classroomEnrollments.id,
        studentId: classroomEnrollments.studentId,
        classroomId: classroomEnrollments.classroomId,
        enrollmentStatus: classroomEnrollments.enrollmentStatus,
        enrolledAt: classroomEnrollments.enrolledAt,
        approvedAt: classroomEnrollments.approvedAt,
        approvedBy: classroomEnrollments.approvedBy,
        student: users
      })
      .from(classroomEnrollments)
      .innerJoin(users, eq(classroomEnrollments.studentId, users.id))
      .where(and(
        eq(classroomEnrollments.classroomId, classroomId),
        eq(classroomEnrollments.enrollmentStatus, 'pending')
      ))
      .orderBy(desc(classroomEnrollments.enrolledAt));
    return result;
  }

  // Announcement operations
  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async getAnnouncementsByClassroom(classroomId: string, limit = 50): Promise<Announcement[]> {
    return db
      .select()
      .from(announcements)
      .where(and(
        eq(announcements.classroomId, classroomId),
        eq(announcements.published, true)
      ))
      .orderBy(desc(announcements.createdAt))
      .limit(limit);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, updates: Partial<InsertAnnouncement>): Promise<Announcement> {
    const validUpdates = { ...updates };
    delete (validUpdates as any).updatedAt;
    
    const [updated] = await db
      .update(announcements)
      .set({ ...validUpdates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updated;
  }

  async markAnnouncementAsRead(announcementId: string, studentId: string): Promise<AnnouncementRead> {
    // Check if already read
    const [existing] = await db
      .select()
      .from(announcementReads)
      .where(and(
        eq(announcementReads.announcementId, announcementId),
        eq(announcementReads.studentId, studentId)
      ));
    
    if (existing) {
      return existing;
    }

    const [newRead] = await db
      .insert(announcementReads)
      .values({ announcementId, studentId })
      .returning();
    return newRead;
  }

  async getUnreadAnnouncements(classroomId: string, studentId: string): Promise<Announcement[]> {
    const result = await db
      .select({ announcement: announcements })
      .from(announcements)
      .leftJoin(
        announcementReads,
        and(
          eq(announcements.id, announcementReads.announcementId),
          eq(announcementReads.studentId, studentId)
        )
      )
      .where(and(
        eq(announcements.classroomId, classroomId),
        eq(announcements.published, true),
        sql`${announcementReads.id} IS NULL`
      ))
      .orderBy(desc(announcements.createdAt));
    
    return result.map(row => row.announcement);
  }

  async getAnnouncementReads(announcementId: string): Promise<(AnnouncementRead & { student: User })[]> {
    const result = await db
      .select({
        id: announcementReads.id,
        announcementId: announcementReads.announcementId,
        studentId: announcementReads.studentId,
        readAt: announcementReads.readAt,
        student: users
      })
      .from(announcementReads)
      .innerJoin(users, eq(announcementReads.studentId, users.id))
      .where(eq(announcementReads.announcementId, announcementId))
      .orderBy(desc(announcementReads.readAt));
    return result;
  }

  // PHASE 1C: TOKEN ECONOMY IMPLEMENTATION

  async getStudentWallet(studentId: string, classroomId: string): Promise<StudentWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(studentWallets)
      .where(and(
        eq(studentWallets.studentId, studentId),
        eq(studentWallets.classroomId, classroomId)
      ));
    return wallet;
  }

  async createStudentWallet(wallet: InsertStudentWallet): Promise<StudentWallet> {
    const [newWallet] = await db
      .insert(studentWallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async updateWalletBalance(walletId: string, newBalance: number, totalEarned: number, totalSpent: number): Promise<StudentWallet> {
    const [updatedWallet] = await db
      .update(studentWallets)
      .set({
        currentBalance: newBalance.toString(),
        totalEarned: totalEarned.toString(),
        totalSpent: totalSpent.toString(),
        updatedAt: new Date()
      })
      .where(eq(studentWallets.id, walletId))
      .returning();
    return updatedWallet;
  }

  async createTokenTransaction(transaction: InsertTokenTransaction): Promise<TokenTransaction> {
    const [newTransaction] = await db
      .insert(tokenTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getWalletTransactions(walletId: string, limit = 50, offset = 0): Promise<TokenTransaction[]> {
    return await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.walletId, walletId))
      .orderBy(desc(tokenTransactions.transactionDate))
      .limit(limit)
      .offset(offset);
  }

  async getStudentTransactions(studentId: string, classroomId: string, limit = 50): Promise<TokenTransaction[]> {
    const result = await db
      .select({
        id: tokenTransactions.id,
        walletId: tokenTransactions.walletId,
        amount: tokenTransactions.amount,
        transactionType: tokenTransactions.transactionType,
        category: tokenTransactions.category,
        description: tokenTransactions.description,
        referenceType: tokenTransactions.referenceType,
        referenceId: tokenTransactions.referenceId,
        createdBy: tokenTransactions.createdBy,
        metadata: tokenTransactions.metadata,
        balanceAfter: tokenTransactions.balanceAfter,
        transactionDate: tokenTransactions.transactionDate,
        academicPeriod: tokenTransactions.academicPeriod,
        auditHash: tokenTransactions.auditHash,
        parentTransactionId: tokenTransactions.parentTransactionId,
        isCorrection: tokenTransactions.isCorrection,
        correctionReason: tokenTransactions.correctionReason
      })
      .from(tokenTransactions)
      .innerJoin(studentWallets, eq(tokenTransactions.walletId, studentWallets.id))
      .where(and(
        eq(studentWallets.studentId, studentId),
        eq(studentWallets.classroomId, classroomId)
      ))
      .orderBy(desc(tokenTransactions.transactionDate))
      .limit(limit);
    return result;
  }

  async awardTokens(data: {
    studentIds: string[];
    amount: number;
    category: string;
    description: string;
    referenceType?: string;
    referenceId?: string;
    createdBy: string;
    classroomId: string;
  }): Promise<{ transactions: TokenTransaction[]; updatedWallets: StudentWallet[] }> {
    const transactions: TokenTransaction[] = [];
    const updatedWallets: StudentWallet[] = [];

    // Process each student atomically
    for (const studentId of data.studentIds) {
      // Get or create wallet
      let wallet = await this.getStudentWallet(studentId, data.classroomId);
      if (!wallet) {
        wallet = await this.createStudentWallet({
          studentId,
          classroomId: data.classroomId,
          currentBalance: "0.00",
          totalEarned: "0.00",
          totalSpent: "0.00"
        });
      }

      const currentBalance = parseFloat(wallet.currentBalance);
      const newBalance = currentBalance + data.amount;
      const newTotalEarned = parseFloat(wallet.totalEarned) + data.amount;

      // Create transaction record
      const transaction = await this.createTokenTransaction({
        walletId: wallet.id,
        amount: data.amount.toString(),
        transactionType: 'awarded',
        category: data.category,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        createdBy: data.createdBy,
        balanceAfter: newBalance.toString(),
        metadata: {}
      });

      // Update wallet balance
      const updatedWallet = await this.updateWalletBalance(
        wallet.id,
        newBalance,
        newTotalEarned,
        parseFloat(wallet.totalSpent)
      );

      transactions.push(transaction);
      updatedWallets.push(updatedWallet);

      // Check for milestones
      await this.checkAndCreateMilestones(studentId, data.classroomId, newBalance);
    }

    return { transactions, updatedWallets };
  }

  async getTokenCategories(classroomId: string): Promise<TokenCategory[]> {
    return await db
      .select()
      .from(tokenCategories)
      .where(and(
        eq(tokenCategories.classroomId, classroomId),
        eq(tokenCategories.activeStatus, true)
      ))
      .orderBy(asc(tokenCategories.name));
  }

  async createTokenCategory(category: InsertTokenCategory): Promise<TokenCategory> {
    const [newCategory] = await db
      .insert(tokenCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getTeacherPresets(teacherId: string, classroomId: string): Promise<TeacherAwardPreset[]> {
    return await db
      .select()
      .from(teacherAwardPresets)
      .where(and(
        eq(teacherAwardPresets.teacherId, teacherId),
        eq(teacherAwardPresets.classroomId, classroomId)
      ))
      .orderBy(desc(teacherAwardPresets.usageCount));
  }

  async createAwardPreset(preset: InsertTeacherAwardPreset): Promise<TeacherAwardPreset> {
    const [newPreset] = await db
      .insert(teacherAwardPresets)
      .values(preset)
      .returning();
    return newPreset;
  }

  async updatePresetUsage(presetId: string): Promise<void> {
    await db
      .update(teacherAwardPresets)
      .set({
        usageCount: sql`${teacherAwardPresets.usageCount} + 1`,
        lastUsed: new Date()
      })
      .where(eq(teacherAwardPresets.id, presetId));
  }

  async createMilestone(milestone: InsertStudentMilestone): Promise<StudentMilestone> {
    const [newMilestone] = await db
      .insert(studentMilestones)
      .values(milestone)
      .returning();
    return newMilestone;
  }

  async getStudentMilestones(studentId: string, classroomId: string): Promise<StudentMilestone[]> {
    return await db
      .select()
      .from(studentMilestones)
      .where(and(
        eq(studentMilestones.studentId, studentId),
        eq(studentMilestones.classroomId, classroomId)
      ))
      .orderBy(desc(studentMilestones.achievedAt))
      .limit(10);
  }

  async checkAndCreateMilestones(studentId: string, classroomId: string, newBalance: number): Promise<StudentMilestone[]> {
    const milestones: StudentMilestone[] = [];
    
    // Check balance milestones (100, 500, 1000, 5000 tokens)
    const balanceMilestones = [100, 500, 1000, 5000];
    
    for (const milestoneValue of balanceMilestones) {
      if (newBalance >= milestoneValue) {
        // Check if milestone already exists
        const existing = await db
          .select()
          .from(studentMilestones)
          .where(and(
            eq(studentMilestones.studentId, studentId),
            eq(studentMilestones.classroomId, classroomId),
            eq(studentMilestones.milestoneType, 'balance_reached'),
            eq(studentMilestones.milestoneValue, milestoneValue)
          ))
          .limit(1);

        if (existing.length === 0) {
          const milestone = await this.createMilestone({
            studentId,
            classroomId,
            milestoneType: 'balance_reached',
            milestoneValue,
            acknowledged: false
          });
          milestones.push(milestone);
        }
      }
    }

    return milestones;
  }

  // PHASE 2A: ASSIGNMENT MANAGEMENT IMPLEMENTATION
  
  async createAssignment(assignment: InsertAssignmentAdvanced): Promise<AssignmentAdvanced> {
    const [newAssignment] = await db
      .insert(assignmentsAdvanced)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateAssignment(assignmentId: string, updates: Partial<InsertAssignmentAdvanced>): Promise<AssignmentAdvanced> {
    const [assignment] = await db
      .update(assignmentsAdvanced)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignmentsAdvanced.id, assignmentId))
      .returning();
    return assignment;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await db.delete(assignmentsAdvanced).where(eq(assignmentsAdvanced.id, assignmentId));
  }

  async getAssignments(classroomId: string, filters?: {
    status?: string;
    category?: string;
    visibleToStudents?: boolean;
  }): Promise<AssignmentAdvanced[]> {
    let query = db
      .select()
      .from(assignmentsAdvanced)
      .where(eq(assignmentsAdvanced.classroomId, classroomId));
    
    if (filters?.status) {
      query = query.where(eq(assignmentsAdvanced.status, filters.status));
    }
    if (filters?.category) {
      query = query.where(eq(assignmentsAdvanced.category, filters.category));
    }
    if (filters?.visibleToStudents !== undefined) {
      query = query.where(eq(assignmentsAdvanced.visibleToStudents, filters.visibleToStudents));
    }
    
    return await query.orderBy(desc(assignmentsAdvanced.dueDate));
  }

  async getAssignment(assignmentId: string): Promise<AssignmentAdvanced | undefined> {
    const [assignment] = await db
      .select()
      .from(assignmentsAdvanced)
      .where(eq(assignmentsAdvanced.id, assignmentId));
    return assignment;
  }

  async getStudentAssignments(studentId: string, classroomId: string): Promise<(AssignmentAdvanced & { submission?: AssignmentSubmission })[]> {
    const result = await db
      .select({
        assignment: assignmentsAdvanced,
        submission: assignmentSubmissions
      })
      .from(assignmentsAdvanced)
      .leftJoin(
        assignmentSubmissions,
        and(
          eq(assignmentSubmissions.assignmentId, assignmentsAdvanced.id),
          eq(assignmentSubmissions.studentId, studentId)
        )
      )
      .where(and(
        eq(assignmentsAdvanced.classroomId, classroomId),
        eq(assignmentsAdvanced.visibleToStudents, true),
        eq(assignmentsAdvanced.status, 'published')
      ))
      .orderBy(desc(assignmentsAdvanced.dueDate));
    
    return result.map(row => ({
      ...row.assignment,
      submission: row.submission || undefined
    }));
  }

  async createSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const [newSubmission] = await db
      .insert(assignmentSubmissions)
      .values({
        ...submission,
        submissionNumber: 1 // For now, handle resubmissions later
      })
      .returning();
    return newSubmission;
  }

  async updateSubmission(submissionId: string, updates: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission> {
    const [submission] = await db
      .update(assignmentSubmissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignmentSubmissions.id, submissionId))
      .returning();
    return submission;
  }

  async getSubmission(submissionId: string): Promise<AssignmentSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, submissionId));
    return submission;
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<(AssignmentSubmission & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]> {
    const result = await db
      .select({
        submission: assignmentSubmissions,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(assignmentSubmissions)
      .innerJoin(users, eq(assignmentSubmissions.studentId, users.id))
      .where(eq(assignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(assignmentSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.submission,
      student: row.student
    }));
  }

  async getStudentSubmissions(studentId: string, classroomId: string): Promise<(AssignmentSubmission & { assignment: Pick<AssignmentAdvanced, 'id' | 'title' | 'dueDate'> })[]> {
    const result = await db
      .select({
        submission: assignmentSubmissions,
        assignment: {
          id: assignmentsAdvanced.id,
          title: assignmentsAdvanced.title,
          dueDate: assignmentsAdvanced.dueDate
        }
      })
      .from(assignmentSubmissions)
      .innerJoin(assignmentsAdvanced, eq(assignmentSubmissions.assignmentId, assignmentsAdvanced.id))
      .where(and(
        eq(assignmentSubmissions.studentId, studentId),
        eq(assignmentSubmissions.classroomId, classroomId)
      ))
      .orderBy(desc(assignmentSubmissions.submittedAt));
    
    return result.map(row => ({
      ...row.submission,
      assignment: row.assignment
    }));
  }

  async createAssignmentFeedback(feedback: InsertAssignmentFeedback): Promise<AssignmentFeedback> {
    const [newFeedback] = await db
      .insert(assignmentFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async getAssignmentFeedback(submissionId: string): Promise<AssignmentFeedback[]> {
    return await db
      .select()
      .from(assignmentFeedback)
      .where(eq(assignmentFeedback.submissionId, submissionId))
      .orderBy(desc(assignmentFeedback.createdAt));
  }

  async getAssignmentTemplates(createdBy?: string): Promise<AssignmentTemplate[]> {
    let query = db.select().from(assignmentTemplates);
    
    if (createdBy) {
      query = query.where(or(
        eq(assignmentTemplates.createdBy, createdBy),
        eq(assignmentTemplates.isPublic, true)
      ));
    } else {
      query = query.where(eq(assignmentTemplates.isPublic, true));
    }
    
    return await query.orderBy(desc(assignmentTemplates.useCount), desc(assignmentTemplates.createdAt));
  }

  async createAssignmentTemplate(template: InsertAssignmentTemplate): Promise<AssignmentTemplate> {
    const [newTemplate] = await db
      .insert(assignmentTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getAssignmentAnalytics(classroomId: string, assignmentId?: string) {
    const baseCondition = assignmentId 
      ? and(eq(assignmentSubmissions.classroomId, classroomId), eq(assignmentSubmissions.assignmentId, assignmentId))
      : eq(assignmentSubmissions.classroomId, classroomId);
    
    const submissions = await db
      .select()
      .from(assignmentSubmissions)
      .where(baseCondition);
    
    const totalSubmissions = submissions.length;
    const onTimeSubmissions = submissions.filter(s => !s.isLateSubmission).length;
    const averageScore = submissions.reduce((acc, s) => acc + parseFloat(s.overallProfessionalScore || '0'), 0) / totalSubmissions || 0;
    const tokensAwarded = submissions.reduce((acc, s) => acc + parseFloat(s.tokensAwarded || '0'), 0);
    
    return {
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions: totalSubmissions - onTimeSubmissions,
      onTimePercentage: totalSubmissions > 0 ? (onTimeSubmissions / totalSubmissions) * 100 : 0,
      averageProfessionalScore: Math.round(averageScore * 100) / 100,
      totalTokensAwarded: tokensAwarded
    };
  }

  // PHASE 1D: DIGITAL STORE IMPLEMENTATION
  
  async createStoreItem(item: InsertStoreItemAdvanced): Promise<StoreItemAdvanced> {
    const [storeItem] = await db
      .insert(storeItemsAdvanced)
      .values(item)
      .returning();
    return storeItem;
  }

  async updateStoreItem(itemId: string, updates: Partial<InsertStoreItemAdvanced>): Promise<StoreItemAdvanced> {
    const [storeItem] = await db
      .update(storeItemsAdvanced)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(storeItemsAdvanced.id, itemId))
      .returning();
    return storeItem;
  }

  async deleteStoreItem(itemId: string): Promise<void> {
    await db.delete(storeItemsAdvanced).where(eq(storeItemsAdvanced.id, itemId));
  }

  async getStoreItems(classroomId: string): Promise<StoreItemAdvanced[]> {
    return await db
      .select()
      .from(storeItemsAdvanced)
      .where(eq(storeItemsAdvanced.classroomId, classroomId))
      .orderBy(storeItemsAdvanced.priorityOrder, storeItemsAdvanced.createdAt);
  }

  async getStoreItem(itemId: string): Promise<StoreItemAdvanced | undefined> {
    const [item] = await db.select().from(storeItemsAdvanced).where(eq(storeItemsAdvanced.id, itemId));
    return item;
  }

  async getStoreItemTemplates(): Promise<Array<{
    id: string;
    title: string;
    description: string;
    suggestedPrice: number;
    category: string;
    itemType: string;
    icon: string;
    tags: string[];
  }>> {
    return [
      // Academic Benefits
      {
        id: 'template_homework_pass',
        title: 'Homework Pass',
        description: 'Skip one homework assignment with no penalty',
        suggestedPrice: 50,
        category: 'Academic Benefits',
        itemType: 'academic_benefit',
        icon: '📝',
        tags: ['homework', 'academic', 'pass']
      },
      {
        id: 'template_extra_credit',
        title: 'Extra Credit Points',
        description: 'Add 5 bonus points to your next test',
        suggestedPrice: 75,
        category: 'Academic Benefits',
        itemType: 'academic_benefit',
        icon: '📈',
        tags: ['extra credit', 'test', 'bonus']
      },
      {
        id: 'template_retake_quiz',
        title: 'Quiz Retake',
        description: 'Retake your lowest quiz score',
        suggestedPrice: 60,
        category: 'Academic Benefits',
        itemType: 'academic_benefit',
        icon: '🔄',
        tags: ['quiz', 'retake', 'second chance']
      },
      // Classroom Privileges
      {
        id: 'template_line_leader',
        title: 'Line Leader for a Day',
        description: 'Be the line leader for the entire day',
        suggestedPrice: 25,
        category: 'Classroom Privileges',
        itemType: 'privilege',
        icon: '👑',
        tags: ['leader', 'responsibility', 'special']
      },
      {
        id: 'template_desk_choice',
        title: 'Choose Your Seat',
        description: 'Pick any available seat for one week',
        suggestedPrice: 30,
        category: 'Classroom Privileges',
        itemType: 'privilege',
        icon: '🪑',
        tags: ['seating', 'choice', 'week']
      },
      {
        id: 'template_teacher_helper',
        title: 'Teacher Assistant',
        description: 'Help the teacher with classroom tasks for one day',
        suggestedPrice: 40,
        category: 'Classroom Privileges',
        itemType: 'privilege',
        icon: '🤝',
        tags: ['assistant', 'helper', 'responsibility']
      },
      {
        id: 'template_computer_time',
        title: 'Extra Computer Time',
        description: '15 minutes of free computer time',
        suggestedPrice: 20,
        category: 'Classroom Privileges',
        itemType: 'privilege',
        icon: '💻',
        tags: ['computer', 'free time', 'technology']
      },
      // Physical Rewards
      {
        id: 'template_pencil',
        title: 'Special Pencil',
        description: 'A fun pencil with eraser topper',
        suggestedPrice: 15,
        category: 'School Supplies',
        itemType: 'physical',
        icon: '✏️',
        tags: ['pencil', 'supplies', 'fun']
      },
      {
        id: 'template_stickers',
        title: 'Sticker Pack',
        description: 'A pack of 10 fun stickers',
        suggestedPrice: 10,
        category: 'Rewards',
        itemType: 'physical',
        icon: '⭐',
        tags: ['stickers', 'decoration', 'fun']
      },
      {
        id: 'template_bookmark',
        title: 'Custom Bookmark',
        description: 'A personalized bookmark for reading',
        suggestedPrice: 12,
        category: 'School Supplies',
        itemType: 'physical',
        icon: '🔖',
        tags: ['bookmark', 'reading', 'personalized']
      },
      // Fun Activities
      {
        id: 'template_music_time',
        title: 'Choose Class Music',
        description: 'Pick the background music for 30 minutes',
        suggestedPrice: 35,
        category: 'Fun Activities',
        itemType: 'privilege',
        icon: '🎵',
        tags: ['music', 'choice', 'fun']
      },
      {
        id: 'template_show_tell',
        title: 'Special Show & Tell',
        description: 'Present something special to the class',
        suggestedPrice: 45,
        category: 'Fun Activities',
        itemType: 'privilege',
        icon: '🎤',
        tags: ['presentation', 'sharing', 'spotlight']
      },
      {
        id: 'template_game_time',
        title: 'Educational Game Time',
        description: '20 minutes of educational games',
        suggestedPrice: 30,
        category: 'Fun Activities',
        itemType: 'privilege',
        icon: '🎮',
        tags: ['games', 'educational', 'fun']
      }
    ];
  }
}

export const storage = new DatabaseStorage();
