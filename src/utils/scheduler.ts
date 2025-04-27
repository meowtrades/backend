import cron from 'node-cron';
import { MockTradeService } from '../core/services/mockTrade.service';
import { logger } from './logger';

const mockTradeService = new MockTradeService();

/**
 * Schedule a daily job to update mock data for all active plans
 */
export const scheduleDailyMockDataUpdate = () => {
  logger.info('Scheduling daily mock data update...');

  // Run the cron job daily at midnight
  cron.schedule('0 0 * * *', async () => {
    if (isJobRunning) {
      logger.warn('Cron job skipped: A previous instance is still running.');
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
