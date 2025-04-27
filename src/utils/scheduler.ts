import cron from 'node-cron';
import { MockTradeService } from '../core/services/mockTrade.service';
import { logger } from './logger';

const mockTradeService = new MockTradeService();

// Mutex to prevent overlapping jobs
let isJobRunning = false;

/**
 * Schedule a daily job to update mock data for all active plans
 */
export const scheduleDailyMockDataUpdate = () => {
  logger.info('Scheduling daily mock data update...');

  cron.schedule('* * * * * *', async () => {
    // Adjusted to run every minute for testing
    if (isJobRunning) {
      // logger.warn('Cron job skipped: A previous instance is still running.');
      return;
    }

    isJobRunning = true; // Acquire the lock
    logger.info('Cron job triggered: Starting daily mock data update...');

    try {
      await mockTradeService.updateMockDataForActivePlans();
      logger.info('Cron job completed: Daily mock data update finished.');
    } catch (error) {
      logger.error('Error during daily mock data update:', error);
    } finally {
      isJobRunning = false; // Release the lock
    }
  });

  logger.info('Cron job scheduled successfully.');
};
