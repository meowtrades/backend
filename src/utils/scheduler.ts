import cron from 'node-cron';
import { MockTradeService } from '../core/services/mockTrade.service';
import { logger } from './logger';

const mockTradeService = new MockTradeService();

/**
 * Schedule a daily job to update mock data for all active plans
 */
export const scheduleDailyMockDataUpdate = () => {
  logger.info('Scheduling daily mock data update...');

  // Use a more frequent schedule for testing (e.g., every minute)
  cron.schedule('* * * * *', async () => {
    logger.info('Cron job triggered: Starting daily mock data update...');
    try {
      await mockTradeService.updateMockDataForActivePlans();
      logger.info('Cron job completed: Daily mock data update completed successfully.');
    } catch (error) {
      logger.error('Cron job error: Error during daily mock data update:', error);
    }
  });

  logger.info('Cron job scheduled successfully.');
};
