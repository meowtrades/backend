import { PriceData } from '../strategies/s-dca/price-analysis';
import { Strategy } from '../strategies/strategies.interface';

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
      const results: Promise<number>[] = [];

      for (let start = 30; start < dataPoints.length; start++) {
        const executionAmount: Promise<number> = this.strategy.executePlan(
          dataPoints.slice(start - 30, start),
          initialAmount,
          amount
        );

        results.push(executionAmount);
      }

      const resolvedResults = await Promise.all(results);

      return resolvedResults.map((result, index) => ({
        timestamp: dataPoints[index + 30].timestamp,
        price: result,
      }));
    } catch (error) {
      console.error('Error executing strategy:', error);
      throw error;
    }
  }
}
