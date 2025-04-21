import axios from 'axios';
import { FetchedData } from '../mock.fetcher';
import { DataProviderInterface, Interval } from './provider.interface';

export type PythProviderInterval = '1' | '5' | '15' | '30' | '60' | '240' | 'D' | 'W' | 'M';

export class PythProvider implements DataProviderInterface {
  private static readonly baseUrl: string =
    'https://benchmarks.pyth.network/v1/shims/tradingview/history';

  async fetchData(
    tokenSymbol: string,
    startTime: Date,
    endTime: Date,
    interval: PythProviderInterval,
    chainId?: string
  ): Promise<FetchedData> {
    // PARAMS ?symbol=Crypto.BTC%2FUSD&resolution=1&from=1684137600&to=1684141200
    const response = await axios.get(PythProvider.baseUrl, {
      params: {
        symbol: tokenSymbol,
        from: Math.floor(startTime.getTime() / 1000),
        to: Math.floor(endTime.getTime() / 1000),
        resolution: interval,
      },
    });
    return await response.data;
  }
}
