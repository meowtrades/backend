import { DCAPlugin } from '../../../types';
import { logger } from '../../../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock plugin for simulating trades without real blockchain transactions
 * This allows users to test strategies with mock funds
 */
export class MockPlugin implements DCAPlugin {
  name = 'mock';

  constructor() {
    logger.info('MockPlugin initialized for testing trades');
  }

  async sendSwapTransaction(amount: number, fromAddress: string): Promise<string> {
    try {
      const txHash = `mock-tx-${uuidv4()}`;

      logger.info(`Mock swap completed: ${amount} ,  txHash: ${txHash}`);

      return txHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Mock swap failed: ${errorMessage}`);
      throw new Error(`Mock swap failed: ${errorMessage}`);
    }
  }

  /**
   * Simulates token withdrawal
   */
  async withdrawTokens(amount: number, toAddress: string): Promise<string> {
    try {
      const txHash = `mock-withdraw-${uuidv4()}`;

      return txHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Mock withdrawal failed: ${errorMessage}`);
      throw new Error(`Mock withdrawal failed: ${errorMessage}`);
    }
  }

  /**
   * Gets mock USDT balance for testing
   */
  async getUSDTBalance(address: string): Promise<number> {
    return 1200;
  }

  /**
   * Gets mock native token balance
   */
  async getNativeBalance(address: string): Promise<number> {
    try {
      return 1000;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error getting mock native balance: ${errorMessage}`);
      return 0;
    }
  }

  /**
   * Converts native token to USDT value
   */
  async getNativeTokenValueInUSDT(amount: number): Promise<number> {
    return amount * 100;
  }
}
