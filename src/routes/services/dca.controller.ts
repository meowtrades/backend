import { Request, Response } from 'express';
import { DCAService } from '../../core/strategies/basic/smart-dca';
import { logger } from '../../utils/logger';
import { RiskLevel } from '../../models/InvestmentPlan';

const dcaService = new DCAService();

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { userId, amount, frequency, toAddress, riskLevel } = req.body;
    
    if (!userId || !amount || !frequency || !toAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate risk level
    if (riskLevel && !Object.values(RiskLevel).includes(riskLevel)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }

    const plan = await dcaService.createPlan(userId, {
      amount,
      frequency,
      toAddress,
      riskLevel: riskLevel || RiskLevel.NO_RISK
    });

    res.json(plan);
  } catch (error) {
    logger.error('Failed to create DCA plan:', error);
    res.status(500).json({ error: 'Failed to create DCA plan' });
  }
};

export const stopPlan = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = await dcaService.stopPlan(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    logger.error('Failed to stop DCA plan:', error);
    res.status(500).json({ error: 'Failed to stop DCA plan' });
  }
};

export const getUserPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const plans = await dcaService.getUserPlans(userId);
    res.json(plans);
  } catch (error) {
    logger.error('Failed to get user plans:', error);
    res.status(500).json({ error: 'Failed to get user plans' });
  }
};

export const getUserTotalInvestment = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const total = await dcaService.getUserTotalInvestment(userId);
    res.json({ totalInvestment: total });
  } catch (error) {
    logger.error('Failed to get total investment:', error);
    res.status(500).json({ error: 'Failed to get total investment' });
  }
}; 