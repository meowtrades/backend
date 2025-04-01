import express from 'express';
import dca from './services/dca.routes';
import user from './user/user.routes';

const router = express.Router();

// User routes
router.use('/user', user);

// Smart DCA notebook service routes
router.use('/dca', dca);

export default router;