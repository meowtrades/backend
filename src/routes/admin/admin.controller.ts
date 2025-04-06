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