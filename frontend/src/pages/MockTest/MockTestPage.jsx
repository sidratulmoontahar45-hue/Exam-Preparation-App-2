import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, ListChecks, ShieldAlert, Sparkles, PlayCircle, ChevronRight, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import mockTestService from '../../services/mockTestService';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';

const statusStyle = {
  graded: { label: 'Score', cls: 'bg-emerald-50 text-emerald-700' },
  grading: { label: 'Grading', cls: 'bg-blue-50 text-blue-700' },
  submitted: { label: 'Awaiting grade', cls: 'bg-amber-50 text-amber-700' },
  abandoned: { label: 'Left early', cls: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: 'In progress', cls: 'bg-blue-50 text-blue-700' },
};

const formatTimeLeft = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const MockTestPage = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedDocId, setSelectedDocId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [docs, history, active] = await Promise.all([
          documentService.getDocuments(),
          mockTestService.getMockTests(),
          mockTestService.getActiveTest(),
        ]);
        setDocuments(docs || []);
        setTests(history || []);
        setActiveTest(active);
      } catch (error) {
        toast.error(error.error || error.message || 'Failed to load mock test page.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStart = async () => {
    setConfirmOpen(false);
    setStarting(true);
    try {
      const test = await mockTestService.startMockTest(selectedDocId);
      navigate(`/mock-test/${test._id}/exam`);
    } catch (error) {
      if (error.activeTestId) {
        toast.error('You already have an exam in progress.');
        navigate(`/mock-test/${error.activeTestId}/exam`);
      } else {
        toast.error(error.error || error.message || 'Could not create the exam.');
        setStarting(false);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  const timeLeft = activeTest ? new Date(activeTest.expiresAt).getTime() - activeTest.serverNow : 0;
  const selectedDoc = documents.find((d) => d._id === selectedDocId);

  return (
    <div className="min-h-screen relative bg-slate-50/50">
      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Mock Test</h1>
          <p className="text-slate-500 text-base">Sit a real timed exam made from your own notes</p>
        </div>

        {/* Resume banner */}
        {activeTest && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
              </span>
              <div>
                <p className="font-semibold text-blue-900">You have an exam in progress</p>
                <p className="text-sm text-blue-800 mt-0.5">
                  {activeTest.title} · about {formatTimeLeft(timeLeft)} left
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/mock-test/${activeTest._id}/exam`)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              <PlayCircle className="w-4 h-4" /> Resume Exam
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: choose a note */}
          <div className="lg:col-span-3 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">1. Choose a note</h2>
                <p className="text-sm text-slate-500">We will make the exam questions from this note.</p>
              </div>
              {documents.length > 0 && (
                <span className="shrink-0 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                  {documents.length} {documents.length === 1 ? 'note' : 'notes'}
                </span>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-slate-300">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-600 font-medium">No notes yet</p>
                <button
                  onClick={() => navigate('/documents')}
                  className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Upload a note first
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {documents.map((doc) => {
                  const selected = doc._id === selectedDocId;
                  return (
                    <button
                      key={doc._id}
                      onClick={() => setSelectedDocId(doc._id)}
                      aria-pressed={selected}
                      className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition ${
                          selected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{doc.title}</span>
                      <span
                        className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition ${
                          selected ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-auto pt-6">
              {activeTest && (
                <p className="text-xs text-slate-500 mb-2 text-center">Finish or resume your current exam first.</p>
              )}
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!selectedDocId || !!activeTest || starting}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:opacity-90 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> Start Exam
              </button>
            </div>
          </div>

          {/* Right: exam rules */}
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Exam details</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4">
                <ListChecks className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-xl font-bold text-slate-900">40 marks</p>
              </div>
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-4">
                <Clock className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-xl font-bold text-slate-900">2 hours</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-700 font-medium">
              {[
                'You type every answer yourself.',
                'AI marks your answers and explains your mistakes.',
                'The exam submits itself when time runs out.',
                'Every new test has brand new questions.',
              ].map((text) => (
                <li key={text} className="flex gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-5">
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">
                  You cannot leave once the exam starts. Leaving ends the exam with no score.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-8 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your previous tests</h2>
          {tests.length === 0 ? (
            <p className="text-sm text-slate-500">You have not taken a mock test yet.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {tests.map((t) => {
                const st = statusStyle[t.status] || statusStyle.submitted;
                const clickable = t.status !== 'abandoned';
                const target = t.status === 'in-progress' ? `/mock-test/${t._id}/exam` : `/mock-test/${t._id}/result`;
                const graded = t.status === 'graded';
                const pct = graded && t.totalMarks ? Math.round((t.score / t.totalMarks) * 100) : null;
                const scoreColor =
                  pct === null ? 'text-slate-300' : pct >= 65 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                return (
                  <button
                    key={t._id}
                    disabled={!clickable}
                    onClick={() => navigate(target)}
                    className={`w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_8rem_5rem_1.25rem] items-center gap-x-4 px-4 py-3 text-left bg-white transition ${
                      clickable ? 'hover:bg-emerald-50/60' : 'cursor-default'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.documentTitle || t.title}</p>
                      <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="hidden sm:flex justify-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className={`text-sm font-bold ${scoreColor}`}>{pct !== null ? `${pct}%` : '—'}</p>
                    </div>

                    <ChevronRight className={`hidden sm:block w-4 h-4 ${clickable ? 'text-slate-400' : 'text-transparent'}`} />

                    {/* phone layout: status and score stacked on the right */}
                    <div className="sm:hidden text-right">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      {pct !== null && <p className={`text-sm font-bold mt-1 ${scoreColor}`}>{pct}%</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm start */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to start?</h3>
            <p className="text-sm text-slate-600 mb-1">
              Note: <span className="font-semibold text-slate-900">{selectedDoc?.title}</span>
            </p>
            <p className="text-sm text-slate-600 mb-5">
              The 2 hour timer starts immediately and cannot be paused. If you leave, the exam ends and you get no score.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Not yet
              </button>
              <button
                onClick={handleStart}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 transition"
              >
                Start now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generating overlay */}
      {starting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4">
          <div className="text-center">
            <Loader2 className="w-10 h-10 mx-auto text-emerald-500 animate-spin mb-4" />
            <p className="text-lg font-semibold text-slate-900">Preparing your exam...</p>
            <p className="text-sm text-slate-500 mt-1">The AI is writing new questions. This can take up to a minute.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestPage;
