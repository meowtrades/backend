import express from "express";
import {
    createPlan,
    stopPlan,
    getUserPlans,
    getUserTotalInvestment,
} from "./sdca.controller";

const router = express.Router();

// Create a new DCA plan
router.post("/create-plan", createPlan);

// Stop a DCA plan
router.post("/stop-plan/:planId", stopPlan);

// Get user's plans
router.get("/plans/:userId", getUserPlans);

// Get user's total investment
router.get("/total-investment/:userId", getUserTotalInvestment);

export default router;
