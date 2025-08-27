import cron from 'node-cron';
import { analyticsService } from './analytics';
import { timeTrackingService } from './timeTracking';
import { db } from './db';
import { classrooms } from '../shared/schema';

// Nightly analytics computation
function setupAnalyticsCron() {
  // Run every night at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting nightly analytics computation...');
    
    try {
      // Get all active classrooms
      const activeClassrooms = await db
        .select({ id: classrooms.id })
        .from(classrooms)
        .where({ isActive: true });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Generate analytics for each classroom
      for (const classroom of activeClassrooms) {
        try {
          await analyticsService.generateDailySnapshot(classroom.id, yesterday);
          console.log(`Analytics generated for classroom ${classroom.id}`);
        } catch (error) {
          console.error(`Failed to generate analytics for classroom ${classroom.id}:`, error);
        }
      }

      console.log('Nightly analytics computation completed');
    } catch (error) {
      console.error('Failed to run nightly analytics:', error);
    }
  }, {
    timezone: 'America/New_York' // Adjust to your timezone
  });
}

// Session cleanup cron
function setupSessionCleanupCron() {
  // Temporarily disabled until time_sessions table is created
  // cron.schedule('*/10 * * * *', async () => {
  //   try {
  //     const cleaned = await timeTrackingService.cleanupAbandonedSessions();
  //     if (cleaned > 0) {
  //       console.log(`Cleaned up ${cleaned} abandoned time tracking sessions`);
  //     }
  //   } catch (error) {
  //     console.error('Failed to cleanup sessions:', error);
  //   }
  // });
}

// Weekly analytics aggregation
function setupWeeklyAnalyticsCron() {
  // Run every Monday at 3:00 AM
  cron.schedule('0 3 * * 1', async () => {
    console.log('Starting weekly analytics aggregation...');
    
    try {
      const activeClassrooms = await db
        .select({ id: classrooms.id })
        .from(classrooms)
        .where({ isActive: true });

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      for (const classroom of activeClassrooms) {
        try {
          // Get week's data and generate summary
          const weekData = await analyticsService.getRecentAnalytics(classroom.id, 7);
          
          // Store weekly snapshot (implementation would aggregate daily snapshots)
          console.log(`Weekly analytics generated for classroom ${classroom.id}`);
        } catch (error) {
          console.error(`Failed to generate weekly analytics for classroom ${classroom.id}:`, error);
        }
      }

      console.log('Weekly analytics aggregation completed');
    } catch (error) {
      console.error('Failed to run weekly analytics:', error);
    }
  });
}

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');
  
  setupAnalyticsCron();
  setupSessionCleanupCron();
  setupWeeklyAnalyticsCron();
  
  console.log('Cron jobs initialized');
}

// For manual triggering during development
export async function runManualAnalytics(classroomId?: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (classroomId) {
    return await analyticsService.generateDailySnapshot(classroomId, yesterday);
  }

  const activeClassrooms = await db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where({ isActive: true });

  const results = [];
  for (const classroom of activeClassrooms) {
    const result = await analyticsService.generateDailySnapshot(classroom.id, yesterday);
    results.push({ classroomId: classroom.id, data: result });
  }

  return results;
}