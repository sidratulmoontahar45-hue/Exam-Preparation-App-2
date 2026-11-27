import express from 'express';
import {
  startMockTest,
  getActiveTest,
  getMockTests,
  getMockTest,
  saveAnswers,
  submitMockTest,
  regradeMockTest,
  abandonMockTest,
} from '../controllers/mockTestController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getMockTests);
router.get('/active', getActiveTest);   // must stay above '/:id'
router.post('/start', startMockTest);
router.get('/:id', getMockTest);
router.put('/:id/answers', saveAnswers);
router.post('/:id/submit', submitMockTest);
router.post('/:id/grade', regradeMockTest);
router.post('/:id/abandon', abandonMockTest);

export default router;
