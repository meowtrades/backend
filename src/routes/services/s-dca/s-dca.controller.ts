import { Request, Response } from "express";
import { DCAService } from "../../../core/strategies/s-dca";
import { logger } from "../../../utils/logger";
import { RiskLevel, Frequency, SupportedDCAChains } from "../../../core/types";
import { z } from "zod";

export const createPlanSchema = z.object({
    body: z.object({
        userId: z.string().min(1, "User ID is required"),
        amount: z.number().positive("Amount must be positive"),
        userWalletAddress: z.string().min(1, "User wallet address is required"),
        frequency: z.nativeEnum(Frequency),
        chain: z.nativeEnum(SupportedDCAChains),
        riskLevel: z.nativeEnum(RiskLevel)
    }),
});

export const stopPlanSchema = z.object({
    params: z.object({
        planId: z.string().min(1, "Plan ID is required"),
    }),
});

export const getUserPlansSchema = z.object({
    params: z.object({
        userId: z.string().min(1, "User ID is required"),
    }),
});

export const getUserTotalInvestmentSchema = z.object({
    params: z.object({
        userId: z.string().min(1, "User ID is required"),
    }),
});

export const stopAllPlansSchema = z.object({
    params: z.object({
        userId: z.string().min(1, "User ID is required"),
    }),
});

const dcaService = new DCAService();

export const createPlan = async (req: Request, res: Response) => {
    try {
        const { body } = createPlanSchema.parse(req);
        const { userId, amount, frequency, userWalletAddress, riskLevel, chain } = body;

        // Validate risk level
        if (riskLevel && !Object.values(RiskLevel).includes(riskLevel)) {
            return res.status(400).json({ error: "Invalid risk level" });
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
            if (
                error.message?.includes("Plugin") ||
                error.message?.includes("not found")
            ) {
                return res
                    .status(400)
                    .json({ error: `Invalid chain: ${chain}` });
            }
            throw error;
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to create DCA plan:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to create DCA plan" });
    }
};

export const stopPlan = async (req: Request, res: Response) => {
    try {
        const { params } = stopPlanSchema.parse(req);
        const { planId } = params;

        const plan = await dcaService.stopPlan(planId);

        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }

        res.json(plan);
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to stop DCA plan:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to stop DCA plan" });
    }
};

export const getUserPlans = async (req: Request, res: Response) => {
    try {
        const { params } = getUserPlansSchema.parse(req);
        const { userId } = params;

        const plans = await dcaService.getUserPlans(userId);
        res.json(plans);
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to get user plans:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to get user plans" });
    }
};

export const getUserTotalInvestment = async (req: Request, res: Response) => {
    try {
        const { params } = getUserTotalInvestmentSchema.parse(req);
        const { userId } = params;

        const total = await dcaService.getUserTotalInvestment(userId);
        res.json({ totalInvestment: total });
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to get total investment:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to get total investment" });
    }
};

export const stopAllUserPlans = async (req: Request, res: Response) => {
    try {
        const { params } = stopAllPlansSchema.parse(req);
        const { userId } = params;

        const stoppedCount = await dcaService.stopAllUserPlans(userId);
        res.json({ message: `Successfully stopped ${stoppedCount} plans`, stoppedCount });
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Failed to stop all user plans:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to stop all user plans" });
    }
};
