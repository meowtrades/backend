// src/routes/user.ts
import express from 'express';
import {
  createOrUpdateUser,
  getUserByAddress,
  getUserByEmail,
  getUserById,
  getUserTransactionAttempts,
} from './user.controllers';
import analytics from './analytics/analytics.routes';
import balance from './balance/balance.routes';
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

router.get('/:email', getUserByEmail);
// router.get('/:userId', getUserById);

export default router;
