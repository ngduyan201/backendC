import express from 'express';
import { getProfile, updateProfile, changePassword, getTopCrosswordCreators } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);
router.get('/leaderboard/crosswords', auth, getTopCrosswordCreators);

export default router; 