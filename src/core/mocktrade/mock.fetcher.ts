import { DataProviderInterface, Interval } from './data-providers/provider.interface';

export type FetchedData = any;

/**
 * DataFetcher class is responsible for fetching data from a specified data provider.
 * It uses the provided token symbol, chain ID, interval, start time, and end time to fetch the data.
 */
export class DataFetcher {
  constructor(
    private readonly dataProvider: DataProviderInterface,
    private readonly tokenSymbol: string,
    private readonly startTime: Date,
    private readonly endTime: Date,
    private readonly interval: Interval,
    private readonly chainId?: string
  ) {}

  /**
   * fetchData method retrieves data from the data provider.
   * It uses the provided token symbol, chain ID, interval, start time, and end time to fetch the data.
   * @returns Promise<FetchedData> - The fetched data
   *
   * This method handles any errors that may occur during the data fetching process.
   * If an error occurs, it logs the error and rethrows it for further handling.
   */
  async fetchData<T>(): Promise<T> {
    try {
      const data = await this.dataProvider.fetchData(
        this.tokenSymbol,
        this.startTime,
        this.endTime,
        this.interval,
        this.chainId
      );
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}
