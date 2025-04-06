import express from 'express';
import user from './user/user.routes';
import services from './services/services.routes';

const router = express.Router();

// User routes
router.use('/user', user);

// Smart DCA notebook service routes
router.use('/services', services);

export default router;