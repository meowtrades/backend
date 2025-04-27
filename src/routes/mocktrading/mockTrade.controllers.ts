import { rangeToDays } from './../../utils/convertors';
import { CreateMockTradeInput } from './../../core/mocktrade/service';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MockTradeService } from '../../core/services/mockTrade.service';
// import { z } from 'better-auth/*';
import { Frequency, Range, RiskLevel } from '../../core/types';
import { z } from 'zod';
import { InvestmentPlan } from '../../models/InvestmentPlan';
// CreateMockTradeInput;
// Initialize the mock trade service
const mockTradeService = new MockTradeService();

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
    next(error);
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

export const fetchMockData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await mockTradeService.fetchMockData();

    console.log(data);

    return res.status(200).json({
      message: 'Mock data fetched successfully',
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Error fetching mock data',
      error,
    });
  }
};

export async function checkMockData(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await mockTradeService.checkMockData();

    return res.status(200).json({
      message: 'Mock data checked successfully',
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Error checking mock data',
      error,
    });
  }
}

export const getMockChartData = async (req: Request, res: Response, next: NextFunction) => {
  const planId = req.params.id;
  const range = req.query.range as string;

  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return res.status(400).json({ message: 'Invalid plan ID' });
  }

  // Restrict allowed ranges
  const allowedRanges = ['7D', '30D', '90D'];
  if (!allowedRanges.includes(range.toUpperCase())) {
    return res
      .status(400)
      .json({ message: `Invalid range. Allowed ranges are: ${allowedRanges.join(', ')}` });
  }

  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const investmentPlan = await InvestmentPlan.findOne({ _id: planId, userId });

    if (!investmentPlan) {
      return res.status(404).json({ message: 'Investment plan not found or access denied' });
    }

    if (!investmentPlan.mockData || investmentPlan.mockData.length === 0) {
      return res.status(404).json({ message: 'Mock data not available for this plan' });
    }

    // Determine the number of days to slice based on the range
    const rangeDays = rangeToDays(range);

    // Slice the mock data to include only the last `rangeDays` entries
    const filteredData = investmentPlan.mockData.slice(-rangeDays);

    res.status(200).json({
      message: 'Mock chart data fetched successfully',
      data: filteredData,
    });
  } catch (error) {
    next(error);
  }
};
