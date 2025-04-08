import express from 'express';
import user from './user/user.routes';
import services from './services/services.routes';
import admin from './admin/admin.routes';
import mocktrades from './mocktrading/mocktrades.routes';
import analytics from './user/analytics/analytics.routes';
import balance from './user/balance/balance.routes';

const router = express.Router();

// User routes
router.use('/user', user);

// Smart DCA notebook service routes
router.use('/services', services);

// Admin routes
router.use('/admin', admin);

// Mock Trading routes
router.use('/mocktrades', mocktrades);

// Analytics routes
router.use('/analytics', analytics);

// Balance routes
router.use('/balance', balance);

export default router;