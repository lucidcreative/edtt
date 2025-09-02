import {
  // Core tables from schema.ts
  users,
  classrooms,
  studentClassrooms,
  enrollments,
  assignments,
  assignmentResources,
  submissions,
  proposals,
  proposalFeedback,
  proposalNotifications,
  storeItems,
  purchases,
  timeEntries,
  badges,
  studentBadges,
  challenges,
  challengeProgress,
  announcements,
  announcementReads,
  
  // Core types
  type User,
  type InsertUser,
  type Classroom,
  type InsertClassroom,
  type Assignment,
  type InsertAssignment,
  type AssignmentResource,
  type InsertAssignmentResource,
  type Submission,
  type InsertSubmission,
  type Proposal,
  type InsertProposal,
  type ProposalFeedback,
  type InsertProposalFeedback,
  type ProposalNotification,
  type InsertProposalNotification,
  type StoreItem,
  type InsertStoreItem,
  type Purchase,
  type InsertPurchase,
  type TimeEntry,
  type InsertTimeEntry,
  type Badge,
  type InsertBadge,
  type StudentBadge,
  type InsertStudentBadge,
  type Challenge,
  type InsertChallenge,
  type ChallengeProgress,
  type InsertChallengeProgress,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementRead,
  type InsertAnnouncementRead,
  type Enrollment,
  type InsertEnrollment
} from "@shared/schema";

import { db } from "./db";
import { eq, desc, asc, and, or, ne, sql, count } from "drizzle-orm";

export interface IStorage {
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
  
  // Student-Classroom operations
  getClassroomStudents(classroomId: string): Promise<User[]>;
  getStudentClassrooms(studentId: string): Promise<Classroom[]>;
  getClassroomEnrollments(classroomId: string): Promise<(Enrollment & { student: User })[]>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClassroom(classroomId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment>;
  
  // Assignment Resource operations
  getAssignmentResources(assignmentId: string): Promise<AssignmentResource[]>;
  createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource>;
  updateAssignmentResource(id: string, updates: Partial<InsertAssignmentResource>): Promise<AssignmentResource>;
  deleteAssignmentResource(id: string): Promise<void>;
  
  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Omit<InsertSubmission, 'status'>> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<Submission>;

  // Enhanced Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposalsByAssignment(assignmentId: string): Promise<any[]>;
  getProposalsByClassroom(classroomId: string): Promise<any[]>;
  getProposalsByStudent(studentId: string): Promise<Proposal[]>;
  getProposal(proposalId: string): Promise<Proposal | undefined>;
  updateProposal(proposalId: string, updates: Partial<InsertProposal>): Promise<Proposal>;
  updateProposalStatus(proposalId: string, status: Proposal['status'], reviewData?: any): Promise<Proposal>;
  approveProposal(proposalId: string, feedback?: string): Promise<void>;
  rejectProposal(proposalId: string, feedback?: string): Promise<void>;
  requestProposalRevision(proposalId: string, feedback: string): Promise<void>;
  updateProposalProgress(proposalId: string, progressPercentage: number, completedMilestones?: string[]): Promise<Proposal>;
  
  // Proposal Feedback operations
  createProposalFeedback(feedback: InsertProposalFeedback): Promise<ProposalFeedback>;
  getProposalFeedback(proposalId: string): Promise<any[]>;
  
  // Proposal Notifications operations
  createProposalNotification(notification: InsertProposalNotification): Promise<ProposalNotification>;
  getProposalNotifications(userId: string, unreadOnly?: boolean): Promise<ProposalNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;

  // Challenge operations
  getChallengesByClassroom(classroomId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, updates: Partial<InsertChallenge>): Promise<Challenge>;
  getChallengeAnalytics(classroomId: string): Promise<any>;

  // Additional operations
  getLeaderboard(classroomId: string, limit?: number): Promise<any[]>;
  getClassroomStats(classroomId: string): Promise<any>;
  getAnnouncementsByClassroom(classroomId: string): Promise<Announcement[]>;
  getBadgesByClassroom(classroomId: string): Promise<Badge[]>;
  getBadgeAnalytics(classroomId: string): Promise<any>;
  getBadge(id: string): Promise<Badge | undefined>;
  awardBadgeToStudent(data: { studentId: string; badgeId: string; awardedBy: string; reason?: string }): Promise<StudentBadge>;
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByNickname(nickname: string, classroomId: string): Promise<User | undefined> {
    // Get students from this classroom with the specified nickname
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(and(
        eq(users.nickname, nickname),
        eq(studentClassrooms.classroomId, classroomId),
        eq(users.role, 'student')
      ))
      .limit(1);
    
    return result[0]?.user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values([user]).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
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
      .set({ tokens, updatedAt: new Date() })
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
    const [newClassroom] = await db.insert(classrooms).values([classroom]).returning();
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
  async getClassroomStudents(classroomId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(eq(studentClassrooms.classroomId, classroomId));
    
    return result.map(row => row.user);
  }

  async getStudentClassrooms(studentId: string): Promise<Classroom[]> {
    const result = await db
      .select({ classroom: classrooms })
      .from(classrooms)
      .innerJoin(studentClassrooms, eq(classrooms.id, studentClassrooms.classroomId))
      .where(eq(studentClassrooms.studentId, studentId));
    
    return result.map(row => row.classroom);
  }

  async getClassroomEnrollments(classroomId: string): Promise<(Enrollment & { student: User })[]> {
    const result = await db
      .select({
        enrollment: enrollments,
        student: users
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.classroomId, classroomId))
      .orderBy(desc(enrollments.enrolledAt));
    
    return result.map(row => ({
      ...row.enrollment,
      student: row.student
    }));
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

  // Assignment Resource operations
  async getAssignmentResources(assignmentId: string): Promise<AssignmentResource[]> {
    return db
      .select()
      .from(assignmentResources)
      .where(and(
        eq(assignmentResources.assignmentId, assignmentId),
        eq(assignmentResources.isActive, true)
      ))
      .orderBy(assignmentResources.displayOrder, assignmentResources.createdAt);
  }

  async createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource> {
    const [newResource] = await db.insert(assignmentResources).values([resource]).returning();
    return newResource;
  }

  async updateAssignmentResource(id: string, updates: Partial<InsertAssignmentResource>): Promise<AssignmentResource> {
    const [updatedResource] = await db
      .update(assignmentResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignmentResources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteAssignmentResource(id: string): Promise<void> {
    await db
      .update(assignmentResources)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assignmentResources.id, id));
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

  // Enhanced Proposal operations for comprehensive special projects management
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

  async getProposalsByClassroom(classroomId: string): Promise<(Proposal & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'>, assignment: Pick<Assignment, 'id' | 'title'> })[]> {
    const result = await db
      .select({
        proposal: proposals,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        },
        assignment: {
          id: assignments.id,
          title: assignments.title
        }
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.studentId, users.id))
      .innerJoin(assignments, eq(proposals.assignmentId, assignments.id))
      .where(eq(proposals.classroomId, classroomId))
      .orderBy(desc(proposals.createdAt));
    
    return result.map(row => ({
      ...row.proposal,
      student: row.student,
      assignment: row.assignment
    }));
  }

  async getProposalsByStudent(studentId: string): Promise<Proposal[]> {
    return db
      .select()
      .from(proposals)
      .where(eq(proposals.studentId, studentId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposal(proposalId: string): Promise<Proposal | undefined> {
    const result = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);
    
    return result[0];
  }

  async updateProposal(proposalId: string, updates: Partial<InsertProposal>): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  async updateProposalStatus(proposalId: string, status: Proposal['status'], reviewData?: { teacherFeedback?: string; internalNotes?: string }): Promise<Proposal> {
    const updateData: any = { 
      status, 
      updatedAt: new Date(),
      reviewedAt: new Date()
    };
    
    if (reviewData?.teacherFeedback) updateData.teacherFeedback = reviewData.teacherFeedback;
    if (reviewData?.internalNotes) updateData.internalNotes = reviewData.internalNotes;
    if (status === 'approved') updateData.approvedAt = new Date();
    if (status === 'needs_revision') {
      updateData.revisionCount = sql`${proposals.revisionCount} + 1`;
      updateData.lastRevisionDate = new Date();
    }

    const [updatedProposal] = await db
      .update(proposals)
      .set(updateData)
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  async approveProposal(proposalId: string, feedback?: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'approved', { teacherFeedback: feedback });
  }

  async rejectProposal(proposalId: string, feedback?: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'rejected', { teacherFeedback: feedback });
  }

  async requestProposalRevision(proposalId: string, feedback: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'needs_revision', { teacherFeedback: feedback });
  }

  async updateProposalProgress(proposalId: string, progressPercentage: number, completedMilestones?: string[]): Promise<Proposal> {
    const updateData: any = { 
      progressPercentage, 
      updatedAt: new Date() 
    };
    
    if (completedMilestones) updateData.completedMilestones = completedMilestones;
    if (progressPercentage >= 100) updateData.status = 'completed';

    const [updatedProposal] = await db
      .update(proposals)
      .set(updateData)
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  // Proposal Feedback operations
  async createProposalFeedback(feedback: InsertProposalFeedback): Promise<ProposalFeedback> {
    const [newFeedback] = await db.insert(proposalFeedback).values([feedback]).returning();
    return newFeedback;
  }

  async getProposalFeedback(proposalId: string): Promise<(ProposalFeedback & { fromUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'nickname'> })[]> {
    const result = await db
      .select({
        feedback: proposalFeedback,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          nickname: users.nickname
        }
      })
      .from(proposalFeedback)
      .innerJoin(users, eq(proposalFeedback.fromUserId, users.id))
      .where(eq(proposalFeedback.proposalId, proposalId))
      .orderBy(desc(proposalFeedback.createdAt));
    
    return result.map(row => ({
      ...row.feedback,
      fromUser: row.fromUser
    }));
  }

  // Proposal Notifications operations
  async createProposalNotification(notification: InsertProposalNotification): Promise<ProposalNotification> {
    const [newNotification] = await db.insert(proposalNotifications).values([notification]).returning();
    return newNotification;
  }

  async getProposalNotifications(userId: string, unreadOnly: boolean = false): Promise<ProposalNotification[]> {
    let query = db
      .select()
      .from(proposalNotifications)
      .where(eq(proposalNotifications.userId, userId));

    if (unreadOnly) {
      query = query.where(eq(proposalNotifications.isRead, false));
    }

    return query.orderBy(desc(proposalNotifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(proposalNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(proposalNotifications.id, notificationId));
  }

  // Challenge operations
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
    const [updatedChallenge] = await db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return updatedChallenge;
  }

  async getChallengeAnalytics(classroomId: string): Promise<any> {
    // Get basic challenge counts and completion rates
    const challengesInClassroom = await this.getChallengesByClassroom(classroomId);
    const totalChallenges = challengesInClassroom.length;
    const activeChallenges = challengesInClassroom.filter(c => c.isActive).length;
    const completedChallenges = challengesInClassroom.filter(c => !c.isActive).length;

    // Calculate completion rates by type (simplified for now)
    const individualChallenges = challengesInClassroom.filter(c => c.type === 'individual');
    const teamChallenges = challengesInClassroom.filter(c => c.type === 'team');
    const classroomChallenges = challengesInClassroom.filter(c => c.type === 'classroom');

    const individualCompletion = individualChallenges.length > 0 
      ? (individualChallenges.filter(c => !c.isActive).length / individualChallenges.length) * 100 
      : 0;
    const teamCompletion = teamChallenges.length > 0 
      ? (teamChallenges.filter(c => !c.isActive).length / teamChallenges.length) * 100 
      : 0;
    const classroomCompletion = classroomChallenges.length > 0 
      ? (classroomChallenges.filter(c => !c.isActive).length / classroomChallenges.length) * 100 
      : 0;

    // Get total participants (students in classroom)
    const students = await this.getClassroomStudents(classroomId);
    const totalParticipants = students.length;

    // Calculate overall completion rate
    const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

    return {
      totalChallenges,
      activeChallenges,
      completedChallenges,
      totalParticipants,
      completionRate: Math.round(completionRate),
      individualCompletion: Math.round(individualCompletion),
      teamCompletion: Math.round(teamCompletion),
      classroomCompletion: Math.round(classroomCompletion)
    };
  }

  // Additional storage methods
  async getLeaderboard(classroomId: string, limit: number = 10): Promise<any[]> {
    const result = await db
      .select({
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName,
          tokens: users.tokens,
          level: users.level,
          totalEarned: users.totalEarnings
        }
      })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(
        and(
          eq(studentClassrooms.classroomId, classroomId),
          eq(users.role, 'student')
        )
      )
      .orderBy(desc(users.tokens), desc(users.totalEarnings))
      .limit(limit);

    return result.map((row, index) => ({
      ...row.student,
      rank: index + 1
    }));
  }

  async getClassroomStats(classroomId: string): Promise<any> {
    const students = await this.getClassroomStudents(classroomId);
    const totalStudents = students.length;
    const totalTokens = students.reduce((sum, student) => sum + (student.tokens || 0), 0);
    const avgTokens = totalStudents > 0 ? Math.round(totalTokens / totalStudents) : 0;
    
    // Get badges count
    const badges = await this.getBadgesByClassroom(classroomId);
    const totalBadges = badges.length;
    
    // Get challenges count
    const challenges = await this.getChallengesByClassroom(classroomId);
    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.isActive).length;

    return {
      totalStudents,
      totalTokens,
      avgTokens,
      totalBadges,
      totalChallenges,
      activeChallenges
    };
  }

  async getAnnouncementsByClassroom(classroomId: string): Promise<Announcement[]> {
    return db
      .select()
      .from(announcements)
      .where(eq(announcements.classroomId, classroomId))
      .orderBy(desc(announcements.createdAt));
  }

  async getBadgesByClassroom(classroomId: string): Promise<Badge[]> {
    return db
      .select()
      .from(badges)
      .where(eq(badges.classroomId, classroomId))
      .orderBy(asc(badges.name));
  }

  async getBadgeAnalytics(classroomId: string): Promise<any> {
    const badgesList = await this.getBadgesByClassroom(classroomId);
    const students = await this.getClassroomStudents(classroomId);
    
    // Get badge awards for this classroom
    const awardedBadges = await db
      .select({
        badgeId: studentBadges.badgeId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(studentBadges)
      .innerJoin(badges, eq(studentBadges.badgeId, badges.id))
      .where(eq(badges.classroomId, classroomId))
      .groupBy(studentBadges.badgeId);

    const totalBadges = badgesList.length;
    const totalStudents = students.length;
    const totalAwards = awardedBadges.reduce((sum, badge) => sum + badge.count, 0);
    const avgBadgesPerStudent = totalStudents > 0 ? Math.round(totalAwards / totalStudents) : 0;

    return {
      totalBadges,
      totalStudents,
      totalAwards,
      avgBadgesPerStudent,
      popularBadges: awardedBadges.slice(0, 5)
    };
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return badge;
  }

  async awardBadgeToStudent(data: { studentId: string; badgeId: string; awardedBy: string; reason?: string }): Promise<StudentBadge> {
    const [award] = await db.insert(studentBadges).values([{
      ...data,
      awardedAt: new Date()
    }]).returning();
    return award;
  }
}

export const storage = new DatabaseStorage();