import express from 'express';
import { crosswordController } from '../controllers/crosswordController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Middleware log
router.use((req, res, next) => {
  console.log('Crossword Route:', {
    method: req.method,
    path: req.path,
    body: req.method === 'POST' ? req.body : undefined,
    session: req.cookies.crosswordSession
  });
  next();
});

// Routes
router.post('/', auth, crosswordController.create);
router.get('/session', auth, crosswordController.getCurrentSession);
router.post('/save', auth, crosswordController.saveAndEndSession);

export default router;
