import { Router } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { analyticsService } from '../analytics';
import { timeTrackingService } from '../timeTracking';
import { auditLogs } from '../../shared/schema';

const router = Router();

// Analytics routes - real data endpoints
router.get('/classroom/:classroomId', async (req: any, res) => {
  try {
    const { classroomId } = req.params;
    const { period = '7', type = 'recent' } = req.query;
    
    let analyticsData;
    
    if (type === 'cached') {
      // Try to get cached analytics first
      const date = new Date();
      date.setDate(date.getDate() - 1); // Yesterday's data
      analyticsData = await analyticsService.getCachedAnalytics(classroomId, 'daily', date);
      
      if (!analyticsData) {
        // Fallback to real-time if no cached data
        analyticsData = await analyticsService.getRecentAnalytics(classroomId, parseInt(period));
      }
    } else {
      // Real-time analytics
      analyticsData = await analyticsService.getRecentAnalytics(classroomId, parseInt(period));
    }
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

router.get('/classroom/:classroomId/assignment-funnel', async (req: any, res) => {
  try {
    const { classroomId } = req.params;
    const { days = '30' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    const funnelData = await analyticsService.getAssignmentFunnel(classroomId, startDate, endDate);
    res.json(funnelData);
  } catch (error) {
    console.error('Assignment funnel error:', error);
    res.status(500).json({ message: 'Failed to fetch assignment funnel data' });
  }
});

router.get('/classroom/:classroomId/token-flow', async (req: any, res) => {
  try {
    const { classroomId } = req.params;
    const { days = '30' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    const tokenData = await analyticsService.getTokenFlowByStudent(classroomId, startDate, endDate);
    res.json(tokenData);
  } catch (error) {
    console.error('Token flow error:', error);
    res.status(500).json({ message: 'Failed to fetch token flow data' });
  }
});

router.get('/classroom/:classroomId/engagement', async (req: any, res) => {
  try {
    const { classroomId } = req.params;
    const { days = '30' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    const engagementData = await analyticsService.getEngagementMetrics(classroomId, startDate, endDate);
    res.json(engagementData);
  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({ message: 'Failed to fetch engagement data' });
  }
});

export default router;