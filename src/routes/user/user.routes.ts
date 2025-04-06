// src/routes/user.ts
import express from 'express';
import { createOrUpdateUser, getUserByAddress, getUserById } from './user.controller';

const router = express.Router();

// Create or update user
router.post('/', createOrUpdateUser);

// Get user by address
router.get('/:address', getUserByAddress);

// Get user by ID
router.get('/id/:id', getUserById);

export default router;