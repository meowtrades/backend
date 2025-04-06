import express from "express";
import {
    createPlan,
    stopPlan,
    getUserPlans,
    getUserTotalInvestment,
    stopAllUserPlans,
} from "./s-dca.controller";

const router = express.Router();

// Create a new DCA plan
router.post("/create-plan", createPlan);

// Stop a DCA plan
router.post("/stop-plan/:planId", stopPlan);

// Stop all plans for a user
router.post("/stop-all-plans/:userId", stopAllUserPlans);

// Get user's plans
router.get("/plans/:userId", getUserPlans);

// Get user's total investment
router.get("/total-investment/:userId", getUserTotalInvestment);

export default router;
