import express from 'express';
import { crosswordController } from '../controllers/crosswordController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Log để debug
router.use((req, res, next) => {
    console.log('Crossword Route:', req.method, req.path);
    next();
});

// Routes
router.post('/', auth, crosswordController.create);
// router.get('/', auth, crosswordController.getAll);
// router.get('/:id', auth, crosswordController.getById);
// router.put('/:id', auth, crosswordController.update);
// router.delete('/:id', auth, crosswordController.delete);

export default router;
