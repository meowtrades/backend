import { PriceData } from '../strategies/s-dca/price-analysis';
import { Strategy } from '../strategies/strategies.interface';
import { FetchedData } from './mock.fetcher';

export type ExecutorOutput = any;

/**
 * MockExecutor class is responsible for executing a given strategy on fetched data points.
 * It processes each data point using the strategy's executePlan method.
 */
export class MockExecutor {
  constructor(private readonly strategy: Strategy) {}

  /**
   *
   * @param data - Fetched data points to be processed by the strategy
   * @returns Promise<ExecutorOutput> - The output of the strategy execution
   *
   * This method executes the strategy on the provided data points.
   * It processes each data point using the strategy's executePlan method.
   * The strategy's executePlan method is expected to return a StrategyOutput.
   * The output can be used for further processing or logging.
   */
  async execute(
    dataPoints: PriceData[],
    initialAmount: number,
    amount: number
  ): Promise<ExecutorOutput> {
    try {
      const results: ExecutorOutput[] = [];

      for (let start = 30; start < dataPoints.length; start++) {
        const dataPoint = dataPoints[start];
        const executionAmount = await this.strategy.executePlan(
          dataPoints.slice(start - 30, start),
          initialAmount,
          amount
        );

        results.push({
          price: executionAmount,
          timestamp: dataPoint.timestamp,
        });
      }

      return results;
    } catch (error) {
      console.error('Error executing strategy:', error);
      throw error;
    }
  }
}
