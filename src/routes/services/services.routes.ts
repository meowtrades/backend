import express from 'express';
import sdca from './s-dca/s-dca.routes';
import { getSession } from '../../middleware/auth';

const router = express.Router();

// Smart DCA notebook service routes

router.use(getSession);
router.use('/s-dca', sdca);

export default router;
