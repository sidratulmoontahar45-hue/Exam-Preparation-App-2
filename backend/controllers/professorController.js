import Professor from '../models/Professor.js';

const pickFields = (body) => {
  const { name, email, courseName, batch, section, department } = body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (courseName !== undefined) data.courseName = courseName;
  if (batch !== undefined) data.batch = batch;
  if (section !== undefined) data.section = section;
  if (department !== undefined) data.department = department;
  return data;
};

// @desc    Add a professor
// @route   POST /api/professors
// @access  Private
export const createProfessor = async (req, res, next) => {
  try {
    const professor = await Professor.create({ ...pickFields(req.body), userId: req.user._id });
    res.status(201).json({ success: true, data: professor, message: 'Professor saved successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all professors of the logged in user
// @route   GET /api/professors
// @access  Private
export const getProfessors = async (req, res, next) => {
  try {
    const professors = await Professor.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, count: professors.length, data: professors });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a professor
// @route   PUT /api/professors/:id
// @access  Private
export const updateProfessor = async (req, res, next) => {
  try {
    const professor = await Professor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      pickFields(req.body),
      { new: true, runValidators: true }
    );

    if (!professor) {
      return res.status(404).json({ success: false, error: 'Professor not found', statusCode: 404 });
    }

    res.status(200).json({ success: true, data: professor, message: 'Professor updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a professor
// @route   DELETE /api/professors/:id
// @access  Private
export const deleteProfessor = async (req, res, next) => {
  try {
    const professor = await Professor.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!professor) {
      return res.status(404).json({ success: false, error: 'Professor not found', statusCode: 404 });
    }

    res.status(200).json({ success: true, message: 'Professor deleted successfully' });
  } catch (error) {
    next(error);
  }
};
