import { db } from './db';
import { eq, and, sql, desc, gte, lte, count } from 'drizzle-orm';
import { 
  classrooms, 
  assignments, 
  submissions, 
  users, 
  studentClassrooms,
  tokenTransactions,
  studentWallets,
  timeEntries,
  announcementReads,
  analyticsSnapshots,
  auditLogs
} from '../shared/schema';

// Real analytics computation functions
export class AnalyticsService {
  
  // Assignment funnel analytics
  async getAssignmentFunnel(classroomId: string, dateFrom: Date, dateTo: Date) {
    // Get all assignments in the classroom
    const assignmentData = await db
      .select({
        assignmentId: assignments.id,
        title: assignments.title,
        category: assignments.category,
        totalStudents: sql<number>`(
          SELECT COUNT(*) FROM ${studentClassrooms} 
          WHERE ${studentClassrooms.classroomId} = ${assignments.classroomId}
        )`,
        submissionCount: sql<number>`(
          SELECT COUNT(*) FROM ${submissions} 
          WHERE ${submissions.assignmentId} = ${assignments.id}
          AND ${submissions.submittedAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        approvedCount: sql<number>`(
          SELECT COUNT(*) FROM ${submissions} 
          WHERE ${submissions.assignmentId} = ${assignments.id}
          AND ${submissions.status} = 'approved'
          AND ${submissions.submittedAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        averageTokensAwarded: sql<number>`(
          SELECT COALESCE(AVG(${submissions.tokensAwarded}), 0) FROM ${submissions} 
          WHERE ${submissions.assignmentId} = ${assignments.id}
          AND ${submissions.status} = 'approved'
          AND ${submissions.submittedAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`
      })
      .from(assignments)
      .where(and(
        eq(assignments.classroomId, classroomId),
        gte(assignments.createdAt, dateFrom)
      ));

    return assignmentData.map(assignment => ({
      ...assignment,
      completionRate: assignment.totalStudents > 0 
        ? (assignment.submissionCount / assignment.totalStudents) * 100 
        : 0,
      approvalRate: assignment.submissionCount > 0 
        ? (assignment.approvedCount / assignment.submissionCount) * 100 
        : 0
    }));
  }

  // Token flow analytics per student
  async getTokenFlowByStudent(classroomId: string, dateFrom: Date, dateTo: Date) {
    const tokenFlow = await db
      .select({
        studentId: users.id,
        studentName: users.name,
        username: users.username,
        currentBalance: studentWallets.currentBalance,
        totalEarned: sql<number>`(
          SELECT COALESCE(SUM(CAST(${tokenTransactions.amount} AS DECIMAL)), 0) 
          FROM ${tokenTransactions} 
          JOIN ${studentWallets} ON ${tokenTransactions.walletId} = ${studentWallets.id}
          WHERE ${studentWallets.studentId} = ${users.id} 
          AND ${studentWallets.classroomId} = ${classroomId}
          AND ${tokenTransactions.transactionType} IN ('earned', 'awarded', 'bonus')
          AND ${tokenTransactions.transactionDate} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        totalSpent: sql<number>`(
          SELECT COALESCE(SUM(CAST(${tokenTransactions.amount} AS DECIMAL)), 0) 
          FROM ${tokenTransactions} 
          JOIN ${studentWallets} ON ${tokenTransactions.walletId} = ${studentWallets.id}
          WHERE ${studentWallets.studentId} = ${users.id} 
          AND ${studentWallets.classroomId} = ${classroomId}
          AND ${tokenTransactions.transactionType} IN ('spent', 'penalty')
          AND ${tokenTransactions.transactionDate} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        transactionCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${tokenTransactions} 
          JOIN ${studentWallets} ON ${tokenTransactions.walletId} = ${studentWallets.id}
          WHERE ${studentWallets.studentId} = ${users.id} 
          AND ${studentWallets.classroomId} = ${classroomId}
          AND ${tokenTransactions.transactionDate} BETWEEN ${dateFrom} AND ${dateTo}
        )`
      })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .leftJoin(studentWallets, and(
        eq(studentWallets.studentId, users.id),
        eq(studentWallets.classroomId, classroomId)
      ))
      .where(eq(studentClassrooms.classroomId, classroomId));

    return tokenFlow;
  }

  // Engagement analytics (logins, reads, clock-ins)
  async getEngagementMetrics(classroomId: string, dateFrom: Date, dateTo: Date) {
    const engagement = await db
      .select({
        studentId: users.id,
        studentName: users.name,
        username: users.username,
        lastLogin: users.lastLogin,
        loginCount: sql<number>`(
          SELECT COUNT(*) FROM ${auditLogs} 
          WHERE ${auditLogs.userId} = ${users.id}
          AND ${auditLogs.action} = 'login'
          AND ${auditLogs.createdAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        announcementReads: sql<number>`(
          SELECT COUNT(*) FROM ${announcementReads} 
          WHERE ${announcementReads.studentId} = ${users.id}
          AND ${announcementReads.readAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        timeSessionCount: sql<number>`(
          SELECT COUNT(*) FROM ${timeEntries} 
          WHERE ${timeEntries.studentId} = ${users.id}
          AND ${timeEntries.classroomId} = ${classroomId}
          AND ${timeEntries.createdAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        totalTimeMinutes: sql<number>`(
          SELECT COALESCE(SUM(${timeEntries.totalMinutes}), 0) FROM ${timeEntries} 
          WHERE ${timeEntries.studentId} = ${users.id}
          AND ${timeEntries.classroomId} = ${classroomId}
          AND ${timeEntries.createdAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`,
        submissionCount: sql<number>`(
          SELECT COUNT(*) FROM ${submissions} 
          JOIN ${assignments} ON ${submissions.assignmentId} = ${assignments.id}
          WHERE ${submissions.studentId} = ${users.id}
          AND ${assignments.classroomId} = ${classroomId}
          AND ${submissions.submittedAt} BETWEEN ${dateFrom} AND ${dateTo}
        )`
      })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(eq(studentClassrooms.classroomId, classroomId));

    return engagement.map(student => ({
      ...student,
      engagementScore: this.calculateEngagementScore({
        loginCount: student.loginCount,
        announcementReads: student.announcementReads,
        timeSessionCount: student.timeSessionCount,
        totalTimeMinutes: student.totalTimeMinutes,
        submissionCount: student.submissionCount
      }),
      averageSessionTime: student.timeSessionCount > 0 
        ? student.totalTimeMinutes / student.timeSessionCount 
        : 0
    }));
  }

  // Calculate engagement score (0-100)
  private calculateEngagementScore(metrics: {
    loginCount: number;
    announcementReads: number;
    timeSessionCount: number;
    totalTimeMinutes: number;
    submissionCount: number;
  }): number {
    const {
      loginCount,
      announcementReads,
      timeSessionCount,
      totalTimeMinutes,
      submissionCount
    } = metrics;

    // Weighted scoring system
    const loginScore = Math.min(loginCount * 5, 25); // Max 25 points
    const readScore = Math.min(announcementReads * 3, 15); // Max 15 points
    const timeScore = Math.min((totalTimeMinutes / 60) * 2, 20); // Max 20 points (hours * 2)
    const sessionScore = Math.min(timeSessionCount * 2, 10); // Max 10 points
    const submissionScore = Math.min(submissionCount * 6, 30); // Max 30 points

    return Math.round(loginScore + readScore + timeScore + sessionScore + submissionScore);
  }

  // Precompute analytics for materialized views
  async generateDailySnapshot(classroomId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      assignmentFunnel,
      tokenFlow,
      engagement
    ] = await Promise.all([
      this.getAssignmentFunnel(classroomId, startOfDay, endOfDay),
      this.getTokenFlowByStudent(classroomId, startOfDay, endOfDay),
      this.getEngagementMetrics(classroomId, startOfDay, endOfDay)
    ]);

    // Aggregate data
    const analyticsData = {
      date: date.toISOString(),
      summary: {
        totalStudents: engagement.length,
        averageEngagement: engagement.reduce((sum, s) => sum + s.engagementScore, 0) / engagement.length || 0,
        totalTokensEarned: tokenFlow.reduce((sum, s) => sum + s.totalEarned, 0),
        totalTokensSpent: tokenFlow.reduce((sum, s) => sum + s.totalSpent, 0),
        totalAssignments: assignmentFunnel.length,
        averageCompletionRate: assignmentFunnel.reduce((sum, a) => sum + a.completionRate, 0) / assignmentFunnel.length || 0
      },
      assignmentFunnel,
      tokenFlow,
      engagement
    };

    // Store snapshot
    await db.insert(analyticsSnapshots).values({
      classroomId,
      snapshotDate: date,
      analyticsType: 'daily',
      data: analyticsData
    }).onConflictDoUpdate({
      target: [analyticsSnapshots.classroomId, analyticsSnapshots.snapshotDate, analyticsSnapshots.analyticsType],
      set: { data: analyticsData }
    });

    return analyticsData;
  }

  // Get cached analytics
  async getCachedAnalytics(classroomId: string, analyticsType: 'daily' | 'weekly' | 'monthly', date: Date) {
    const snapshot = await db
      .select()
      .from(analyticsSnapshots)
      .where(and(
        eq(analyticsSnapshots.classroomId, classroomId),
        eq(analyticsSnapshots.analyticsType, analyticsType),
        eq(analyticsSnapshots.snapshotDate, date)
      ))
      .limit(1);

    return snapshot[0]?.data || null;
  }

  // Get recent analytics (fallback to real-time)
  async getRecentAnalytics(classroomId: string, days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return {
      assignmentFunnel: await this.getAssignmentFunnel(classroomId, startDate, endDate),
      tokenFlow: await this.getTokenFlowByStudent(classroomId, startDate, endDate),
      engagement: await this.getEngagementMetrics(classroomId, startDate, endDate)
    };
  }
}

export const analyticsService = new AnalyticsService();