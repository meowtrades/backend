import express from "express";
import {
    createPlan,
    stopPlan,
    getUserPlans,
    getUserTotalInvestment,
} from "./sdca.controller";

const router = express.Router();

// Create a new DCA plan
router.post("/plans", createPlan);

// Stop a DCA plan
router.post("/plans/:planId/stop", stopPlan);

// Get user's plans
router.get("/users/:userId/plans", getUserPlans);

// Get user's total investment
router.get("/users/:userId/total-investment", getUserTotalInvestment);

export default router;
