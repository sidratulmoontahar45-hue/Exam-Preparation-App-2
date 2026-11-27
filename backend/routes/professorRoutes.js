import express from 'express';
import {
  createProfessor,
  getProfessors,
  updateProfessor,
  deleteProfessor,
} from '../controllers/professorController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createProfessor);
router.get('/', getProfessors);
router.put('/:id', updateProfessor);
router.delete('/:id', deleteProfessor);

export default router;
