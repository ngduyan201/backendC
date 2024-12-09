import express from 'express';
import { login, register, logout, refreshToken } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);

export default router;