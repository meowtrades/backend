import { Request, Response } from "express";
import { DCAService } from "../../core/strategies/s-dca";
import { logger } from "../../utils/logger";
import { InvestmentPlan } from "../../models/InvestmentPlan";

const dcaService = new DCAService();

export const stopAllPlans = async (req: Request, res: Response) => {
    try {
        logger.info("Admin request to stop all DCA plans");
        
        // Get all active plans
        const activePlans = await InvestmentPlan.find({ isActive: true });
        logger.info(`Found ${activePlans.length} active plans to stop`);

        // Stop each plan
        for (const plan of activePlans) {
            try {
                await dcaService.stopPlan(plan._id.toString());
                logger.info(`Successfully stopped plan ${plan._id}`);
            } catch (error) {
                logger.error(`Failed to stop plan ${plan._id}:`, error);
            }
        }

        res.json({
            message: `Successfully stopped ${activePlans.length} active plans`,
            stoppedPlans: activePlans.length
        });
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to stop all plans:", error);
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to stop all plans" });
    }
};

export const getAllActivePlans = async (req: Request, res: Response) => {
    try {
        logger.info("Admin request to get all active plans");
        
        // Get all active plans with detailed information
        const activePlans = await InvestmentPlan.find({ isActive: true })
            .select('userId amount frequency userWalletAddress lastExecutionTime totalInvested executionCount riskLevel chain createdAt')
            .sort({ createdAt: -1 });

        // Group plans by chain
        const plansByChain = activePlans.reduce((acc, plan) => {
            if (!acc[plan.chain]) {
                acc[plan.chain] = [];
            }
            acc[plan.chain].push(plan);
            return acc;
        }, {} as Record<string, typeof activePlans>);

        // Calculate total investment per chain
        const totalInvestmentByChain = activePlans.reduce((acc, plan) => {
            if (!acc[plan.chain]) {
                acc[plan.chain] = 0;
            }
            acc[plan.chain] += plan.totalInvested;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            totalActivePlans: activePlans.length,
            plansByChain,
            totalInvestmentByChain,
            totalInvestment: activePlans.reduce((sum, plan) => sum + plan.totalInvested, 0)
        });
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to get active plans:", error);
            return res.status(500).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to get active plans" });
    }
}; 