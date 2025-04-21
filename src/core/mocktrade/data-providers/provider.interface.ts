import { FetchedData } from '../mock.fetcher';

export type Interval = string;

/**
 * DataProviderInterface defines the contract for data providers.
 * It specifies the method to fetch data based on token symbol, chain ID, interval, start time, and end time.
 */
export interface DataProviderInterface {
  /**
   * fetchData method retrieves data from the data provider.
   * @param tokenSymbol - The symbol of the token (e.g., "USDT")
   * @param interval - The resolution of the data points (e.g., "1d", "1w", "1m")
   * @param startTime - The start time for fetching data
   * @param endTime - The end time for fetching data
   * @param chainId - The ID of the blockchain (optional for non-chain-specific providers)
   * @returns Promise<FetchedData> - The fetched data
   */
  fetchData(
    tokenSymbol: string, // e.g. "USDT"
    startTime: Date,
    endTime: Date,
    interval: Interval, // resolution of data points
    chainId?: string // optional for non-chain-specific providers like CoinGecko
  ): Promise<FetchedData>;
}
