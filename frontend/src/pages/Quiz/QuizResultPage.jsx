import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import quizService from '../../services/quizService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await quizService.getQuizResults(quizId);
        setResultData(response.data);
      } catch (error) {
        toast.error('Failed to fetch quiz results.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!resultData || !resultData.quiz) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-slate-800">Results not found.</h2>
        <Link to="/documents" className="text-emerald-600 mt-4 inline-block hover:underline">
          Back to Documents
        </Link>
      </div>
    );
  }

  const { quiz, results } = resultData;

  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        
        {/* Header Link */}
        <Link 
          to="/documents" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Documents
        </Link>

        {/* Score Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
          <p className="text-slate-500 mb-8">Quiz Results</p>

          <div className="flex flex-col items-center justify-center mb-8">
            <div className={`text-6xl font-extrabold mb-2 ${getScoreColor(quiz.score)}`}>
              {quiz.score}%
            </div>
            <p className="text-lg font-medium text-slate-600">
              You got <span className="font-bold text-slate-900">{Math.round((quiz.score / 100) * quiz.totalQuestions)}</span> out of <span className="font-bold text-slate-900">{quiz.totalQuestions}</span> questions correct!
            </p>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Breakdown</h2>
          
          {results.map((result, index) => (
            <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {result.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {index + 1}. {result.question}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className={`p-3 rounded-lg border ${result.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <span className="font-medium text-slate-700 mr-2">Your Answer:</span>
                      <span className={result.isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                        {result.selectedAnswer || 'Not answered'}
                      </span>
                    </div>

                    {!result.isCorrect && (
                      <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                        <span className="font-medium text-slate-700 mr-2">Correct Answer:</span>
                        <span className="text-emerald-700">{result.correctAnswer}</span>
                      </div>
                    )}

                    {result.explanation && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                        <span className="font-semibold text-slate-800 block mb-1">Explanation:</span>
                        {result.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default QuizResultPage;