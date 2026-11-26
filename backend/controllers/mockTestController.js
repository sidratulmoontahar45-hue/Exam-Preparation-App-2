import MockTest from '../models/MockTest.js';
import Document from '../models/Document.js';
import { generateExamPaper, gradeExam } from '../utils/mockTestAI.js';

const DURATION_MINUTES = 120;
const GRACE_MS = 60 * 1000;               // time allowed for the final auto-submit after the clock hits 0
const GRADING_STALE_MS = 3 * 60 * 1000;   // a "grading" status older than this is treated as failed
const MIN_NOTE_CHARS = 300;

const fail = (res, statusCode, error, extra = {}) =>
  res.status(statusCode).json({ success: false, error, statusCode, ...extra });

// ---------- helpers ----------

// What the browser is allowed to see. Model answers and results stay hidden until graded.
const toClient = (test) => {
  const obj = test.toObject();
  const graded = obj.status === 'graded';

  obj.questions = obj.questions.map((q) => ({
    ...q,
    parts: q.parts.map((p) => {
      const { modelAnswer, ...rest } = p;
      return graded ? { ...rest, modelAnswer } : rest;
    }),
  }));
  if (!graded) delete obj.results;
  obj.serverNow = Date.now();
  return obj;
};

const sanitizeAnswers = (test, raw) => {
  const validIds = new Set(test.questions.flatMap((q) => q.parts.map((p) => p.id)));
  const clean = {};
  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (validIds.has(key) && typeof value === 'string') clean[key] = value.slice(0, 20000);
    }
  }
  return clean;
};

const pastGrace = (test) => Date.now() > new Date(test.expiresAt).getTime() + GRACE_MS;

const findOwned = async (req, res) => {
  const test = await MockTest.findOne({ _id: req.params.id, userId: req.user._id });
  if (!test) {
    fail(res, 404, 'Mock test not found');
    return null;
  }
  return test;
};

// submitted -> grading -> graded. If the AI fails the test goes back to "submitted" so it can be retried.
const gradeIfNeeded = async (test) => {
  if (test.status !== 'submitted') return test;

  const locked = await MockTest.findOneAndUpdate(
    { _id: test._id, status: 'submitted' },
    { $set: { status: 'grading', gradingStartedAt: new Date() } },
    { new: true }
  );
  if (!locked) return MockTest.findById(test._id); // someone else is already grading

  try {
    const answers = locked.answers || {};
    const items = locked.questions.flatMap((q) =>
      q.parts.map((p) => ({
        id: p.id,
        question: [q.context, `(${p.label}) ${p.text}`].filter(Boolean).join('\n'),
        marks: p.marks,
        modelAnswer: p.modelAnswer,
        answer: typeof answers[p.id] === 'string' ? answers[p.id] : '',
      }))
    );

    const graded = await gradeExam(items);
    const score = graded.parts.reduce((sum, p) => sum + p.awarded, 0);

    return await MockTest.findByIdAndUpdate(
      locked._id,
      {
        $set: {
          status: 'graded',
          gradedAt: new Date(),
          score,
          results: {
            parts: graded.parts,
            summary: graded.overall.summary,
            strengths: graded.overall.strengths,
            weaknesses: graded.overall.weaknesses,
            studyTips: graded.overall.studyTips,
          },
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error('Mock test grading failed:', error.message);
    return MockTest.findByIdAndUpdate(
      locked._id,
      { $set: { status: 'submitted' } },
      { new: true }
    );
  }
};

// in-progress -> submitted (atomic, so it only happens once) and then grade
const finalizeTest = async (test, { answers, timedOut = false } = {}) => {
  const set = {
    status: 'submitted',
    submittedAt: timedOut ? test.expiresAt : new Date(),
    timedOut,
  };
  if (answers) set.answers = { ...(test.answers || {}), ...answers };

  const updated = await MockTest.findOneAndUpdate(
    { _id: test._id, status: 'in-progress' },
    { $set: set },
    { new: true }
  );
  return gradeIfNeeded(updated || (await MockTest.findById(test._id)));
};

// Closes tests whose time ran out long ago (user closed the browser, etc.)
const refreshTest = async (test) => {
  if (test.status === 'in-progress' && pastGrace(test)) {
    return finalizeTest(test, { timedOut: true });
  }
  if (
    test.status === 'grading' &&
    test.gradingStartedAt &&
    Date.now() - new Date(test.gradingStartedAt).getTime() > GRADING_STALE_MS
  ) {
    return MockTest.findByIdAndUpdate(test._id, { $set: { status: 'submitted' } }, { new: true });
  }
  return test;
};

// ---------- controllers ----------

// @desc    Generate a new exam from a note and start the 2 hour timer
// @route   POST /api/mock-tests/start
// @access  Private
export const startMockTest = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return fail(res, 400, 'Please choose a note');

    const userId = req.user._id;

    // Only one exam at a time
    let active = await MockTest.findOne({ userId, status: 'in-progress' });
    if (active && pastGrace(active)) {
      await finalizeTest(active, { timedOut: true });
      active = null;
    }
    if (active) {
      return fail(res, 409, 'You already have an exam in progress', { activeTestId: active._id });
    }

    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) return fail(res, 404, 'Note not found');
    if (!doc.extractedText || doc.extractedText.trim().length < MIN_NOTE_CHARS) {
      return fail(res, 400, 'This note has too little readable text to create an exam');
    }

    // Make sure the new paper is different from the last ones for this note
    const previous = await MockTest.find({ userId, documentId }).sort({ createdAt: -1 }).limit(3).select('questions');
    const previousQuestions = previous.flatMap((t) =>
      t.questions.flatMap((q) => q.parts.map((p) => p.text.slice(0, 160)))
    );

    const paper = await generateExamPaper(doc.extractedText, {
      noteTitle: doc.title,
      previousQuestions,
    });

    // Another tab could have started an exam while the AI was working
    const raced = await MockTest.findOne({ userId, status: 'in-progress' });
    if (raced) {
      return fail(res, 409, 'You already have an exam in progress', { activeTestId: raced._id });
    }

    const startedAt = new Date();
    const test = await MockTest.create({
      userId,
      documentId: doc._id,
      documentTitle: doc.title,
      title: paper.title,
      totalMarks: 40,
      durationMinutes: DURATION_MINUTES,
      questions: paper.questions,
      answers: {},
      startedAt,
      expiresAt: new Date(startedAt.getTime() + DURATION_MINUTES * 60 * 1000),
    });

    res.status(201).json({ success: true, data: toClient(test) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the exam that is currently running (if any)
// @route   GET /api/mock-tests/active
// @access  Private
export const getActiveTest = async (req, res, next) => {
  try {
    let test = await MockTest.findOne({ userId: req.user._id, status: 'in-progress' }).sort({ createdAt: -1 });
    if (test && pastGrace(test)) {
      await finalizeTest(test, { timedOut: true });
      test = null;
    }
    res.status(200).json({ success: true, data: test ? toClient(test) : null });
  } catch (error) {
    next(error);
  }
};

// @desc    List past exams
// @route   GET /api/mock-tests
// @access  Private
export const getMockTests = async (req, res, next) => {
  try {
    const tests = await MockTest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('title documentTitle status score totalMarks createdAt submittedAt timedOut');
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

// @desc    Get one exam (questions while running, full results once graded)
// @route   GET /api/mock-tests/:id
// @access  Private
export const getMockTest = async (req, res, next) => {
  try {
    let test = await findOwned(req, res);
    if (!test) return;
    test = await refreshTest(test);
    res.status(200).json({ success: true, data: toClient(test) });
  } catch (error) {
    next(error);
  }
};

// @desc    Autosave answers while the exam is running
// @route   PUT /api/mock-tests/:id/answers
// @access  Private
export const saveAnswers = async (req, res, next) => {
  try {
    const test = await findOwned(req, res);
    if (!test) return;

    if (test.status !== 'in-progress' || pastGrace(test)) {
      return fail(res, 409, 'This exam has already ended', { status: test.status });
    }

    const clean = sanitizeAnswers(test, req.body.answers);
    test.answers = { ...(test.answers || {}), ...clean };
    test.markModified('answers');
    await test.save();

    res.status(200).json({ success: true, savedAt: Date.now() });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit the exam and get it graded by AI
// @route   POST /api/mock-tests/:id/submit
// @access  Private
export const submitMockTest = async (req, res, next) => {
  try {
    const test = await findOwned(req, res);
    if (!test) return;

    if (test.status === 'abandoned') return fail(res, 400, 'This exam was ended and cannot be submitted');
    if (test.status !== 'in-progress') {
      // Already submitted: just return the current state
      return res.status(200).json({ success: true, data: toClient(await refreshTest(test)) });
    }

    const now = Date.now();
    const expiry = new Date(test.expiresAt).getTime();
    const timedOut = now > expiry;
    // Late answers (after the grace period) are ignored, the last autosave is used instead
    const answers = now <= expiry + GRACE_MS ? sanitizeAnswers(test, req.body.answers) : undefined;

    const result = await finalizeTest(test, { answers, timedOut });
    res.status(200).json({ success: true, data: toClient(result) });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry grading of a submitted exam (when the AI failed the first time)
// @route   POST /api/mock-tests/:id/grade
// @access  Private
export const regradeMockTest = async (req, res, next) => {
  try {
    let test = await findOwned(req, res);
    if (!test) return;
    test = await refreshTest(test);
    test = await gradeIfNeeded(test);
    res.status(200).json({ success: true, data: toClient(test) });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave the exam: it ends immediately, no score, next exam has new questions
// @route   POST /api/mock-tests/:id/abandon
// @access  Private
export const abandonMockTest = async (req, res, next) => {
  try {
    const test = await findOwned(req, res);
    if (!test) return;

    const updated = await MockTest.findOneAndUpdate(
      { _id: test._id, status: 'in-progress' },
      { $set: { status: 'abandoned', abandonedAt: new Date() } },
      { new: true }
    );
    if (!updated) return fail(res, 409, 'This exam has already ended', { status: test.status });

    res.status(200).json({ success: true, message: 'Exam ended' });
  } catch (error) {
    next(error);
  }
};
