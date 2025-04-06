import express from 'express';
import sdca from './sdca/sdca.routes';

const router = express.Router();

// Smart DCA notebook service routes
router.use('/sdca', sdca);

export default router;