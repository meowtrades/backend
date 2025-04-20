import { FetchedData } from '../mock.fetcher';
import { DataProviderInterface, Interval } from './provider.interface';

export class CoinGeckoDataProvider implements DataProviderInterface {
  fetchData(
    tokenSymbol: string, // e.g. "USDT"
    chainId: string, // optional for non-chain-specific providers like CoinGecko
    interval: Interval, // resolution of data points
    startTime: Date,
    endTime: Date
  ): Promise<FetchedData> {
    throw new Error('Method not implemented.');
  }
}
