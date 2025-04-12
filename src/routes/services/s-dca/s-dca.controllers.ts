import { Request, Response } from 'express';
import { DCAService } from '../../../core/strategies/s-dca';
import { logger } from '../../../utils/logger';
import { RiskLevel, Frequency, SupportedDCAChains } from '../../../core/types';
import { z } from 'zod';
import { User } from '../../../models/User';
import { PluginFactory } from '../../../core/strategies/s-dca/chains/factory';

export const createPlanSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    userWalletAddress: z.string().min(1, 'User wallet address is required'),
    frequency: z.nativeEnum(Frequency),
    chain: z.nativeEnum(SupportedDCAChains),
    riskLevel: z.nativeEnum(RiskLevel),
  }),
});

export const stopPlanSchema = z.object({
  params: z.object({
    planId: z.string().min(1, 'Plan ID is required'),
  }),
});

export const withdrawTokensSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    chain: z.nativeEnum(SupportedDCAChains),
  }),
});

const dcaService = new DCAService();

export const createPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { body } = createPlanSchema.parse(req);
    const { amount, frequency, userWalletAddress, riskLevel, chain } = body;

    // Validate risk level
    if (riskLevel && !Object.values(RiskLevel).includes(riskLevel)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }

    try {
      const plan = await dcaService.createPlan(userId, {
        amount,
        frequency,
        userWalletAddress,
        chain,
        riskLevel: riskLevel || RiskLevel.NO_RISK,
      });
      res.json(plan);
    } catch (error: any) {
      if (error.message?.includes('Plugin') || error.message?.includes('not found')) {
        return res.status(400).json({ error: `Invalid chain: ${chain}` });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to create DCA plan:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create DCA plan' });
  }
};

export const stopPlan = async (req: Request, res: Response) => {
  try {
    const { params } = stopPlanSchema.parse(req);
    const { planId } = params;

    const plan = await dcaService.stopPlan(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      success: true,
      message: 'Plan stopped and tokens withdrawn successfully',
      plan,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to stop DCA plan:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to stop DCA plan' });
  }
};

export const getUserPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const plans = await dcaService.getUserPlans(userId);
    res.json(plans);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get user plans:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get user plans' });
  }
};

export const getUserTotalInvestment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const total = await dcaService.getUserTotalInvestment(userId);
    res.json({ totalInvestment: total });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get total investment:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get total investment' });
  }
};

export const stopAllUserPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const stoppedCount = await dcaService.stopAllUserPlans(userId);
    res.json({ message: `Successfully stopped ${stoppedCount} plans`, stoppedCount });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to stop all user plans:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to stop all user plans' });
  }
};

export const withdrawTokens = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { body } = withdrawTokensSchema.parse(req);
    const { amount, chain } = body;

    // Get user to verify ownership
    const user = await User.findOne({ _id: userId });
    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the appropriate plugin for the chain
    const plugin = PluginFactory.getPlugin(chain);

    // Execute the withdrawal
    const txHash = await plugin.withdrawTokens(amount, user.address);

    logger.info(
      `Successfully withdrew ${amount} tokens for user ${userId} on chain ${chain}, txHash: ${txHash}`
    );

    res.json({
      success: true,
      txHash,
      message: 'Withdrawal initiated successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to withdraw tokens:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to withdraw tokens' });
  }
};

export const getUserCurrentPositions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const positions = await dcaService.getUserCurrentPositions(userId);
    res.json(positions);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to get current positions:', error);
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get current positions' });
  }
};
