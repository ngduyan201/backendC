import express from 'express';
import { crosswordController } from '../controllers/crosswordController.js';
import { auth } from '../middleware/auth.js';
import { checkProfileComplete } from '../middleware/checkProfile.js';

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
router.post('/', auth, checkProfileComplete, crosswordController.create);
router.get('/session', auth, crosswordController.getCurrentSession);
router.post('/save', auth, crosswordController.saveAndEndSession);
router.post('/end-session', auth, crosswordController.endSession);
router.post('/save-crossword', auth, crosswordController.saveCrossword);
router.get('/user', auth, crosswordController.getUserCrosswords);
router.put('/:id', auth, crosswordController.updateCrossword);
router.post('/edit/:id', auth, crosswordController.startEditSession);
router.get('/library', auth, crosswordController.getLibraryCrosswords);
router.post('/play/:id', auth, checkProfileComplete, crosswordController.startPlay);
router.post('/clear-session', auth, crosswordController.clearPlaySession);
router.get('/get-secret-key', auth, crosswordController.GetSecretKey);
router.delete('/:id', auth, crosswordController.deleteCrossword);
router.get('/search', auth, crosswordController.search);
router.post('/check-title', auth, crosswordController.checkDuplicateTitle);
router.post('/complete', auth, crosswordController.markAsCompleted);

export default router;
