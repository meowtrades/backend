import { DCAPlugin } from "../types";
import { logger } from '../../utils/logger';

export class MockPlugin implements DCAPlugin {
    name = "mock";
    private mockBalances: Map<string, { usdt: number, native: number }>;
    private transactions: Array<{from: string, to: string, amount: number, timestamp: Date}>;

    constructor() {
        this.mockBalances = new Map();
        this.transactions = [];
        
        // Initialize with some mock balances
        this.mockBalances.set("default-user", { usdt: 1000, native: 100 });
    }

    async sendTransaction(
        amount: number,
        fromAddress: string,
        userWalletAddress: string
    ): Promise<string> {
        try {
            // Generate a mock transaction hash
            const txHash = `mock-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Record the transaction
            this.transactions.push({
                from: fromAddress,
                to: userWalletAddress,
                amount: amount,
                timestamp: new Date()
            });
            
            // Update balances
            this.updateBalance(fromAddress, -amount, 'usdt');
            
            logger.info(`Mock transaction executed: ${amount} from ${fromAddress} to ${userWalletAddress}`);
            logger.info(`Transaction hash: ${txHash}`);
            
            return txHash;
        } catch (error) {
            logger.error(`Mock transaction failed: ${error}`);
            throw new Error(`Failed to execute mock transaction: ${error}`);
        }
    }

    async getUSDTBalance(address: string): Promise<number> {
        const balance = this.getOrCreateBalance(address);
        return balance.usdt;
    }

    async getNativeBalance(address: string): Promise<number> {
        const balance = this.getOrCreateBalance(address);
        return balance.native;
    }

    // Helper methods for the mock plugin
    private getOrCreateBalance(address: string) {
        if (!this.mockBalances.has(address)) {
            this.mockBalances.set(address, { usdt: 1000, native: 100 });
        }
        return this.mockBalances.get(address)!;
    }

    private updateBalance(address: string, amount: number, type: 'usdt' | 'native') {
        const balance = this.getOrCreateBalance(address);
        if (type === 'usdt') {
            balance.usdt += amount;
        } else {
            balance.native += amount;
        }
    }
    
    // Additional method to view all transactions (for debugging)
    getAllTransactions() {
        return this.transactions;
    }
}