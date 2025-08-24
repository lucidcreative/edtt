import {
  users,
  classrooms,
  studentClassrooms,
  classroomEnrollments,
  announcements,
  announcementReads,
  assignments,
  submissions,
  proposals,
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
  type Proposal,
  type InsertProposal,
  type StoreItem,
  type InsertStoreItem,
  type Badge,
  type InsertBadge,
  type Challenge,
  type InsertChallenge,
  type StudentClassroom,
  type Purchase,
  type StudentBadgeType,
  type ChallengeProgressType,
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
  timeEntries,
  // Phase 2B Marketplace Tables
  marketplaceSellers,
  marketplaceListings,
  marketplaceTransactions,
  marketplaceReviews,
  marketplaceWishlists,
  marketplaceMessages,
  type AssignmentAdvanced,
  type InsertAssignmentAdvanced,
  type AssignmentSubmission,
  type InsertAssignmentSubmission,
  type AssignmentFeedback,
  type InsertAssignmentFeedback,
  type AssignmentTemplate,
  type InsertAssignmentTemplate,
  // Phase 2B Marketplace Types
  type MarketplaceSeller,
  type InsertMarketplaceSeller,
  type MarketplaceListing,
  type InsertMarketplaceListing,
  type MarketplaceTransaction,
  type InsertMarketplaceTransaction,
  type MarketplaceReview,
  type InsertMarketplaceReview,
  type MarketplaceWishlist,
  type InsertMarketplaceWishlist,
  type MarketplaceMessage,
  type InsertMarketplaceMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ne, sql, count } from "drizzle-orm";

export interface IStorage {
  // Time tracking methods
  getActiveTimeSession(userId: string): Promise<any>;
  updateUserTokens(userId: string, tokensToAdd: number): Promise<void>;
  endTimeSession(sessionId: string, duration: number, tokensEarned: number): Promise<void>;
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  // Proposal operations for RFP assignments
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposalsByAssignment(assignmentId: string): Promise<(Proposal & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]>;
  getProposalsByStudent(studentId: string): Promise<Proposal[]>;
  updateProposalStatus(proposalId: string, status: 'pending' | 'approved' | 'not_selected'): Promise<Proposal>;
  approveProposal(proposalId: string): Promise<void>;
  
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
  updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge>;
  awardBadge(studentId: string, badgeId: string): Promise<StudentBadgeType>;
  getStudentBadges(studentId: string): Promise<(StudentBadgeType & { badge: Badge })[]>;
  
  // Challenge operations
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallengesByClassroom(classroomId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, updates: Partial<InsertChallenge>): Promise<Challenge>;
  updateChallengeProgress(studentId: string, challengeId: string, progress: number): Promise<ChallengeProgressType>;
  getStudentChallengeProgress(studentId: string, classroomId: string): Promise<(ChallengeProgressType & { challenge: Challenge })[]>;
  
  // Time tracking operations
  getTimeTrackingSettings(classroomId: string): Promise<any>;
  updateTimeTrackingSettings(classroomId: string, settings: any): Promise<any>;
  createTimeEntry(entry: any): Promise<any>;
  updateTimeEntry(id: string, updates: any): Promise<any>;
  getActiveTimeEntry(studentId: string, classroomId: string): Promise<any>;
  getTimeEntries(classroomId: string, studentId?: string): Promise<any[]>;
  getTodayTimeHours(studentId: string, classroomId: string): Promise<number>;
  
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
  createAdvancedSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  updateSubmission(submissionId: string, updates: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission>;
  getSubmission(submissionId: string): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissions(assignmentId: string): Promise<(AssignmentSubmission & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]>;
  getStudentSubmissions(studentId: string, classroomId: string): Promise<(AssignmentSubmission & { assignment: Pick<AssignmentAdvanced, 'id' | 'title' | 'dueDate'> })[]>;
  createAssignmentFeedback(feedback: InsertAssignmentFeedback): Promise<AssignmentFeedback>;
  getAssignmentFeedback(submissionId: string): Promise<AssignmentFeedback[]>;
  getAssignmentTemplates(createdBy?: string): Promise<AssignmentTemplate[]>;
  createAssignmentTemplate(template: InsertAssignmentTemplate): Promise<AssignmentTemplate>;
  getAssignmentAnalytics(classroomId: string, assignmentId?: string): Promise<any>;

  // PHASE 2B: MARKETPLACE & PEER-TO-PEER COMMERCE METHODS

  // Seller management
  createSeller(seller: InsertMarketplaceSeller): Promise<MarketplaceSeller>;
  updateSeller(sellerId: string, updates: Partial<InsertMarketplaceSeller>): Promise<MarketplaceSeller>;
  getSeller(sellerId: string): Promise<MarketplaceSeller | undefined>;
  getSellerByStudent(studentId: string, classroomId: string): Promise<MarketplaceSeller | undefined>;
  getClassroomSellers(classroomId: string, status?: string): Promise<(MarketplaceSeller & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]>;
  approveSeller(sellerId: string, approverId: string): Promise<MarketplaceSeller>;
  suspendSeller(sellerId: string, reason: string): Promise<MarketplaceSeller>;
  
  // Listing management
  createListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateListing(listingId: string, updates: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing>;
  deleteListing(listingId: string): Promise<void>;
  getListing(listingId: string): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } }) | undefined>;
  getSellerListings(sellerId: string, status?: string): Promise<MarketplaceListing[]>;
  searchListings(classroomId: string, filters?: { 
    category?: string; 
    status?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    tags?: string[];
    sellerId?: string;
  }): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]>;
  getFeaturedListings(classroomId: string, limit?: number): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]>;
  updateListingViews(listingId: string): Promise<void>;
  
  // Transaction management
  createTransaction(transaction: InsertMarketplaceTransaction): Promise<MarketplaceTransaction>;
  updateTransaction(transactionId: string, updates: Partial<InsertMarketplaceTransaction>): Promise<MarketplaceTransaction>;
  getTransaction(transactionId: string): Promise<(MarketplaceTransaction & { listing: MarketplaceListing, buyer: Pick<User, 'id' | 'nickname'>, seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } }) | undefined>;
  getSellerTransactions(sellerId: string, status?: string): Promise<(MarketplaceTransaction & { listing: Pick<MarketplaceListing, 'id' | 'title'>, buyer: Pick<User, 'id' | 'nickname'> })[]>;
  getBuyerTransactions(buyerId: string, status?: string): Promise<(MarketplaceTransaction & { listing: Pick<MarketplaceListing, 'id' | 'title'>, seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]>;
  getClassroomTransactions(classroomId: string, filters?: { status?: string; timeframe?: string }): Promise<any[]>;
  
  // Review management
  createReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>;
  updateReview(reviewId: string, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview>;
  getReview(reviewId: string): Promise<MarketplaceReview | undefined>;
  getSellerReviews(sellerId: string, status?: string): Promise<(MarketplaceReview & { reviewer: Pick<User, 'id' | 'nickname'> })[]>;
  getListingReviews(listingId: string): Promise<(MarketplaceReview & { reviewer: Pick<User, 'id' | 'nickname'> })[]>;
  flagReview(reviewId: string, reason: string): Promise<MarketplaceReview>;
  moderateReview(reviewId: string, moderatorId: string, action: 'approve' | 'hide'): Promise<MarketplaceReview>;
  
  // Wishlist management
  addToWishlist(wishlist: InsertMarketplaceWishlist): Promise<MarketplaceWishlist>;
  removeFromWishlist(studentId: string, listingId: string): Promise<void>;
  getStudentWishlist(studentId: string): Promise<(MarketplaceWishlist & { listing: MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } } })[]>;
  getListingWishlistCount(listingId: string): Promise<number>;
  
  // Message management
  createMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage>;
  getMessages(userId: string, filters?: { transactionId?: string; listingId?: string; conversationWith?: string }): Promise<(MarketplaceMessage & { sender: Pick<User, 'id' | 'nickname'>, recipient: Pick<User, 'id' | 'nickname'> })[]>;
  markMessageAsRead(messageId: string): Promise<MarketplaceMessage>;
  flagMessage(messageId: string, reason: string): Promise<MarketplaceMessage>;
  
  // Analytics and insights
  getSellerAnalytics(sellerId: string, timeframe?: string): Promise<{
    totalSales: number;
    totalRevenue: string;
    averageRating: number;
    totalReviews: number;
    activeListings: number;
    pendingOrders: number;
    completedOrders: number;
    topSellingItems: any[];
    revenueByMonth: any[];
  }>;
  getMarketplaceAnalytics(classroomId: string, timeframe?: string): Promise<{
    totalTransactions: number;
    totalVolume: string;
    activeSellers: number;
    activeListings: number;
    averageTransactionValue: string;
    topCategories: any[];
    topSellers: any[];
    transactionsByMonth: any[];
  }>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values([user]).returning();
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
    const [newClassroom] = await db.insert(classrooms).values([classroomData]).returning();
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
    const [newAssignment] = await db.insert(assignments).values([assignment]).returning();
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
    const [newSubmission] = await db.insert(submissions).values([submission]).returning();
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

  // Proposal operations for RFP assignments
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db.insert(proposals).values([proposal]).returning();
    return newProposal;
  }

  async getProposalsByAssignment(assignmentId: string): Promise<(Proposal & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]> {
    const result = await db
      .select({
        proposal: proposals,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.studentId, users.id))
      .where(eq(proposals.assignmentId, assignmentId))
      .orderBy(desc(proposals.createdAt));
    
    return result.map(row => ({
      ...row.proposal,
      student: row.student
    }));
  }

  async getProposalsByStudent(studentId: string): Promise<Proposal[]> {
    return db
      .select()
      .from(proposals)
      .where(eq(proposals.studentId, studentId))
      .orderBy(desc(proposals.createdAt));
  }

  async updateProposalStatus(proposalId: string, status: 'pending' | 'approved' | 'not_selected'): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({ status, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  async approveProposal(proposalId: string): Promise<void> {
    // Get the proposal to find the assignment
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId));
    if (!proposal) throw new Error('Proposal not found');
    
    // Start transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Approve the selected proposal
      await tx
        .update(proposals)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(proposals.id, proposalId));
      
      // Mark all other proposals for this assignment as "not_selected"
      await tx
        .update(proposals)
        .set({ status: 'not_selected', updatedAt: new Date() })
        .where(and(
          eq(proposals.assignmentId, proposal.assignmentId),
          ne(proposals.id, proposalId)
        ));
    });
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
    const [newItem] = await db.insert(storeItems).values([item]).returning();
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
    const [newPurchase] = await db.insert(purchases).values([purchase]).returning();
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
    const [newBadge] = await db.insert(badges).values([badge]).returning();
    return newBadge;
  }

  async updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge> {
    const [updated] = await db.update(badges)
      .set(updates)
      .where(eq(badges.id, id))
      .returning();
    return updated;
  }

  async awardBadge(studentId: string, badgeId: string): Promise<StudentBadgeType> {
    const [award] = await db
      .insert(studentBadges)
      .values({ studentId, badgeId })
      .returning();
    return award;
  }

  async getStudentBadges(studentId: string): Promise<(StudentBadgeType & { badge: Badge })[]> {
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
    const [newChallenge] = await db.insert(challenges).values([challenge]).returning();
    return newChallenge;
  }

  async updateChallenge(id: string, updates: Partial<InsertChallenge>): Promise<Challenge> {
    const [updated] = await db.update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return updated;
  }

  async updateChallengeProgress(studentId: string, challengeId: string, progress: number): Promise<ChallengeProgressType> {
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

  async getStudentChallengeProgress(studentId: string, classroomId: string): Promise<(ChallengeProgressType & { challenge: Challenge })[]> {
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
    // PERFORMANCE: Execute all counts in parallel instead of sequential
    // This reduces total query time for large classrooms
    const [studentCount, assignmentCount, completedCount, pendingCount] = await Promise.all([
      db.select({ count: count() })
        .from(studentClassrooms)
        .where(eq(studentClassrooms.classroomId, classroomId)),
      
      db.select({ count: count() })
        .from(assignments)
        .where(eq(assignments.classroomId, classroomId)),
      
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(and(
          eq(assignments.classroomId, classroomId),
          eq(submissions.status, 'approved')
        )),
      
      db.select({ count: count() })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(and(
          eq(assignments.classroomId, classroomId),
          eq(submissions.status, 'pending')
        ))
    ]);

    return {
      totalStudents: studentCount[0].count,
      totalAssignments: assignmentCount[0].count,
      completedAssignments: completedCount[0].count,
      pendingSubmissions: pendingCount[0].count
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
    const [newEnrollment] = await db.insert(classroomEnrollments).values([enrollment]).returning();
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
    const [newAnnouncement] = await db.insert(announcements).values([announcement]).returning();
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

  // Check if student is enrolled in classroom
  async isStudentEnrolledInClassroom(studentId: string, classroomId: string): Promise<boolean> {
    const enrollment = await db
      .select()
      .from(studentClassrooms)
      .where(and(
        eq(studentClassrooms.studentId, studentId),
        eq(studentClassrooms.classroomId, classroomId)
      ))
      .limit(1);
    return enrollment.length > 0;
  }

  // Get all classrooms for a teacher
  async getTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
    return db.select().from(classrooms).where(eq(classrooms.teacherId, teacherId));
  }

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
  
  async createAssignment(assignment: any): Promise<any> {
    // Map the assignment data to basic assignment schema
    const basicAssignment = {
      title: assignment.title,
      description: assignment.description,
      category: assignment.category,
      tokenReward: assignment.tokenReward || 0,
      classroomId: assignment.classroomId,
      teacherId: assignment.teacherId || assignment.createdBy,
      dueDate: assignment.dueDate,
      resources: assignment.resources || [],
      isActive: assignment.isActive !== false
    };
    
    const [newAssignment] = await db
      .insert(assignments)
      .values(basicAssignment)
      .returning();
    return newAssignment;
  }

  async updateAssignment(assignmentId: string, updates: any): Promise<any> {
    const basicUpdates: any = {};
    if (updates.title) basicUpdates.title = updates.title;
    if (updates.description) basicUpdates.description = updates.description;
    if (updates.category) basicUpdates.category = updates.category;
    if (updates.tokenReward !== undefined) basicUpdates.tokenReward = updates.tokenReward;
    if (updates.dueDate !== undefined) basicUpdates.dueDate = updates.dueDate;
    if (updates.resources !== undefined) basicUpdates.resources = updates.resources;
    if (updates.isActive !== undefined) basicUpdates.isActive = updates.isActive;
    basicUpdates.updatedAt = new Date();
    
    const [assignment] = await db
      .update(assignments)
      .set(basicUpdates)
      .where(eq(assignments.id, assignmentId))
      .returning();
    return assignment;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, assignmentId));
  }

  async getAssignments(classroomId: string, filters?: {
    status?: string;
    category?: string;
    visibleToStudents?: boolean;
  }): Promise<any[]> {
    const conditions = [eq(assignments.classroomId, classroomId)];
    
    if (filters?.category) {
      conditions.push(eq(assignments.category, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(assignments.status, filters.status));
    }
    
    return await db
      .select()
      .from(assignments)
      .where(and(...conditions))
      .orderBy(desc(assignments.dueDate), desc(assignments.createdAt));
  }

  async getAssignmentsWithStudentInfo(classroomId: string, filters?: {
    status?: string;
    category?: string;
    visibleToStudents?: boolean;
  }): Promise<any[]> {
    const conditions = [eq(assignments.classroomId, classroomId)];
    
    if (filters?.category) {
      conditions.push(eq(assignments.category, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(assignments.status, filters.status));
    }
    
    const result = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        category: assignments.category,
        tokenReward: assignments.tokenReward,
        dueDate: assignments.dueDate,
        submittedAt: assignments.submittedAt,
        grade: assignments.grade,
        status: assignments.status,
        studentId: assignments.studentId,
        studentName: users.name
      })
      .from(assignments)
      .leftJoin(users, eq(users.id, assignments.studentId))
      .where(and(...conditions))
      .orderBy(desc(assignments.dueDate), desc(assignments.createdAt));
      
    return result;
  }

  async updateAssignmentWithCondition(assignmentId: string, updates: any, conditions: any): Promise<boolean> {
    const basicUpdates: any = {};
    if (updates.title) basicUpdates.title = updates.title;
    if (updates.description) basicUpdates.description = updates.description;
    if (updates.category) basicUpdates.category = updates.category;
    if (updates.tokenReward !== undefined) basicUpdates.tokenReward = updates.tokenReward;
    if (updates.dueDate !== undefined) basicUpdates.dueDate = updates.dueDate;
    if (updates.status !== undefined) basicUpdates.status = updates.status;
    if (updates.resources !== undefined) basicUpdates.resources = updates.resources;
    if (updates.isActive !== undefined) basicUpdates.isActive = updates.isActive;
    basicUpdates.updatedAt = new Date();
    
    const whereConditions = [eq(assignments.id, assignmentId)];
    if (conditions.status) {
      whereConditions.push(eq(assignments.status, conditions.status));
    }
    
    const result = await db
      .update(assignments)
      .set(basicUpdates)
      .where(and(...whereConditions))
      .returning();
    
    return result.length > 0;
  }

  async getAssignment(assignmentId: string): Promise<any | undefined> {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId));
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

  async createAdvancedSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
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
  
  async createStoreItem(item: any): Promise<any> {
    // Map advanced item data to basic store item schema
    const basicItem = {
      name: item.title || item.name,
      description: item.description,
      cost: parseInt(item.basePrice || item.currentPrice || item.cost),
      imageUrl: item.metadata?.icon || item.icon || '📦', // Store icon in imageUrl field
      category: item.category,
      classroomId: item.classroomId,
      isActive: item.activeStatus !== false,
      inventory: item.inventoryType === 'unlimited' ? -1 : (item.totalQuantity || -1)
    };
    
    const [storeItem] = await db
      .insert(storeItems)
      .values(basicItem)
      .returning();
      
    // Return in advanced format for compatibility
    return {
      ...storeItem,
      title: storeItem.name,
      basePrice: storeItem.cost.toString(),
      currentPrice: storeItem.cost.toString(),
      activeStatus: storeItem.isActive,
      metadata: { icon: storeItem.imageUrl }
    };
  }

  async updateStoreItem(itemId: string, updates: any): Promise<any> {
    // Map advanced updates to basic store item schema
    const basicUpdates: any = {};
    if (updates.name) basicUpdates.name = updates.name;
    if (updates.title) basicUpdates.name = updates.title;
    if (updates.description) basicUpdates.description = updates.description;
    if (updates.cost !== undefined) basicUpdates.cost = parseInt(updates.cost);
    if (updates.basePrice !== undefined) basicUpdates.cost = parseInt(updates.basePrice);
    if (updates.currentPrice !== undefined) basicUpdates.cost = parseInt(updates.currentPrice);
    if (updates.category) basicUpdates.category = updates.category;
    if (updates.metadata?.icon) basicUpdates.imageUrl = updates.metadata.icon;
    if (updates.icon) basicUpdates.imageUrl = updates.icon;
    if (updates.activeStatus !== undefined) basicUpdates.isActive = updates.activeStatus;
    basicUpdates.updatedAt = new Date();
    
    const [storeItem] = await db
      .update(storeItems)
      .set(basicUpdates)
      .where(eq(storeItems.id, itemId))
      .returning();
      
    // Return in advanced format for compatibility
    return {
      ...storeItem,
      title: storeItem.name,
      basePrice: storeItem.cost.toString(),
      currentPrice: storeItem.cost.toString(),
      activeStatus: storeItem.isActive,
      metadata: { icon: storeItem.imageUrl }
    };
  }

  async deleteStoreItem(itemId: string): Promise<void> {
    await db.delete(storeItems).where(eq(storeItems.id, itemId));
  }

  async getStoreItems(classroomId: string): Promise<any[]> {
    const items = await db
      .select()
      .from(storeItems)
      .where(eq(storeItems.classroomId, classroomId))
      .orderBy(storeItems.createdAt);
      
    // Return in advanced format for compatibility
    return items.map(item => ({
      ...item,
      title: item.name,
      basePrice: item.cost.toString(),
      currentPrice: item.cost.toString(),
      activeStatus: item.isActive,
      metadata: { icon: item.imageUrl || '📦' }
    }));
  }

  async getStoreItem(itemId: string): Promise<any | undefined> {
    const [item] = await db.select().from(storeItems).where(eq(storeItems.id, itemId));
    if (!item) return undefined;
    
    // Return in advanced format for compatibility
    return {
      ...item,
      title: item.name,
      basePrice: item.cost.toString(),
      currentPrice: item.cost.toString(),
      activeStatus: item.isActive,
      metadata: { icon: item.imageUrl || '📦' }
    };
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

  // PHASE 2B: MARKETPLACE & PEER-TO-PEER COMMERCE IMPLEMENTATION

  // Seller management methods
  async createSeller(seller: InsertMarketplaceSeller): Promise<MarketplaceSeller> {
    const [newSeller] = await db
      .insert(marketplaceSellers)
      .values(seller)
      .returning();
    return newSeller;
  }

  async updateSeller(sellerId: string, updates: Partial<InsertMarketplaceSeller>): Promise<MarketplaceSeller> {
    const [seller] = await db
      .update(marketplaceSellers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceSellers.id, sellerId))
      .returning();
    return seller;
  }

  async getSeller(sellerId: string): Promise<MarketplaceSeller | undefined> {
    const [seller] = await db
      .select()
      .from(marketplaceSellers)
      .where(eq(marketplaceSellers.id, sellerId));
    return seller;
  }

  async getSellerByStudent(studentId: string, classroomId: string): Promise<MarketplaceSeller | undefined> {
    const [seller] = await db
      .select()
      .from(marketplaceSellers)
      .where(and(
        eq(marketplaceSellers.studentId, studentId),
        eq(marketplaceSellers.classroomId, classroomId)
      ));
    return seller;
  }

  async getClassroomSellers(classroomId: string, status?: string): Promise<(MarketplaceSeller & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]> {
    let query = db
      .select({
        seller: marketplaceSellers,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(marketplaceSellers)
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(eq(marketplaceSellers.classroomId, classroomId));

    if (status) {
      query = query.where(eq(marketplaceSellers.sellerStatus, status));
    }

    const result = await query.orderBy(desc(marketplaceSellers.createdAt));
    return result.map(row => ({ ...row.seller, student: row.student }));
  }

  async approveSeller(sellerId: string, approverId: string): Promise<MarketplaceSeller> {
    const [seller] = await db
      .update(marketplaceSellers)
      .set({
        sellerStatus: 'approved',
        approvedBy: approverId,
        approvalDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(marketplaceSellers.id, sellerId))
      .returning();
    return seller;
  }

  async suspendSeller(sellerId: string, reason: string): Promise<MarketplaceSeller> {
    const [seller] = await db
      .update(marketplaceSellers)
      .set({
        sellerStatus: 'suspended',
        updatedAt: new Date()
      })
      .where(eq(marketplaceSellers.id, sellerId))
      .returning();
    return seller;
  }

  // Listing management methods
  async createListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const [newListing] = await db
      .insert(marketplaceListings)
      .values(listing)
      .returning();
    return newListing;
  }

  async updateListing(listingId: string, updates: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing> {
    const [listing] = await db
      .update(marketplaceListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceListings.id, listingId))
      .returning();
    return listing;
  }

  async deleteListing(listingId: string): Promise<void> {
    await db.delete(marketplaceListings).where(eq(marketplaceListings.id, listingId));
  }

  async getListing(listingId: string): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } }) | undefined> {
    const result = await db
      .select({
        listing: marketplaceListings,
        seller: marketplaceSellers,
        student: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceListings)
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceListings.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(eq(marketplaceListings.id, listingId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return { ...row.listing, seller: { ...row.seller, student: row.student } };
  }

  async getSellerListings(sellerId: string, status?: string): Promise<MarketplaceListing[]> {
    let query = db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.sellerId, sellerId));

    if (status) {
      query = query.where(eq(marketplaceListings.status, status));
    }

    return await query.orderBy(desc(marketplaceListings.createdAt));
  }

  async searchListings(classroomId: string, filters?: { 
    category?: string; 
    status?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    tags?: string[];
    sellerId?: string;
  }): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]> {
    let conditions = [eq(marketplaceSellers.classroomId, classroomId)];

    if (filters?.category) {
      conditions.push(eq(marketplaceListings.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(marketplaceListings.status, filters.status));
    }
    if (filters?.sellerId) {
      conditions.push(eq(marketplaceListings.sellerId, filters.sellerId));
    }

    const result = await db
      .select({
        listing: marketplaceListings,
        seller: marketplaceSellers,
        student: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceListings)
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceListings.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(and(...conditions))
      .orderBy(desc(marketplaceListings.featured), desc(marketplaceListings.createdAt));

    return result.map(row => ({ ...row.listing, seller: { ...row.seller, student: row.student } }));
  }

  async getFeaturedListings(classroomId: string, limit: number = 6): Promise<(MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]> {
    const result = await db
      .select({
        listing: marketplaceListings,
        seller: marketplaceSellers,
        student: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceListings)
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceListings.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(and(
        eq(marketplaceSellers.classroomId, classroomId),
        eq(marketplaceListings.featured, true),
        eq(marketplaceListings.status, 'active')
      ))
      .orderBy(desc(marketplaceListings.viewCount))
      .limit(limit);

    return result.map(row => ({ ...row.listing, seller: { ...row.seller, student: row.student } }));
  }

  async updateListingViews(listingId: string): Promise<void> {
    await db
      .update(marketplaceListings)
      .set({
        viewCount: sql`${marketplaceListings.viewCount} + 1`
      })
      .where(eq(marketplaceListings.id, listingId));
  }

  // Transaction management methods
  async createTransaction(transaction: InsertMarketplaceTransaction): Promise<MarketplaceTransaction> {
    const [newTransaction] = await db
      .insert(marketplaceTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(transactionId: string, updates: Partial<InsertMarketplaceTransaction>): Promise<MarketplaceTransaction> {
    const [transaction] = await db
      .update(marketplaceTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceTransactions.id, transactionId))
      .returning();
    return transaction;
  }

  async getTransaction(transactionId: string): Promise<(MarketplaceTransaction & { listing: MarketplaceListing, buyer: Pick<User, 'id' | 'nickname'>, seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } }) | undefined> {
    const result = await db
      .select({
        transaction: marketplaceTransactions,
        listing: marketplaceListings,
        buyer: {
          id: users.id,
          nickname: users.nickname
        },
        seller: marketplaceSellers,
        sellerStudent: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceTransactions)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceTransactions.listingId))
      .innerJoin(users, eq(users.id, marketplaceTransactions.buyerId))
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceTransactions.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(eq(marketplaceTransactions.id, transactionId))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.transaction,
      listing: row.listing,
      buyer: row.buyer,
      seller: { ...row.seller, student: row.sellerStudent }
    };
  }

  async getSellerTransactions(sellerId: string, status?: string): Promise<(MarketplaceTransaction & { listing: Pick<MarketplaceListing, 'id' | 'title'>, buyer: Pick<User, 'id' | 'nickname'> })[]> {
    let query = db
      .select({
        transaction: marketplaceTransactions,
        listing: {
          id: marketplaceListings.id,
          title: marketplaceListings.title
        },
        buyer: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceTransactions)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceTransactions.listingId))
      .innerJoin(users, eq(users.id, marketplaceTransactions.buyerId))
      .where(eq(marketplaceTransactions.sellerId, sellerId));

    if (status) {
      query = query.where(eq(marketplaceTransactions.orderStatus, status));
    }

    const result = await query.orderBy(desc(marketplaceTransactions.createdAt));
    return result.map(row => ({ ...row.transaction, listing: row.listing, buyer: row.buyer }));
  }

  async getBuyerTransactions(buyerId: string, status?: string): Promise<(MarketplaceTransaction & { listing: Pick<MarketplaceListing, 'id' | 'title'>, seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } })[]> {
    let conditions = [eq(marketplaceTransactions.buyerId, buyerId)];
    if (status) {
      conditions.push(eq(marketplaceTransactions.orderStatus, status));
    }

    const result = await db
      .select({
        transaction: marketplaceTransactions,
        listing: {
          id: marketplaceListings.id,
          title: marketplaceListings.title
        },
        seller: marketplaceSellers,
        sellerStudent: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceTransactions)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceTransactions.listingId))
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceTransactions.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(and(...conditions))
      .orderBy(desc(marketplaceTransactions.createdAt));

    return result.map(row => ({ ...row.transaction, listing: row.listing, seller: { ...row.seller, student: row.sellerStudent } }));
  }

  async getClassroomTransactions(classroomId: string, filters?: { status?: string; timeframe?: string }): Promise<any[]> {
    let conditions = [eq(marketplaceSellers.classroomId, classroomId)];
    if (filters?.status) {
      conditions.push(eq(marketplaceTransactions.orderStatus, filters.status));
    }

    const result = await db
      .select({
        transaction: marketplaceTransactions,
        listing: {
          id: marketplaceListings.id,
          title: marketplaceListings.title
        },
        seller: {
          id: marketplaceSellers.id,
          businessName: marketplaceSellers.businessName
        },
        buyer: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceTransactions)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceTransactions.listingId))
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceTransactions.sellerId))
      .innerJoin(users, eq(users.id, marketplaceTransactions.buyerId))
      .where(and(...conditions))
      .orderBy(desc(marketplaceTransactions.createdAt));

    return result.map(row => ({ ...row.transaction, listing: row.listing, seller: row.seller, buyer: row.buyer }));
  }

  // Review management methods
  async createReview(review: InsertMarketplaceReview): Promise<MarketplaceReview> {
    const [newReview] = await db
      .insert(marketplaceReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updateReview(reviewId: string, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview> {
    const [review] = await db
      .update(marketplaceReviews)
      .set(updates)
      .where(eq(marketplaceReviews.id, reviewId))
      .returning();
    return review;
  }

  async getReview(reviewId: string): Promise<MarketplaceReview | undefined> {
    const [review] = await db
      .select()
      .from(marketplaceReviews)
      .where(eq(marketplaceReviews.id, reviewId));
    return review;
  }

  async getSellerReviews(sellerId: string, status?: string): Promise<(MarketplaceReview & { reviewer: Pick<User, 'id' | 'nickname'> })[]> {
    let conditions = [eq(marketplaceReviews.sellerId, sellerId)];
    if (status) {
      conditions.push(eq(marketplaceReviews.reviewStatus, status));
    }

    const result = await db
      .select({
        review: marketplaceReviews,
        reviewer: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceReviews)
      .innerJoin(users, eq(users.id, marketplaceReviews.reviewerId))
      .where(and(...conditions))
      .orderBy(desc(marketplaceReviews.createdAt));

    return result.map(row => ({ ...row.review, reviewer: row.reviewer }));
  }

  async getListingReviews(listingId: string): Promise<(MarketplaceReview & { reviewer: Pick<User, 'id' | 'nickname'> })[]> {
    const result = await db
      .select({
        review: marketplaceReviews,
        reviewer: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceReviews)
      .innerJoin(marketplaceTransactions, eq(marketplaceTransactions.id, marketplaceReviews.transactionId))
      .innerJoin(users, eq(users.id, marketplaceReviews.reviewerId))
      .where(eq(marketplaceTransactions.listingId, listingId))
      .orderBy(desc(marketplaceReviews.createdAt));

    return result.map(row => ({ ...row.review, reviewer: row.reviewer }));
  }

  async flagReview(reviewId: string, reason: string): Promise<MarketplaceReview> {
    const [review] = await db
      .update(marketplaceReviews)
      .set({
        reviewStatus: 'flagged',
        flaggedReason: reason
      })
      .where(eq(marketplaceReviews.id, reviewId))
      .returning();
    return review;
  }

  async moderateReview(reviewId: string, moderatorId: string, action: 'approve' | 'hide'): Promise<MarketplaceReview> {
    const [review] = await db
      .update(marketplaceReviews)
      .set({
        reviewStatus: action === 'approve' ? 'published' : 'hidden',
        moderatedBy: moderatorId
      })
      .where(eq(marketplaceReviews.id, reviewId))
      .returning();
    return review;
  }

  // Wishlist management methods
  async addToWishlist(wishlist: InsertMarketplaceWishlist): Promise<MarketplaceWishlist> {
    const [newWishlist] = await db
      .insert(marketplaceWishlists)
      .values(wishlist)
      .returning();
    return newWishlist;
  }

  async removeFromWishlist(studentId: string, listingId: string): Promise<void> {
    await db
      .delete(marketplaceWishlists)
      .where(and(
        eq(marketplaceWishlists.studentId, studentId),
        eq(marketplaceWishlists.listingId, listingId)
      ));
  }

  async getStudentWishlist(studentId: string): Promise<(MarketplaceWishlist & { listing: MarketplaceListing & { seller: MarketplaceSeller & { student: Pick<User, 'id' | 'nickname'> } } })[]> {
    const result = await db
      .select({
        wishlist: marketplaceWishlists,
        listing: marketplaceListings,
        seller: marketplaceSellers,
        sellerStudent: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceWishlists)
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, marketplaceWishlists.listingId))
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceListings.sellerId))
      .innerJoin(users, eq(users.id, marketplaceSellers.studentId))
      .where(eq(marketplaceWishlists.studentId, studentId))
      .orderBy(asc(marketplaceWishlists.priorityRank), desc(marketplaceWishlists.addedAt));

    return result.map(row => ({ 
      ...row.wishlist, 
      listing: { 
        ...row.listing, 
        seller: { ...row.seller, student: row.sellerStudent } 
      } 
    }));
  }

  async getListingWishlistCount(listingId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(marketplaceWishlists)
      .where(eq(marketplaceWishlists.listingId, listingId));
    return result[0]?.count || 0;
  }

  // Message management methods
  async createMessage(message: InsertMarketplaceMessage): Promise<MarketplaceMessage> {
    const [newMessage] = await db
      .insert(marketplaceMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessages(userId: string, filters?: { transactionId?: string; listingId?: string; conversationWith?: string }): Promise<(MarketplaceMessage & { sender: Pick<User, 'id' | 'nickname'>, recipient: Pick<User, 'id' | 'nickname'> })[]> {
    let conditions = [
      or(
        eq(marketplaceMessages.senderId, userId),
        eq(marketplaceMessages.recipientId, userId)
      )
    ];

    if (filters?.transactionId) {
      conditions.push(eq(marketplaceMessages.transactionId, filters.transactionId));
    }
    if (filters?.listingId) {
      conditions.push(eq(marketplaceMessages.listingId, filters.listingId));
    }
    if (filters?.conversationWith) {
      conditions.push(
        or(
          and(eq(marketplaceMessages.senderId, userId), eq(marketplaceMessages.recipientId, filters.conversationWith)),
          and(eq(marketplaceMessages.senderId, filters.conversationWith), eq(marketplaceMessages.recipientId, userId))
        )
      );
    }

    const result = await db
      .select({
        message: marketplaceMessages,
        sender: {
          id: users.id,
          nickname: users.nickname
        },
        recipient: {
          id: users.id,
          nickname: users.nickname
        }
      })
      .from(marketplaceMessages)
      .innerJoin(users, eq(users.id, marketplaceMessages.senderId))
      .innerJoin(users, eq(users.id, marketplaceMessages.recipientId))
      .where(and(...conditions))
      .orderBy(desc(marketplaceMessages.createdAt));

    return result.map(row => ({ ...row.message, sender: row.sender, recipient: row.recipient }));
  }

  async markMessageAsRead(messageId: string): Promise<MarketplaceMessage> {
    const [message] = await db
      .update(marketplaceMessages)
      .set({ readAt: new Date() })
      .where(eq(marketplaceMessages.id, messageId))
      .returning();
    return message;
  }

  async flagMessage(messageId: string, reason: string): Promise<MarketplaceMessage> {
    const [message] = await db
      .update(marketplaceMessages)
      .set({
        flagged: true,
        flaggedReason: reason
      })
      .where(eq(marketplaceMessages.id, messageId))
      .returning();
    return message;
  }

  // Analytics and insights methods
  async getSellerAnalytics(sellerId: string, timeframe?: string): Promise<{
    totalSales: number;
    totalRevenue: string;
    averageRating: number;
    totalReviews: number;
    activeListings: number;
    pendingOrders: number;
    completedOrders: number;
    topSellingItems: any[];
    revenueByMonth: any[];
  }> {
    // Get seller info with aggregated stats
    const [sellerStats] = await db
      .select()
      .from(marketplaceSellers)
      .where(eq(marketplaceSellers.id, sellerId));

    if (!sellerStats) {
      throw new Error('Seller not found');
    }

    // Get active listings count
    const [activeListingsResult] = await db
      .select({ count: count() })
      .from(marketplaceListings)
      .where(and(
        eq(marketplaceListings.sellerId, sellerId),
        eq(marketplaceListings.status, 'active')
      ));

    // Get pending orders count
    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(marketplaceTransactions)
      .where(and(
        eq(marketplaceTransactions.sellerId, sellerId),
        eq(marketplaceTransactions.orderStatus, 'pending')
      ));

    // Get completed orders count
    const [completedOrdersResult] = await db
      .select({ count: count() })
      .from(marketplaceTransactions)
      .where(and(
        eq(marketplaceTransactions.sellerId, sellerId),
        eq(marketplaceTransactions.orderStatus, 'completed')
      ));

    return {
      totalSales: sellerStats.totalSalesCount,
      totalRevenue: sellerStats.totalRevenue,
      averageRating: parseFloat(sellerStats.averageRating),
      totalReviews: sellerStats.totalReviews,
      activeListings: activeListingsResult?.count || 0,
      pendingOrders: pendingOrdersResult?.count || 0,
      completedOrders: completedOrdersResult?.count || 0,
      topSellingItems: [], // TODO: Implement top selling items query
      revenueByMonth: [] // TODO: Implement revenue by month query
    };
  }

  // Time tracking methods
  async getTimeTrackingSettings(classroomId: string): Promise<any> {
    const [classroom] = await db.select({
      timeTrackingEnabled: classrooms.timeTrackingEnabled,
      maxDailyHours: classrooms.maxDailyHours,
      tokensPerHour: classrooms.tokensPerHour,
      minClockInDuration: classrooms.minClockInDuration
    }).from(classrooms).where(eq(classrooms.id, classroomId));
    return classroom;
  }

  async updateTimeTrackingSettings(classroomId: string, settings: any): Promise<any> {
    const [updated] = await db.update(classrooms)
      .set({
        timeTrackingEnabled: settings.timeTrackingEnabled,
        maxDailyHours: settings.maxDailyHours.toString(),
        tokensPerHour: settings.tokensPerHour,
        minClockInDuration: settings.minClockInDuration,
        updatedAt: new Date()
      })
      .where(eq(classrooms.id, classroomId))
      .returning();
    return updated;
  }

  async createTimeEntry(entry: any): Promise<any> {
    const [created] = await db.insert(timeEntries).values({
      studentId: entry.studentId,
      classroomId: entry.classroomId,
      clockInTime: entry.clockInTime,
      ipAddress: entry.ipAddress,
      status: 'active'
    }).returning();
    return created;
  }

  async updateTimeEntry(id: string, updates: any): Promise<any> {
    const [updated] = await db.update(timeEntries)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(timeEntries.id, id))
      .returning();
    return updated;
  }

  async getActiveTimeEntry(studentId: string, classroomId: string): Promise<any> {
    const [entry] = await db.select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.studentId, studentId),
        eq(timeEntries.classroomId, classroomId),
        eq(timeEntries.status, 'active')
      ))
      .orderBy(desc(timeEntries.createdAt))
      .limit(1);
    return entry;
  }

  async getTimeEntries(classroomId: string, studentId?: string): Promise<any[]> {
    let conditions = [eq(timeEntries.classroomId, classroomId)];
    
    if (studentId) {
      conditions.push(eq(timeEntries.studentId, studentId));
    }

    const entries = await db.select({
      id: timeEntries.id,
      studentId: timeEntries.studentId,
      classroomId: timeEntries.classroomId,
      clockInTime: timeEntries.clockInTime,
      clockOutTime: timeEntries.clockOutTime,
      totalMinutes: timeEntries.totalMinutes,
      tokensEarned: timeEntries.tokensEarned,
      status: timeEntries.status,
      createdAt: timeEntries.createdAt,
      // Add fields expected by frontend
      date: timeEntries.clockInTime, // Use clockInTime as date
      duration: timeEntries.totalMinutes, // Map totalMinutes to duration
      student: {
        id: users.id,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(timeEntries)
    .leftJoin(users, eq(timeEntries.studentId, users.id))
    .where(and(...conditions))
    .orderBy(desc(timeEntries.clockInTime));

    return entries;
  }

  async getTodayTimeHours(studentId: string, classroomId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await db.select({
      totalMinutes: timeEntries.totalMinutes
    })
    .from(timeEntries)
    .where(and(
      eq(timeEntries.studentId, studentId),
      eq(timeEntries.classroomId, classroomId),
      eq(timeEntries.status, 'completed'),
      sql`${timeEntries.clockInTime} >= ${today}`,
      sql`${timeEntries.clockInTime} < ${tomorrow}`
    ));

    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.totalMinutes || 0), 0);
    return totalMinutes / 60; // Convert to hours
  }

  async getActiveTimeSession(userId: string): Promise<any> {
    // Look for an active time session for this user
    const [activeEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.studentId, userId),
        sql`${timeEntries.clockOutTime} IS NULL`
      ))
      .orderBy(desc(timeEntries.clockInTime))
      .limit(1);

    return activeEntry || null;
  }

  async updateUserTokens(userId: string, tokensToAdd: number): Promise<void> {
    try {
      // Update user's token balance
      await db
        .update(users)
        .set({
          tokens: sql`${users.tokens} + ${tokensToAdd}`
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Failed to update user tokens:', error);
      throw error;
    }
  }

  async endTimeSession(sessionId: string, duration: number, tokensEarned: number): Promise<void> {
    try {
      // Update the time entry with clock out time and duration
      await db
        .update(timeEntries)
        .set({
          clockOutTime: new Date(),
          totalMinutes: duration,
          tokensEarned: tokensEarned,
          status: 'completed' // Mark as completed
        })
        .where(eq(timeEntries.id, sessionId));
    } catch (error) {
      console.error('Failed to end time session:', error);
      throw error;
    }
  }

  async getMarketplaceAnalytics(classroomId: string, timeframe?: string): Promise<{
    totalTransactions: number;
    totalVolume: string;
    activeSellers: number;
    activeListings: number;
    averageTransactionValue: string;
    topCategories: any[];
    topSellers: any[];
    transactionsByMonth: any[];
  }> {
    // Get total transactions count and volume
    const transactionStats = await db
      .select({
        count: count(),
        totalVolume: sql<string>`COALESCE(SUM(${marketplaceTransactions.totalAmount}), 0)`
      })
      .from(marketplaceTransactions)
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceTransactions.sellerId))
      .where(eq(marketplaceSellers.classroomId, classroomId));

    // Get active sellers count
    const [activeSellersResult] = await db
      .select({ count: count() })
      .from(marketplaceSellers)
      .where(and(
        eq(marketplaceSellers.classroomId, classroomId),
        eq(marketplaceSellers.sellerStatus, 'active')
      ));

    // Get active listings count
    const activeListingsResult = await db
      .select({ count: count() })
      .from(marketplaceListings)
      .innerJoin(marketplaceSellers, eq(marketplaceSellers.id, marketplaceListings.sellerId))
      .where(and(
        eq(marketplaceSellers.classroomId, classroomId),
        eq(marketplaceListings.status, 'active')
      ));

    const stats = transactionStats[0];
    const totalTransactions = stats?.count || 0;
    const totalVolume = stats?.totalVolume || '0';
    const averageTransactionValue = totalTransactions > 0 
      ? (parseFloat(totalVolume) / totalTransactions).toFixed(2) 
      : '0.00';

    return {
      totalTransactions,
      totalVolume,
      activeSellers: activeSellersResult?.count || 0,
      activeListings: activeListingsResult[0]?.count || 0,
      averageTransactionValue,
      topCategories: [], // TODO: Implement top categories query
      topSellers: [], // TODO: Implement top sellers query
      transactionsByMonth: [] // TODO: Implement transactions by month query
    };
  }
}

export const storage = new DatabaseStorage();
