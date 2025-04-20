import { MockExecutor } from './mock.executor';
import { Strategy } from '../strategies/strategies.interface';
import { FetchedData } from './mock.fetcher';

describe('MockExecutor', () => {
  const mockStrategy: Strategy = {
    executePlan: jest.fn(),
  };

  let executor: MockExecutor;

  beforeEach(() => {
    executor = new MockExecutor(mockStrategy);
  });

  it('should execute strategy on fetched data points', async () => {
    const mockData: FetchedData[] = [
      { timestamp: '2023-01-01', value: 100 },
      { timestamp: '2023-01-02', value: 200 },
    ];

    const mockOutput = ['output1', 'output2'];
    (mockStrategy.executePlan as jest.Mock).mockImplementation(dataPoint => {
      return `output${mockData.indexOf(dataPoint) + 1}`;
    });

    const result = await executor.execute(mockData);

    expect(mockStrategy.executePlan).toHaveBeenCalledTimes(mockData.length);
    expect(result).toEqual(mockOutput);
  });

  it('should handle errors during strategy execution', async () => {
    const mockData: FetchedData[] = [{ timestamp: '2023-01-01', value: 100 }];
    (mockStrategy.executePlan as jest.Mock).mockImplementation(() => {
      throw new Error('Execution error');
    });

    await expect(executor.execute(mockData)).rejects.toThrow('Execution error');
    expect(mockStrategy.executePlan).toHaveBeenCalledTimes(1);
  });
});
