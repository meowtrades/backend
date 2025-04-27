import { logger } from '../../utils/logger';
import { PriceData } from '../strategies/s-dca/price-analysis';
import { Strategy } from '../strategies/strategies.interface';
import { RiskLevel } from '../types';

export type ExecutorOutput = {
  price: number;
  timestamp: number;
}[];

/**
 * MockExecutor class is responsible for executing a given strategy on fetched data points.
 * It processes each data point using the strategy's executePlan method.
 */
export class MockExecutor {
  constructor(private readonly strategy: Strategy) {}

  /**
   * Execute the strategy for a given set of data points.
   */
  async execute(
    dataPoints: PriceData[],
    initialAmount: number,
    amount: number,
    risk: RiskLevel
  ): Promise<PriceData[]> {
    try {
      logger.info(`Executing strategy with ${dataPoints.length} data points...`);

      if (dataPoints.length === 0) {
        logger.warn('No data points provided to execute the strategy.');
        return [];
      }

      const results: PriceData[] = [];

      for (let i = 0; i < dataPoints.length; i++) {
        const dataPoint = dataPoints[i];
        logger.debug(`Processing data point: ${JSON.stringify(dataPoint)}`);

        // Simulate strategy execution (replace this with actual logic)
        const processedData: PriceData = {
          date: dataPoint.date,
          price: dataPoint.price * (1 + Math.random() * 0.01 - 0.005), // Simulate a small fluctuation
          timestamp: dataPoint.timestamp,
        };

        results.push(processedData);
      }

      logger.info(`Strategy execution completed. Processed ${results.length} data points.`);
      return results;
    } catch (error) {
      logger.error('Error during strategy execution:', error);
      throw error;
    }
  }
}
