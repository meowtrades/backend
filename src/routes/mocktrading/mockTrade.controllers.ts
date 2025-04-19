import { CreateMockTradeInput } from './../../core/mocktrade/service';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MockTradeService } from '../../core/services/mockTrade.service';
// import { z } from 'better-auth/*';
import { Frequency, RiskLevel } from '../../core/types';
import { z } from 'zod';
// CreateMockTradeInput;
// Initialize the mock trade service
const mockTradeService = new MockTradeService();

/**
 * strategyId: string;
   tokenSymbol: string;
   amount: number;
   riskLevel: RiskLevel;
   frequency: Frequency;

 */
const createMockTradeSchema = z.object({
  strategyId: z.string().min(1, 'strategyId is required'),
  tokenSymbol: z.string().min(1, 'tokenSymbol is required'),
  amount: z.number().positive('Initial investment must be a positive number').default(100),
  riskLevel: z.nativeEnum(RiskLevel).default(RiskLevel.MEDIUM_RISK),
  frequency: z.nativeEnum(Frequency).default(Frequency.DAILY),
});

export const createMockTrade = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    let data: z.infer<typeof createMockTradeSchema>;

    try {
      data = createMockTradeSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const { strategyId, tokenSymbol, amount, riskLevel, frequency } = data;

    // Validate required fields
    // if (!strategyId || !tokenSymbol || !initialInvestment) {
    //   return res.status(400).json({
    //     message:
    //       'Missing required fields. strategyId, tokenSymbol, and initialInvestment are required.',
    //   });
    // }

    // Validate investment amount
    // if (isNaN(Number(amount)) || Number(amount) <= 0) {
    //   return res.status(400).json({ message: 'Initial investment must be a positive number' });
    // }

    // Create the mock trade
    const mockTrade = await mockTradeService.createMockTrade(userId, {
      strategyId,
      tokenSymbol: tokenSymbol.toUpperCase(),
      amount,
      riskLevel,
      frequency,
    });

    res.status(201).json({
      message: 'Mock trade created successfully',
      data: mockTrade,
    });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

export const getActiveMockTrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    // Get active trades for the user
    const activeTrades = await mockTradeService.getActiveMockTrades(userId);

    res.status(200).json({ data: activeTrades });
  } catch (error) {
    next(error);
  }
};

export const getMockTradeDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const mockTradeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(mockTradeId)) {
      return res.status(400).json({ message: 'Invalid mock trade ID' });
    }

    // Get trade details
    const tradeDetails = await mockTradeService.getMockTradeDetails(mockTradeId, userId);

    if (!tradeDetails) {
      return res.status(404).json({ message: 'Mock trade not found or access denied' });
    }

    // If the trade is active, also get current position
    let position = null;
    if (tradeDetails.status === 'active') {
      position = await mockTradeService.getMockTradePosition(mockTradeId, userId);
    }

    res.status(200).json({
      data: {
        trade: tradeDetails,
        position: position,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const stopMockTrade = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const mockTradeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(mockTradeId)) {
      return res.status(400).json({ message: 'Invalid mock trade ID' });
    }

    // Stop the trade
    const updatedTrade = await mockTradeService.stopMockTrade(mockTradeId, userId);

    if (!updatedTrade) {
      return res.status(404).json({ message: 'Mock trade not found or already stopped' });
    }

    res.status(200).json({
      message: 'Mock trade stopped successfully',
      data: updatedTrade,
    });
  } catch (error) {
    next(error);
  }
};

export const getMockTradeChartValues = async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;
    const data = await mockTradeService.getMockTradePositionForChart(tradeId, userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
};

// Placeholder for potential future strategy backtest endpoint
// export const getStrategyBacktest = async (req: Request, res: Response, next: NextFunction) => { ... };
