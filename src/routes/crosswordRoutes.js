import express from 'express';
import { crosswordController } from '../controllers/crosswordController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Log để debug
router.use((req, res, next) => {
    console.log('Crossword Route:', req.method, req.path);
    next();
});

// Routes
router.post('/', authMiddleware, crosswordController.create);
router.get('/', authMiddleware, crosswordController.getAll);
router.get('/:id', authMiddleware, crosswordController.getById);
router.put('/:id', authMiddleware, crosswordController.update);
router.delete('/:id', authMiddleware, crosswordController.delete);

export default router;
