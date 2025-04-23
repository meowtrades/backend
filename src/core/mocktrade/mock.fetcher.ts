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
    // 30 Days
    const initialDifference = 30 * 24 * 60 * 60 * 1000;

    try {
      const startTime = new Date(this.startTime.getTime() - initialDifference);

      /**
       * ? Data fetched must be since 30d before the start time
       * to ensure that the strategy has enough data to analyze.
       *
       * The analyzer will calculate the moving average of the last 30 days
       * so it'll need data from 30 days before the start time. To calculate
       * the moving average of the first day, it needs data from the previous 30 days.
       */
      const data = await this.dataProvider.fetchData(
        this.tokenSymbol,
        // this.startTime,
        startTime,
        this.endTime,
        this.interval,
        this.chainId
      );

      console.log(data);
      if (data.s === 'error') {
        throw new Error('Error fetching data from provider');
      }

      return { ...data, days: data.t.length } as T;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}
