import mongoose from 'mongoose';
import { MockTrade, IMockTrade } from '../../models/mockTrade.model';
import { Frequency, RiskLevel } from '../types';

// --- Interfaces --- (Define expected inputs/outputs)

export interface CreateMockTradeInput {
  // userId: string;
  strategyId: string;
  tokenSymbol: string;
  amount: number;
  riskLevel: RiskLevel;
  frequency: Frequency;
}

interface MockTradeDetails {
  trade: IMockTrade;
  performanceHistory?: any[]; // Define a proper type later based on price data structure
}

// --- Service Functions ---

/**
 * Creates a new mock trade simulation.
 */
export const create = async (userId: string, input: CreateMockTradeInput): Promise<IMockTrade> => {
  const { strategyId, tokenSymbol, amount, riskLevel, frequency } = input;

  // TODO: Validate strategyId exists
  // TODO: Validate tokenSymbol is supported

  const newMockTrade = new MockTrade({
    userId,
    strategyId,
    tokenSymbol,
    amount,
    initialAmount: amount, // Default to the same amount
    initialInvestment: amount, // Default to the same amount
    riskLevel,
    frequency,
    status: 'active',
  });

  await newMockTrade.save();
  return newMockTrade;
};

/**
 * Finds all active mock trades for a specific user.
 */
export const findActiveByUser = async (userId: string): Promise<IMockTrade[]> => {
  return MockTrade.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

/**
 * Gets the details and historical performance of a specific mock trade.
 */
export const getDetailsById = async (
  mockTradeId: string,
  userId: string, // Ensure user owns the trade
  granularity?: string // e.g., 'daily', 'hourly'
): Promise<MockTradeDetails | null> => {
  const trade = await MockTrade.findOne({ _id: mockTradeId, userId });

  if (!trade) {
    return null; // Or throw AppError('Mock trade not found or access denied', 404)
  }

  // --- Placeholder for fetching price data and calculating performance ---
  console.log(
    `Fetching price data for ${trade.tokenSymbol} from ${trade.startDate} with ${granularity} granularity...`
  );
  // 1. Determine required time range (trade.startDate to now or trade.endDate)
  // 2. Fetch historical price data from an external API (e.g., CoinGecko, Binance)
  // 3. Apply the logic defined by trade.strategyId to the price data
  // 4. Format the results into performanceHistory
  const performanceHistory: any[] = []; // Replace with actual calculated data
  // Example structure: [{ timestamp: Date, value: number }, ...]
  // --------------------------------------------------------------------

  return {
    trade,
    performanceHistory,
  };
};

/**
 * Stops an active mock trade.
 */
export const stopTrade = async (
  mockTradeId: string,
  userId: string
): Promise<IMockTrade | null> => {
  const trade = await MockTrade.findOneAndUpdate(
    { _id: mockTradeId, userId, status: 'active' }, // Find active trade owned by user
    { $set: { status: 'stopped', endDate: new Date() } },
    { new: true } // Return the updated document
  );

  if (!trade) {
    throw new Error('Active mock trade not found or access denied');
  }

  return trade;
};

// --- Helper/Private functions for fetching data and applying strategies ---

// async function fetchPriceData(tokenSymbol: string, startDate: Date, endDate: Date, granularity: string) { ... }
// async function applyStrategy(strategyId: string, priceData: any[]) { ... }
