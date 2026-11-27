import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RotateCcw, TrendingUp, Target, Lightbulb, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import mockTestService from '../../services/mockTestService';
import Spinner from '../../components/common/Spinner';

const gradeInfo = (pct) => {
  if (pct >= 80) return { label: 'Excellent', color: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (pct >= 65) return { label: 'Good', color: 'text-teal-600', bar: 'bg-teal-500' };
  if (pct >= 50) return { label: 'Fair', color: 'text-amber-600', bar: 'bg-amber-500' };
  return { label: 'Needs work', color: 'text-red-600', bar: 'bg-red-500' };
};

const markBadge = (awarded, max) => {
  const ratio = max ? awarded / max : 0;
  if (ratio >= 0.8) return 'bg-emerald-50 text-emerald-700';
  if (ratio >= 0.4) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
};

const formatDuration = (start, end) => {
  const mins = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
};

const Shell = ({ children }) => (
  <div className="min-h-screen relative bg-slate-50/50">
    
    <div className="relative max-w-4xl mx-auto p-6 md:p-10">
      <Link
        to="/mock-test"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Mock Test
      </Link>
      {children}
    </div>
  </div>
);

const MockTestResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regrading, setRegrading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mockTestService.getMockTest(id);
      if (data.status === 'in-progress') {
        navigate(`/mock-test/${id}/exam`, { replace: true });
        return;
      }
      setTest(data);
    } catch (error) {
      toast.error(error.error || error.message || 'Could not load the result.');
      navigate('/mock-test', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Grading is running on the server: check again every few seconds
  useEffect(() => {
    if (test?.status !== 'grading') return undefined;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [test?.status, load]);

  const handleRegrade = async () => {
    setRegrading(true);
    try {
      const data = await mockTestService.gradeMockTest(id);
      setTest(data);
      if (data.status !== 'graded') toast.error('Grading did not finish. Please try again.');
    } catch (error) {
      toast.error(error.error || error.message || 'Grading failed. Please try again.');
    } finally {
      setRegrading(false);
    }
  };

  if (loading || !test) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  // ----- not graded yet -----
  if (test.status === 'abandoned') {
    return (
      <Shell>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">You left this exam early</h2>
          <p className="text-sm text-slate-500">Left exams are not marked. Start a new test to get fresh questions.</p>
        </div>
      </Shell>
    );
  }

  if (test.status === 'grading') {
    return (
      <Shell>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-sm">
          <Loader2 className="w-10 h-10 mx-auto text-emerald-500 animate-spin mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Marking your answers...</h2>
          <p className="text-sm text-slate-500">This page updates by itself when your result is ready.</p>
        </div>
      </Shell>
    );
  }

  if (test.status === 'submitted') {
    return (
      <Shell>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Your answers are saved but not marked yet</h2>
          <p className="text-sm text-slate-500 mb-5">The AI could not finish marking. Your answers are safe, try again.</p>
          <button
            onClick={handleRegrade}
            disabled={regrading}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50"
          >
            {regrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {regrading ? 'Marking...' : 'Mark my exam'}
          </button>
        </div>
      </Shell>
    );
  }

  // ----- graded -----
  const { results } = test;
  const pct = test.totalMarks ? Math.round((test.score / test.totalMarks) * 100) : 0;
  const info = gradeInfo(pct);
  const resultById = Object.fromEntries((results?.parts || []).map((p) => [p.id, p]));

  return (
    <Shell>
      {/* Score */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{test.documentTitle}</h2>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">
              {test.score}<span className="text-2xl text-slate-400 font-semibold"> / {test.totalMarks}</span>
            </h1>
            <p className={`mt-1 text-lg font-semibold ${info.color}`}>{pct}% · {info.label}</p>
          </div>
          <div className="text-sm text-slate-500 text-right">
            {test.submittedAt && <p>Time taken: {formatDuration(test.startedAt, test.submittedAt)}</p>}
            {test.timedOut && <p className="text-amber-600 font-medium">Submitted automatically when time ran out</p>}
          </div>
        </div>
        <div className="mt-5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${info.bar}`} style={{ width: `${pct}%` }} />
        </div>
        {results?.summary && <p className="mt-5 text-sm leading-relaxed text-slate-700 font-medium">{results.summary}</p>}
      </div>

      {/* Strengths / weaknesses / tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
        {[
          { title: 'What went well', icon: TrendingUp, items: results?.strengths, tone: 'text-emerald-700 bg-emerald-50' },
          { title: 'Needs improvement', icon: Target, items: results?.weaknesses, tone: 'text-amber-700 bg-amber-50' },
          { title: 'Study tips', icon: Lightbulb, items: results?.studyTips, tone: 'text-blue-700 bg-blue-50' },
        ].map((box) => (
          <div key={box.title} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm h-full">
            <div className={`flex items-center gap-2 rounded-lg px-3 h-9 text-sm font-semibold mb-4 ${box.tone}`}>
              <box.icon className="w-4 h-4" /> {box.title}
            </div>
            {box.items?.length ? (
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700 font-medium">
                {box.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed text-slate-400 pl-4">Nothing to show.</p>
            )}
          </div>
        ))}
      </div>

      {/* Question by question */}
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Questions</h2>
      <div className="space-y-10">
        {test.questions.map((q) => {
          const qScore = q.parts.reduce((s, p) => s + (resultById[p.id]?.awarded || 0), 0);
          return (
            <div key={q.number} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white text-sm font-bold">
                    {q.number}
                  </span>
                  <h3 className="font-semibold text-slate-900">Question {q.number}</h3>
                </div>
                <span className="text-sm font-bold text-slate-900 bg-white border border-emerald-200 rounded-full px-3 py-1">
                  {qScore} / 10
                </span>
              </div>

              <div className="p-4 md:p-6 space-y-5">
                {q.context && (
                  <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap">{q.context}</p>
                )}

                {q.parts.map((part) => {
                  const r = resultById[part.id];
                  const answer = (test.answers?.[part.id] || '').trim();
                  return (
                    <div
                      key={part.id}
                      className={`space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5`}
                    >
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-200">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-slate-200 text-sm font-bold text-emerald-700 shrink-0">
                          {part.label}
                        </span>
                        <p className="flex-1 text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap pt-0.5">
                          {part.text}
                        </p>
                        <span className={`shrink-0 text-xs font-bold rounded-full px-3 py-1 ${markBadge(r?.awarded || 0, part.marks)}`}>
                          {r?.awarded ?? 0} / {part.marks}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Your answer</p>
                        {answer ? (
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No answer submitted</p>
                        )}
                      </div>

                      {r && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">What went wrong</p>
                            <p className="text-sm text-slate-800 leading-relaxed">{r.mistakes}</p>
                          </div>
                          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">How to improve</p>
                            <p className="text-sm text-slate-800 leading-relaxed">{r.improvement}</p>
                          </div>
                        </div>
                      )}

                      {part.modelAnswer && (
                        <details className="group rounded-xl border border-slate-200 bg-white">
                          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl">
                            Show model answer
                          </summary>
                          <p className="px-4 pb-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{part.modelAnswer}</p>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate('/mock-test')}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:opacity-90"
        >
          <RotateCcw className="w-4 h-4" /> Take another test (new questions)
        </button>
      </div>
    </Shell>
  );
};

export default MockTestResultPage;
