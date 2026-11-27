import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error('Failed to fetch quiz.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // ADDED THIS MISSING FUNCTION
  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      // Format answers for the backend array structure
      const formattedAnswers = quiz.questions.map((q, index) => {
        const selectedIndex = selectedAnswers[q._id];
        return {
          questionIndex: index,
          selectedAnswer: selectedIndex !== undefined ? q.options[selectedIndex] : null
        };
      });

      await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      navigate(`/quizzes/${quizId}/results`); // Redirect to results
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz not found or has no questions.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-0">
      <PageHeader title={quiz.title || 'Take Quiz'} />

      <div className="mb-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-800">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-slate-500">
            {answeredCount} answered
          </span>
        </div>
        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full mb-8">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium text-emerald-700">
            Question {currentQuestionIndex + 1}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-8 leading-snug">
          {currentQuestion.question}
        </h3>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            
            return (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />
                
                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-emerald-500' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  )}
                </div>

                <span
                  className={`ml-4 text-base font-medium transition-colors ${
                    isSelected ? 'text-slate-900' : 'text-slate-700'
                  }`}
                >
                  {option}
                </span>

                {isSelected && (
                  <CheckCircle2
                    className="ml-auto w-6 h-6 text-emerald-600"
                    strokeWidth={2}
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-10">
        <Button
          variant="secondary"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <Button
            onClick={handleSubmitQuiz}
            disabled={submitting || answeredCount < quiz.questions.length}
            className="flex items-center gap-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            className="flex items-center gap-2 px-6"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizTakePage;