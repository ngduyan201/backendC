import express from 'express';
import { crosswordController } from '../controllers/crosswordController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Middleware log
router.use((req, res, next) => {
  console.log('Crossword Route:', {
    method: req.method,
    path: req.path,
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// Routes
router.post('/', auth, crosswordController.create);
// router.get('/', auth, crosswordController.getAll);
// router.get('/:id', auth, crosswordController.getById);
// router.put('/:id', auth, crosswordController.update);
// router.delete('/:id', auth, crosswordController.delete);

export default router;
