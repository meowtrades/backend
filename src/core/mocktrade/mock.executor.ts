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
  async execute(data: FetchedData[]): Promise<ExecutorOutput> {
    try {
      const results = data.map(dataPoint => this.strategy.executePlan(dataPoint));
      return results;
    } catch (error) {
      console.error('Error executing strategy:', error);
      throw error;
    }
  }
}
