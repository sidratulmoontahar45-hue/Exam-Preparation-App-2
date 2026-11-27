import Document from '../models/Document.js';
import Quiz from '../models/Quiz.js';
import MockTest from '../models/MockTest.js';

// @desc    Get user learning statistics
// @route   GET /api/progress/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalDocuments = await Document.countDocuments({ userId });
    const totalQuizzes = await Quiz.countDocuments({ userId });
    const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

    // Mock tests that were actually taken (not abandoned / still running)
    const takenStatuses = ['submitted', 'grading', 'graded'];
    const totalMockTest = await MockTest.countDocuments({ userId, status: { $in: takenStatuses } });

    // Get quiz statistics
    const quizzes = await Quiz.find({ userId, completedAt: { $ne: null } });
    const averageScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
      : 0;

    // Recent activity
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('title fileName lastAccessed status');

    const recentQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('documentId', 'title')
      .select('title score totalQuestions completedAt');

    const recentMockTests = await MockTest.find({ userId, status: { $in: takenStatuses } })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(5)
      .select('title documentTitle status score totalMarks submittedAt createdAt');

    // Study streak (simplified - in production, track daily activity)
    const studyStreak = Math.floor(Math.random() * 7) + 1; // Mock data

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalNotes: totalDocuments,
          totalMockTest,
          totalQuiz: totalQuizzes,
          totalDocuments,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak
        },
        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
          mockTests: recentMockTests
        }
      }
    });
  } catch (error) {
    next(error);
  }
};