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

export class OpenAIBatchProcessor {
  private static openai: OpenAI | null = null;

  private static getOpenAIClient() {
    if (!OpenAIBatchProcessor.openai) {
      if (!process.env.OPENAI_API_KEY) {
        logger.error('OPENAI_API_KEY is not set');
        throw new Error('OPENAI_API_KEY is not set');
      }
      OpenAIBatchProcessor.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return OpenAIBatchProcessor.openai;
  }

  constructor(private readonly strategy: StrategyAdapter) {}

  public async process(dataPoints: PriceData[]) {
    const filePath = await this.writeBatchToFile(dataPoints);
    const file = await this.createBatchFile(filePath);
    logger.info(`File created: ${file.id}`);
    const batch = await this.uploadBatch(file);
    logger.info(`Batch created: ${batch.id}`);

    try {
      await this.deleteLocalBatchFile(filePath);
      logger.info(`Local batch file deleted: ${filePath}`);
    } catch (err) {
      logger.error('Error deleting local batch file:', err);
    }

    return batch;
  }

  private async writeBatchToFile(dataPoints: PriceData[]): Promise<string> {
    const data = this.strategy.execute(dataPoints);
    const fileName = `batch-${Date.now()}.jsonl`;
    const filePath = `./batch/${fileName}`;

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

  async deleteLocalBatchFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (err) {
      logger.error('Error deleting file:', err);
    }
  }

  private async createBatchFile(filePath: string): Promise<APIPromise<OpenAI.Files.FileObject>> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const file = OpenAIBatchProcessor.getOpenAIClient().files.create({
      file: fileStream,
      purpose: 'batch',
    });

    fileStream.on('error', err => {
      logger.error('Error reading file:', err);
    });

    return file;
  }

  private async uploadBatch(file: OpenAI.Files.FileObject) {
    const batch = await OpenAIBatchProcessor.getOpenAIClient().batches.create({
      input_file_id: file.id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    });

    if (batch.status !== OpenAIStatus.VALIDATING) {
      logger.error('Batch creation failed:', batch);
      throw new Error('Batch creation failed');
    }

    return batch;
  }

  public async getBatchMetadata(batchId: string) {
    return OpenAIBatchProcessor.getOpenAIClient().batches.retrieve(batchId);
  }

  async getStatus(batchId: string) {
    const batch = await this.getBatchMetadata(batchId);
    return batch.status;
  }

  async getBatchResult(fileId: string) {
    const batch = await OpenAIBatchProcessor.getOpenAIClient().files.content(fileId);
    const content = await batch.text();

    logger.info(`Batch content retrieved for fileId: ${fileId}`);

    return content;
  }

  static async listBatches() {
    const batches = await OpenAIBatchProcessor.getOpenAIClient().batches.list();
    return batches.data;
  }

  static async cancelBatch(batchId: string) {
    return await OpenAIBatchProcessor.getOpenAIClient().batches.cancel(batchId);
  }
}
