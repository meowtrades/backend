import OpenAI from 'openai';
import { StrategyAdapter } from './strategies/strategy.adapter';
import { PriceData } from '../strategies/s-dca/price-analysis';
import fs from 'fs';
import { APIPromise } from 'openai/core';
import { logger } from '../../utils/logger';

export enum OpenAIStatus {
  VALIDATING = 'validating',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress',
  FINALISING = 'finalizing',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLING = 'cancelling',
  CANCELLED = 'cancelled',
}

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
export class OpenAIBatchProcessor {
  /**
   * Constructor for the MockBatch class.
   * @param strategy - An instance of StrategyAdapter to execute the strategy.
   */
  constructor(private readonly strategy: StrategyAdapter) {}

  /**
   * Processes the provided data points by writing them to a file, creating a batch file,
   * and uploading it to OpenAI.
   * @param dataPoints - The PriceData points to be processed.
   * @returns A promise that resolves to the created batch object.
   */
  public async process(dataPoints: PriceData[]) {
    const filePath = await this.writeBatchToFile(dataPoints);
    const file = await this.createBatchFile(filePath);
    logger.info(`File created: ${file.id}`);
    const batch = await this.uploadBatch(file);
    logger.info(`Batch created: ${batch.id}`);

    return batch;
  }

  /**
   * Converts data points to batch data and writes them to a file.
   * @param dataPoints - An array of PriceData points to be converted.
   * @returns The path to the created batch file.
   */
  private async writeBatchToFile(dataPoints: PriceData[]): Promise<string> {
    const data = this.strategy.execute(dataPoints);
    const fileName = `batch-${Date.now()}.jsonl`;
    const filePath = `./batch/${fileName}`;

    // Ensure the directory exists
    await fs.promises.mkdir('./batch', { recursive: true });

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filePath, { flags: 'a' });

      fileStream.on('error', err => {
        logger.error('Error writing to file:', err);
        reject(err);
      });

      fileStream.on('finish', () => {
        logger.info(`File write completed: ${filePath}`);
        resolve(filePath);
      });

      const writeData = (index: number) => {
        if (index >= data.length) {
          fileStream.end();
          return;
        }

        const jsonLine = JSON.stringify(data[index]) + '\n';
        const canWrite = fileStream.write(jsonLine, err => {
          if (err) {
            console.error('Error during write:', err);
            reject(err);
          }
        });

        if (!canWrite) {
          fileStream.once('drain', () => writeData(index + 1));
        } else {
          writeData(index + 1);
        }
      };

      writeData(0);
    });
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

    fileStream.on('error', err => {
      logger.error('Error reading file:', err);
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
   * Retrieves metadata for a specific batch using its ID.
   * @param batchId - The ID of the batch to retrieve metadata for.
   * @returns A promise that resolves to the `Batch` object.
   */
  public async getBatchMetadata(batchId: string) {
    return openai.batches.retrieve(batchId);
  }

  /**
   * Retrieves the status of a specific batch using its ID.
   * @param batchId - The ID of the batch to retrieve the status for.
   * @returns A promise that resolves to the status of the batch.
   */
  async getStatus(batchId: string) {
    const batch = await this.getBatchMetadata(batchId);
    return batch.status;
  }

  /**
   * Retrieves the result of a specific batch using its ID.
   * Stores the result in an output file.
   * @param fileId - The ID of the file to retrieve the result for.
   * @returns A promise that resolves to an array of results from the batch.
   */
  async getBatchResult(fileId: string) {
    const batch = await openai.files.content(fileId);
    const content = await batch.text();

    const outputFilePath = `./batch/output-${fileId}.jsonl`;
    await fs.promises.writeFile(outputFilePath, content, { encoding: 'utf-8' });
    logger.info(`Batch result written to: ${outputFilePath}`);

    return content;
  }

  static async listBatches() {
    const batches = await openai.batches.list();
    return batches.data;
  }
}
