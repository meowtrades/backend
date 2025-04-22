import { FetchedData } from '../mocktrade/mock.fetcher';
import { PriceData } from './s-dca/price-analysis';

export type StrategyOutput = any;

export interface Strategy {
  executePlan(dataPoint: PriceData[]): Promise<StrategyOutput>;
}
