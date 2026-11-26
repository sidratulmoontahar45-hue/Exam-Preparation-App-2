import Exam from '../models/Exam.js';

const pickFields = (body) => {
  const { courseName, examType, examDate, totalMarks, venue, notes } = body;
  const data = {};
  if (courseName !== undefined) data.courseName = courseName;
  if (examType !== undefined) data.examType = examType;
  if (examDate !== undefined) data.examDate = examDate;
  if (totalMarks !== undefined) data.totalMarks = totalMarks;
  if (venue !== undefined) data.venue = venue;
  if (notes !== undefined) data.notes = notes;
  return data;
};

// @desc    Create an exam
// @route   POST /api/exams
// @access  Private
export const createExam = async (req, res, next) => {
  try {
    const data = pickFields(req.body);

    if (data.examDate && isNaN(new Date(data.examDate).getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid exam date', statusCode: 400 });
    }

    const exam = await Exam.create({ ...data, userId: req.user._id });

    res.status(201).json({ success: true, data: exam, message: 'Exam saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all exams of the logged in user (soonest first)
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ userId: req.user._id }).sort({ examDate: 1 });
    res.status(200).json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private
export const updateExam = async (req, res, next) => {
  try {
    const data = pickFields(req.body);

    if (data.examDate && isNaN(new Date(data.examDate).getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid exam date', statusCode: 400 });
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found', statusCode: 404 });
    }

    res.status(200).json({ success: true, data: exam, message: 'Exam updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private
export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found', statusCode: 404 });
    }

    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
};
