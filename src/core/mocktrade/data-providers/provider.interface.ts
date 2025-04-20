import { FetchedData } from '../mock.fetcher';

export type Interval = '1d' | '1w' | '1m';

export interface DataProviderInterface {
  fetchData(
    tokenSymbol: string, // e.g. "USDT"
    chainId: string, // optional for non-chain-specific providers like CoinGecko
    interval: Interval, // resolution of data points
    startTime: Date,
    endTime: Date
  ): Promise<FetchedData>;
}
