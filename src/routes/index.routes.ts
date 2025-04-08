import express from 'express';
import user from './user/user.routes';
import services from './services/services.routes';
import admin from './admin/admin.routes';
import mocktrades from './user/mocktrades/mocktrades.routes';

const router = express.Router();

// User routes
router.use('/user', user);

// Smart DCA notebook service routes
router.use('/services', services);

// Admin routes
router.use('/admin', admin);

// Mock Trading routes
router.use('/mocktrades', mocktrades);

export default router;