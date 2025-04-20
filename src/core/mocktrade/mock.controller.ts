import { z } from 'zod';
import { MockService } from './mock.service';
import { DataFetcher } from './mock.fetcher';
import { MockExecutor } from './mock.executor';
import { MockTransformer } from './mock.transformer';
import { CoinGeckoDataProvider } from './data-providers/coingecko.provider';
import { Response, Request } from 'express';
/**
 * body
 * private readonly dataProvider: DataProviderInterface,
     private readonly tokenSymbol: string,
     private readonly interval: Interval,
     private readonly startTime: Date,
     private readonly endTime: Date,
     private readonly chainId?: string
*/

const mockTradeDto = z.object({
  tokenSymbol: z.string(),
  chainId: z.string().optional(),
  interval: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']), // '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
  startTime: z.date(),
  endTime: z.date(),
});

class Strategy {
  executePlan(data: any): any {
    // Example strategy logic
    return data;
  }
}

export const getMockTrade = async (req: Request, res: Response) => {
  const { tokenSymbol, chainId, interval, startTime, endTime } = mockTradeDto.parse(req.body);

  const mockService = new MockService(
    new DataFetcher(
      new CoinGeckoDataProvider(),
      tokenSymbol,
      interval,
      startTime,
      endTime,
      chainId
    ),
    new MockExecutor(new Strategy()),
    new MockTransformer()
  );

  try {
    const data = await mockService.getMockPlanData();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getMockTrade:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
