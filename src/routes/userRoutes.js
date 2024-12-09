import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.post('/change-password', changePassword);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router; 