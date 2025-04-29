import OpenAI from 'openai';
import { Strategy } from '../strategies/strategies.interface';
import { StrategyAdapter } from './strategies/strategy.adapter';
import { PriceData } from '../strategies/s-dca/price-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * MockBatch class
 * This class converts data points from fetcher to batch data which
 * will be fed to OpenAI batch function
 *
 * converts data points to batch data and writes them to a file
 * since openai batch function only accepts `.jsonl` files
 */
export class MockBatch {
  /**
   * sample output
   * {"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-3.5-turbo-0125", "messages": [{"role": "system", "content": "You are a helpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
{"custom_id": "request-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "gpt-3.5-turbo-0125", "messages": [{"role": "system", "content": "You are an unhelpful assistant."},{"role": "user", "content": "Hello world!"}],"max_tokens": 1000}}
   */

  constructor(private readonly strategy: StrategyAdapter) {}

  convertRawDataToBatch(dataPoints: PriceData[]) {}

  static writeBatchToFile(
    batchData: { price: number; timestamp: number }[],
    filePath: string
  ): void {}
}
