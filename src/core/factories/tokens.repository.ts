/**
 * @description This is a repository for tokens. It is used to validate and get a token name.
 */
import { TOKENS } from '../../constants';
import axios from 'axios';

export class TokenRepository {
  static tokens = {
    USDT: 'Tether',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
  };

  private static priceCache: { [key: string]: { price: number; timestamp: number } } = {};
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  static validateAndGetToken(tokenName: string): TokenName {
    const token = this.tokens[tokenName as TokenName];

    if (!token) {
      throw new Error(`Token ${tokenName} not found`);
    }

    return tokenName as TokenName;
  }

  static getTokenName(tokenSymbol: string): string {
    return this.tokens[tokenSymbol as TokenName];
  }

  static async getTokenPrice(tokenSymbol: string): Promise<number> {
    try {
      // Check cache first
      const cached = this.priceCache[tokenSymbol];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.price;
      }

      // Get token info from our constants
      const tokenInfo = TOKENS[tokenSymbol];
      if (!tokenInfo || !tokenInfo.coingeckoId) {
        throw new Error(`Token ${tokenSymbol} not found or missing CoinGecko ID`);
      }

      // Fetch price from CoinGecko
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.coingeckoId}&vs_currencies=usd`
      );

      const price = response.data[tokenInfo.coingeckoId]?.usd;
      if (!price) {
        throw new Error(`Failed to get price for ${tokenSymbol}`);
      }

      // Update cache
      this.priceCache[tokenSymbol] = {
        price,
        timestamp: Date.now(),
      };

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${tokenSymbol}:`, error);
      // Return a fallback price for stablecoins
      if (tokenSymbol === 'USDT' || tokenSymbol === 'USDC') {
        return 1.0;
      }
      throw error;
    }
  }
}

export type TokenName = keyof typeof TokenRepository.tokens;
