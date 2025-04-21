import { DataFetcher } from './mock.fetcher';
import { DataProviderInterface, Interval } from './data-providers/provider.interface';
import { FetchedData } from './mock.fetcher';

describe('DataFetcher', () => {
  const mockDataProvider: DataProviderInterface = {
    fetchData: jest.fn(),
  };

  const tokenSymbol = 'USDT';
  const chainId = '1';
  const interval: Interval = '1d';
  const startTime = new Date('2023-01-01');
  const endTime = new Date('2023-01-02');

  let dataFetcher: DataFetcher;

  beforeEach(() => {
    dataFetcher = new DataFetcher(
      mockDataProvider,
      tokenSymbol,
      startTime,
      endTime,
      interval,
      chainId
    );
  });

  it('should fetch data successfully', async () => {
    const mockFetchedData: FetchedData = { data: 'mockData' };
    (mockDataProvider.fetchData as jest.Mock).mockResolvedValue(mockFetchedData);

    const result = await dataFetcher.fetchData();

    expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
      tokenSymbol,
      chainId,
      interval,
      startTime,
      endTime
    );
    expect(result).toEqual(mockFetchedData);
  });

  it('should handle errors during data fetching', async () => {
    const mockError = new Error('Fetch error');
    (mockDataProvider.fetchData as jest.Mock).mockRejectedValue(mockError);

    await expect(dataFetcher.fetchData()).rejects.toThrow('Fetch error');
    expect(mockDataProvider.fetchData).toHaveBeenCalledWith(
      tokenSymbol,
      chainId,
      interval,
      startTime,
      endTime
    );
  });
});
