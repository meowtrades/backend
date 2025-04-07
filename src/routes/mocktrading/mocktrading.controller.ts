import { Request, Response } from 'express';
import { MockPlanService, MockPlanConfig } from '../../core/mocktrading/mockPlanService';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { RiskLevel } from '../../core/types';

const mockPlanService = new MockPlanService();

export const startMockPlanSchema = z.object({
  body: z.object({
    strategy: z.string().min(1, "Strategy is required"),
    tokenId: z.string().min(1, "Token ID is required"),
    initialInvestment: z.number().positive("Initial investment must be positive"),
    riskLevel: z.nativeEnum(RiskLevel),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)).optional(),
    userId: z.string().min(1, "User ID is required")
  })
});

export const getMockPlanSchema = z.object({
  params: z.object({
    planId: z.string().min(1, "Plan ID is required")
  })
});

export const getUserMockPlansSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required")
  })
});

export const startMockPlan = async (req: Request, res: Response) => {
  try {
    const { body } = startMockPlanSchema.parse(req);
    const config: MockPlanConfig = {
      strategy: body.strategy,
      tokenId: body.tokenId,
      initialInvestment: body.initialInvestment,
      riskLevel: body.riskLevel,
      startDate: body.startDate,
      endDate: body.endDate,
      userId: body.userId
    };

    const plan = await mockPlanService.startMockPlan(config);
    res.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error starting mock plan:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to start mock plan' });
  }
};

export const getMockPlan = async (req: Request, res: Response) => {
  try {
    const { params } = getMockPlanSchema.parse(req);
    const plan = mockPlanService.getPlan(params.planId);
    if (!plan) {
      return res.status(404).json({ error: 'Mock plan not found' });
    }
    res.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error getting mock plan:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get mock plan' });
  }
};

export const getUserMockPlans = async (req: Request, res: Response) => {
  try {
    const { params } = getUserMockPlansSchema.parse(req);
    const plans = mockPlanService.getAllPlans();
    const userPlans = plans.filter(plan => plan.config.userId === params.userId);
    res.json(userPlans);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error getting user mock plans:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get user mock plans' });
  }
}; 