import express from 'express';
import { auth } from '../middleware/auth.js';
import { createCrossword, getCrossword } from '../controllers/crosswordController.js';

const router = express.Router();

// Route tạo ô chữ mới - cần xác thực
router.post('/create', auth, createCrossword);

// Route lấy thông tin ô chữ
router.get('/:id', getCrossword);

export default router;
