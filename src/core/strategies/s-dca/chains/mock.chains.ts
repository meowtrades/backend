import { DCAPlugin } from '../../../types';
import { logger } from '../../../../utils/logger';
import { MockTrade } from '../../../../models/mockTrade.model';
import { UserBalance, IUserBalance } from '../../../../models/UserBalance';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock plugin for simulating trades without real blockchain transactions
 * This allows users to test strategies with mock funds
 */
export class MockPlugin implements DCAPlugin {
  name = 'mock';

  // Simulated token prices relative to USDT (will fluctuate randomly)
  private tokenPrices: Record<string, number> = {
    BTC: 50000,
    ETH: 3000,
    SOL: 100,
    INJ: 20,
  };

  constructor() {
    logger.info('MockPlugin initialized for testing trades');
    // Start price fluctuation simulation
    this.simulatePriceFluctuations();
  }

  /**
   * Simulates price fluctuations for tokens
   * Updates prices every minute with small random changes
   */
  private simulatePriceFluctuations() {
    setInterval(() => {
      for (const token in this.tokenPrices) {
        // Generate random percentage change between -5% and +5%
        const percentChange = (Math.random() * 10 - 5) / 100;
        this.tokenPrices[token] *= 1 + percentChange;
        this.tokenPrices[token] = parseFloat(this.tokenPrices[token].toFixed(2));
      }
      logger.debug('Updated mock token prices:', this.tokenPrices);
    }, 60000); // Every minute
  }

  /**
   * Simulates a swap transaction
   * Records the trade in MockTrade collection and updates user's mock balance
   */
  async sendSwapTransaction(amount: number, fromAddress: string): Promise<string> {
    try {
      logger.info(`Mock swap: ${amount} USDT from ${fromAddress}`);

      // Find existing mock trade for this user
      const mockTrade = await MockTrade.findOne({
        userId: fromAddress,
        status: 'active',
      });

      if (!mockTrade) {
        throw new Error('No active mock trade found for this user');
      }

      // Get token price
      const tokenPrice = this.tokenPrices[mockTrade.tokenSymbol] || 1000;

      // Calculate amount of token to "purchase"
      const tokenAmount = amount / tokenPrice;

      // Create or update user balance record
      let userBalance = await UserBalance.findOne({
        userId: fromAddress,
      });

      if (!userBalance) {
        userBalance = new UserBalance({
          userId: fromAddress,
          balances: [
            {
              chainId: 'mock',
              tokenSymbol: mockTrade.tokenSymbol,
              balance: tokenAmount.toString(),
              lastUpdated: new Date(),
            },
          ],
        });
      } else {
        // Check if balance for this token already exists
        const existingBalanceIndex = userBalance.balances.findIndex(
          b => b.chainId === 'mock' && b.tokenSymbol === mockTrade.tokenSymbol
        );

        if (existingBalanceIndex >= 0) {
          // Update existing balance
          const currentBalance = parseFloat(userBalance.balances[existingBalanceIndex].balance);
          userBalance.balances[existingBalanceIndex].balance = (
            currentBalance + tokenAmount
          ).toString();
          userBalance.balances[existingBalanceIndex].lastUpdated = new Date();
        } else {
          // Add new balance entry
          userBalance.balances.push({
            chainId: 'mock',
            tokenSymbol: mockTrade.tokenSymbol,
            balance: tokenAmount.toString(),
            lastUpdated: new Date(),
          });
        }
      }

      await userBalance.save();

      // Generate a mock transaction hash
      const txHash = `mock-tx-${uuidv4()}`;

      logger.info(
        `Mock swap completed: ${amount} USDT -> ${tokenAmount} ${mockTrade.tokenSymbol}, txHash: ${txHash}`
      );

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
      logger.info(`Mock withdrawal: ${amount} tokens to ${toAddress}`);

      // Generate a mock transaction hash
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
    // Always return 1000 USDT for testing
    return 1000;
  }

  /**
   * Gets mock native token balance
   */
  async getNativeBalance(address: string): Promise<number> {
    try {
      // Get the user's mock trades to find which token they're using
      const mockTrade = await MockTrade.findOne({
        userId: address,
        status: 'active',
      });

      if (!mockTrade) {
        return 0;
      }

      // Look up balance in UserBalance
      const userBalance = await UserBalance.findOne({
        userId: address,
      });

      if (!userBalance) {
        return 0;
      }

      // Find the balance for this token
      const tokenBalance = userBalance.balances.find(
        b => b.chainId === 'mock' && b.tokenSymbol === mockTrade.tokenSymbol
      );

      return tokenBalance ? parseFloat(tokenBalance.balance) : 0;
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
    // For simplicity, using a fixed token price for mock purposes
    return amount * 100; // Assuming a $100 token price
  }
}
