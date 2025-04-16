// src/routes/user.ts
import express from 'express';
import {
  createOrUpdateUser,
  getUserByAddress,
  getUserById,
  getUserTransactionAttempts,
} from './user.controllers';
import analytics from './analytics/analytics.routes';
import balance from './balance/balance.routes';

import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../lib/auth'; //your better auth instance
import { getSession } from '../../middleware/auth';

const router = express.Router();

router.use(getSession);

// Create or update user
router.post('/', createOrUpdateUser);

// Get user by address
router.get('/address/:address', getUserByAddress);

// Get user transaction attempts
router.get('/transactions', getUserTransactionAttempts);

// Analytics routes
router.use('/analytics', analytics);

// Balance routes
router.use('/balance', balance);

router.get('/me', async (req, res) => {
  return res.json(req.user);
});

// router.get('/:userId', getUserById);

export default router;
