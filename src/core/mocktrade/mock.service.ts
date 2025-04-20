import { MockExecutor } from './mock.executor';
import { DataFetcher } from './mock.fetcher';
import { MockTransformer } from './mock.transformer';

/**
 * Make use of fetcher, executor and transformer to create a mock service.
 */
export class MockService {
  constructor(
    private readonly fetcher: DataFetcher,
    private readonly executor: MockExecutor,
    private readonly transformer: MockTransformer
  ) {}

  async getMockPlanData() {
    try {
      // Fetch data
      const fetchedData = await this.fetcher.fetchData();

      // Execute the mock plan
      const executionResult = await this.executor.execute(fetchedData);

      // Transform the data for graphing
      const transformedData = this.transformer.transform(executionResult);

      return transformedData;
    } catch (error) {
      console.error('Error in MockService:', error);
      throw error;
    }
  }
}
