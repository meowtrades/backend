import { FetchedData } from '../mocktrade/mock.fetcher';

export type StrategyOutput = any;

export interface Strategy {
  executePlan(dataPoint: FetchedData): StrategyOutput;
}
