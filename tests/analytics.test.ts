import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../server/analytics';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  and: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

vi.mock('../server/db', () => ({
  db: mockDb,
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe('getAssignmentFunnel', () => {
    it('should calculate assignment completion rates correctly', async () => {
      const mockData = [
        {
          assignmentId: '1',
          title: 'Math Quiz',
          category: 'quiz',
          totalStudents: 10,
          submissionCount: 8,
          approvedCount: 6,
          averageTokensAwarded: 15,
        },
      ];

      mockDb.select.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getAssignmentFunnel(
        'classroom-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        assignmentId: '1',
        completionRate: 80, // 8/10 * 100
        approvalRate: 75, // 6/8 * 100
      });
    });

    it('should handle zero division gracefully', async () => {
      const mockData = [
        {
          assignmentId: '1',
          title: 'Empty Assignment',
          totalStudents: 0,
          submissionCount: 0,
          approvedCount: 0,
        },
      ];

      mockDb.select.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getAssignmentFunnel(
        'classroom-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result[0].completionRate).toBe(0);
      expect(result[0].approvalRate).toBe(0);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement scores correctly', () => {
      const metrics = {
        loginCount: 5, // 5 * 5 = 25 points (max 25)
        announcementReads: 3, // 3 * 3 = 9 points
        timeSessionCount: 4, // 4 * 2 = 8 points
        totalTimeMinutes: 180, // 3 hours * 2 = 6 points
        submissionCount: 2, // 2 * 6 = 12 points
      };

      // Access private method for testing using any type
      const score = (analyticsService as any).calculateEngagementScore(metrics);

      expect(score).toBe(60); // 25 + 9 + 8 + 6 + 12
    });

    it('should cap scores at maximum values', () => {
      const metrics = {
        loginCount: 10, // Would be 50, capped at 25
        announcementReads: 10, // Would be 30, capped at 15
        timeSessionCount: 10, // Would be 20, capped at 10
        totalTimeMinutes: 600, // 10 hours, would be 20, capped at 20
        submissionCount: 10, // Would be 60, capped at 30
      };

      const score = (analyticsService as any).calculateEngagementScore(metrics);

      expect(score).toBe(100); // 25 + 15 + 10 + 20 + 30
    });
  });

  describe('generateDailySnapshot', () => {
    it('should create analytics snapshot with aggregated data', async () => {
      // Mock the individual method calls
      const mockAssignmentFunnel = [{ assignmentId: '1', completionRate: 80 }];
      const mockTokenFlow = [{ studentId: '1', totalEarned: 100, totalSpent: 50 }];
      const mockEngagement = [
        { studentId: '1', engagementScore: 75 },
        { studentId: '2', engagementScore: 85 },
      ];

      vi.spyOn(analyticsService, 'getAssignmentFunnel').mockResolvedValue(mockAssignmentFunnel);
      vi.spyOn(analyticsService, 'getTokenFlowByStudent').mockResolvedValue(mockTokenFlow);
      vi.spyOn(analyticsService, 'getEngagementMetrics').mockResolvedValue(mockEngagement);

      const result = await analyticsService.generateDailySnapshot(
        'classroom-1',
        new Date('2024-01-15')
      );

      expect(result.summary).toMatchObject({
        totalStudents: 2,
        averageEngagement: 80, // (75 + 85) / 2
        totalTokensEarned: 100,
        totalTokensSpent: 50,
        totalAssignments: 1,
        averageCompletionRate: 80,
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});