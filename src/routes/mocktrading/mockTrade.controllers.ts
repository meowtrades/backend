// import { getMockTradeDetails as getMockDetails } from './mockTrade.controllers';
import { CreateMockTradeInput } from './../../core/mocktrade/service';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MockTradeService } from '../../core/services/mockTrade.service';
// import { z } from 'better-auth/*';
import { Frequency, Range, RiskLevel } from '../../core/types';
import { z } from 'zod';
import { MockDataBatch } from '../../models/MockDataBatch';
import { SDCAStrategyAdapter } from '../../core/mocktrade/strategies/nsdca.strategy';
import { OpenAIBatchProcessor } from '../../core/mocktrade/openai.batch.processor';
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

/**
 *
 * @param req
 * @param res
 * @param next
 *
 * Used to get the chart data for a specific mock trade
 * if the batch exists for mock:
 * - if batch is processing
 * - call the batch processor to poll the batch status
 * - if the batch is still processing, return a waiting response
 * - if the batch is completed:
 *   - update the batch status to completed
 *   - store the batch data in the database
 *   - return the chart data
 * - if batch is completed, return the chart data
 * if the batch does not exist:
 * - execute create or link batch function
 * - return a waiting response
 * - if the batch creation fails, return an error response
 * - if the batch creation succeeds, return a waiting response
 */
export const getMockChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const userId = req.user.id;
    const mockTradeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(mockTradeId)) {
      return res.status(400).json({ message: 'Invalid mock trade ID' });
    }

    // Get the chart data for the mock trade
    const chartData = await mockTradeService.getMockTradeChart(mockTradeId);

    if (!chartData) {
      return res.status(404).json({ message: 'Mock trade not found or access denied' });
    }

    res.status(200).json({
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

export const listBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await mockTradeService.listBatches();
    res.status(200).json({ data: batches });
  } catch (error) {
    next(error);
  }
};

export const getBatchFileContent = async (req: Request, res: Response, next: NextFunction) => {
  const fileId = req.params.id;

  const content = await new OpenAIBatchProcessor(new SDCAStrategyAdapter()).getBatchResult(fileId);

  res.status(200).json({
    data: content,
  });
};
