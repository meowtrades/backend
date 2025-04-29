import OpenAI from 'openai';
import { StrategyAdapter } from './strategies/strategy.adapter';
import { PriceData } from '../strategies/s-dca/price-analysis';
import fs from 'fs';
import { APIPromise } from 'openai/core';

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
   * Constructor for the MockBatch class.
   * @param strategy - An instance of StrategyAdapter to execute the strategy.
   */
  constructor(private readonly strategy: StrategyAdapter) {}

  /**
   * Converts data points to batch data and writes them to a file.
   * @param dataPoints - An array of PriceData points to be converted.
   * @returns The path to the created batch file.
   */
  private writeBatchToFile(dataPoints: PriceData[]): string {
    const data = this.strategy.execute(dataPoints);
    const fileName = `batch-${Date.now()}.jsonl`;
    const filePath = `./batch/${fileName}`;

    const fileStream = fs.createWriteStream(filePath, { flags: 'a' });

    data.forEach(batchInput => {
      const jsonLine = JSON.stringify(batchInput) + '\n';
      fileStream.write(jsonLine);
    });

    fileStream.on('error', err => {
      console.error('Error writing to file:', err);
    });

    fileStream.on('finish', () => {
      console.log('File write completed.');
    });

    fileStream.end();
    console.log(`Batch data written to ${filePath}`);

    return filePath;
  }

  /**
   * Creates a batch file for OpenAI using the provided file path.
   * @param filePath - The path to the batch file to be created.
   * @returns A promise that resolves to the created file object.
   */
  private async createBatchFile(filePath: string): Promise<APIPromise<OpenAI.Files.FileObject>> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const file = openai.files.create({
      file: fileStream,
      purpose: 'batch',
    });

    return file;
  }

  /**
   * Uploads a batch file to OpenAI.
   * @param file - The file object to be uploaded.
   * @returns A promise that resolves to the created batch object.
   */
  private async uploadBatch(file: OpenAI.Files.FileObject) {
    const batch = await openai.batches.create({
      input_file_id: file.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    });

    return batch;
  }

  /**
   * Processes the provided data points by writing them to a file, creating a batch file,
   * and uploading it to OpenAI.
   * @param dataPoints - The PriceData points to be processed.
   * @returns A promise that resolves to the created batch object.
   */
  public async process(dataPoints: PriceData) {
    const filePath = this.writeBatchToFile([dataPoints]);
    const file = await this.createBatchFile(filePath);
    const batch = await this.uploadBatch(file);

    return batch;
  }

  /**
   * Retrieves metadata for a specific batch using its ID.
   * @param batchId - The ID of the batch to retrieve metadata for.
   * @returns A promise that resolves to the `Batch` object.
   */
  public async getBatchMetadata(batchId: string) {
    return openai.batches.retrieve(batchId);
  }

  async getStatus(batchId: string) {
    const batch = await this.getBatchMetadata(batchId);
    return batch.status;
  }

  async getBatchResult(fileId: string) {
    const batch = await openai.files.content(fileId);
    const content = await batch.text();
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const results = lines.map(line => {
      const parsedLine = JSON.parse(line);
      return parsedLine.choices[0].message.content;
    });
    return results;
  }
}
