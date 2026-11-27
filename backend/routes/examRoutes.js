import express from 'express';
import {
  createExam,
  getExams,
  updateExam,
  deleteExam,
} from '../controllers/examController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createExam);
router.get('/', getExams);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

export default router;
