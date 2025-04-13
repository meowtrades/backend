import express from 'express';
import user from './user/user.routes';
import services from './services/services.routes';
import admin from './admin/admin.routes';
import mocktrades from './mocktrading/mocktrades.routes';

const router = express.Router();

// Health check endpoint for Cloud Run
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// User routes
router.use('/user', user);

// Smart DCA notebook service routes
router.use('/services', services);

// Admin routes
router.use('/admin', admin);

// Mock Trading routes
router.use('/mocktrades', mocktrades);

export default router;
