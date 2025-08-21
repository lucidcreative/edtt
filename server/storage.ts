import {
  users,
  classrooms,
  studentClassrooms,
  assignments,
  submissions,
  storeItems,
  purchases,
  badges,
  studentBadges,
  challenges,
  challengeProgress,
  type User,
  type InsertUser,
  type Classroom,
  type InsertClassroom,
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
  type ChallengeProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, count } from "drizzle-orm";

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
  
  // Student-Classroom operations
  joinClassroom(studentId: string, classroomId: string): Promise<StudentClassroom>;
  getClassroomStudents(classroomId: string): Promise<(User & { joinedAt: Date })[]>;
  getStudentClassrooms(studentId: string): Promise<Classroom[]>;
  
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
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.code, code));
    return classroom;
  }

  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    return db.select().from(classrooms).where(eq(classrooms.teacherId, teacherId));
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    const [newClassroom] = await db.insert(classrooms).values(classroom).returning();
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
}

export const storage = new DatabaseStorage();
