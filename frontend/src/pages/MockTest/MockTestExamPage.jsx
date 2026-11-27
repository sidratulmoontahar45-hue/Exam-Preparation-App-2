import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, LogOut, Send, ChevronLeft, ChevronRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import mockTestService from '../../services/mockTestService';
import Spinner from '../../components/common/Spinner';

const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const MockTestExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [saveState, setSaveState] = useState('saved'); // saved | saving | unsaved | error

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const offsetRef = useRef(0); // serverTime - browserTime, so the timer cannot be cheated by changing the PC clock
  const answersRef = useRef({});
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const submittedRef = useRef(false);
  const warnedRef = useRef({ ten: false, five: false });
  const autoTriedRef = useRef(false); // the clock only auto-submits once; after a failure the student uses the button

  // ---------- load ----------
  useEffect(() => {
    const load = async () => {
      try {
        const data = await mockTestService.getMockTest(id);
        if (data.status !== 'in-progress') {
          navigate(data.status === 'abandoned' ? '/mock-test' : `/mock-test/${id}/result`, { replace: true });
          return;
        }
        offsetRef.current = data.serverNow - Date.now();
        answersRef.current = data.answers || {};
        setAnswers(data.answers || {});
        setTest(data);
        setRemaining(new Date(data.expiresAt).getTime() - data.serverNow);
      } catch (error) {
        toast.error(error.error || error.message || 'Could not load the exam.');
        navigate('/mock-test', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  // ---------- submit ----------
  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitError('');
    setSubmitting(true);
    try {
      await mockTestService.submitMockTest(id, answersRef.current);
      navigate(`/mock-test/${id}/result`, { replace: true });
    } catch (error) {
      submittedRef.current = false;
      setSubmitting(false);
      setSubmitError(error.error || error.message || 'Could not submit. Check your internet and try again.');
      setSubmitOpen(true);
    }
  }, [id, navigate]);

  // ---------- timer ----------
  useEffect(() => {
    if (!test) return undefined;
    const expiresAt = new Date(test.expiresAt).getTime();

    const tick = () => {
      const ms = expiresAt - (Date.now() + offsetRef.current);
      setRemaining(ms);

      if (ms <= 10 * 60 * 1000 && !warnedRef.current.ten) {
        warnedRef.current.ten = true;
        toast('10 minutes left', { icon: '⏰' });
      }
      if (ms <= 5 * 60 * 1000 && !warnedRef.current.five) {
        warnedRef.current.five = true;
        toast.error('Only 5 minutes left!');
      }
      if (ms <= 0 && !submittedRef.current && !autoTriedRef.current) {
        autoTriedRef.current = true;
        toast('Time is up. Submitting your exam...', { icon: '⌛' });
        doSubmit();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [test, doSubmit]);

  // ---------- autosave ----------
  const saveNow = useCallback(async () => {
    if (savingRef.current || !dirtyRef.current || submittedRef.current) return;
    savingRef.current = true;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      await mockTestService.saveAnswers(id, answersRef.current);
      setSaveState(dirtyRef.current ? 'unsaved' : 'saved');
    } catch (error) {
      dirtyRef.current = true;
      if (error.statusCode === 409) {
        submittedRef.current = true;
        toast.error('This exam has already ended.');
        navigate(`/mock-test/${id}/result`, { replace: true });
      } else {
        setSaveState('error');
      }
    } finally {
      savingRef.current = false;
    }
  }, [id, navigate]);

  useEffect(() => {
    const debounce = setTimeout(saveNow, 1500);
    return () => clearTimeout(debounce);
  }, [answers, saveNow]);

  useEffect(() => {
    const retry = setInterval(saveNow, 10000);
    return () => clearInterval(retry);
  }, [saveNow]);

  const handleChange = (partId, value) => {
    const next = { ...answersRef.current, [partId]: value };
    answersRef.current = next;
    dirtyRef.current = true;
    setSaveState('unsaved');
    setAnswers(next);
  };

  // ---------- stop the student from leaving by accident ----------
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    // Browser back button opens the leave warning instead of leaving
    window.history.pushState({ exam: true }, '', window.location.href);
    const onPop = () => {
      if (submittedRef.current) return;
      window.history.pushState({ exam: true }, '', window.location.href);
      setLeaveOpen(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleLeave = async () => {
    setLeaving(true);
    submittedRef.current = true; // stops autosave and the timer's auto-submit
    try {
      await mockTestService.abandonMockTest(id);
      toast('Exam ended. You can start a new one with new questions.');
      navigate('/mock-test', { replace: true });
    } catch (error) {
      submittedRef.current = false;
      setLeaving(false);
      toast.error(error.error || error.message || 'Could not end the exam. Try again.');
    }
  };

  // ---------- render ----------
  if (loading || !test) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const questions = test.questions;
  const question = questions[currentQ];
  const allParts = questions.flatMap((q) => q.parts);
  const isAnswered = (partId) => (answers[partId] || '').trim().length > 0;
  const answeredCount = allParts.filter((p) => isAnswered(p.id)).length;

  const timerTone =
    remaining <= 5 * 60 * 1000
      ? 'text-red-600 bg-red-50 border-red-200 animate-pulse'
      : remaining <= 30 * 60 * 1000
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-slate-900 bg-slate-50 border-slate-200';

  const saveLabel = {
    saved: 'All changes saved',
    saving: 'Saving...',
    unsaved: 'Unsaved changes',
    error: 'Could not save - retrying',
  }[saveState];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50">
      {/* Top bar: timer left, buttons right */}
      <header className="relative h-16 shrink-0 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${timerTone}`}>
          <Clock className="w-5 h-5" />
          <span className="font-mono text-xl font-bold tabular-nums">{formatClock(remaining)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeaveOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-3 md:px-4 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Leave</span>
          </button>
          <button
            onClick={() => { setSubmitError(''); setSubmitOpen(true); }}
            className="inline-flex items-center gap-2 h-10 px-3 md:px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30 hover:opacity-90 transition"
          >
            <Send className="w-4 h-4" /> <span className="hidden md:inline">Submit</span>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${allParts.length ? (answeredCount / allParts.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Question navigator */}
        <nav className="shrink-0 md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-3 md:p-5 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
          <p className="hidden md:block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Questions</p>
          {questions.map((q, i) => {
            const done = q.parts.filter((p) => isAnswered(p.id)).length;
            const active = i === currentQ;
            const complete = done === q.parts.length;
            return (
              <button
                key={q.number}
                onClick={() => setCurrentQ(i)}
                className={`shrink-0 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${
                    complete
                      ? 'bg-emerald-500 text-white'
                      : active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {complete ? <Check className="w-4 h-4" strokeWidth={3} /> : q.number}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">Question {q.number}</span>
                  <span className="block text-xs text-slate-500">{done}/{q.parts.length} answered · 10 marks</span>
                </span>
              </button>
            );
          })}
          <p className="hidden md:block mt-auto pt-4 text-xs text-slate-500">{saveLabel}</p>
        </nav>

        {/* Question + answer boxes */}
        <main className="flex-1 overflow-y-auto p-5 md:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Question {question.number}</h2>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1">
                10 marks
              </span>
            </div>

            {question.context && (
              <div className="mb-7 rounded-2xl bg-white border border-slate-200 p-5 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-sm">
                {question.context}
              </div>
            )}

            <div className="space-y-6">
              {question.parts.map((part) => {
                const text = answers[part.id] || '';
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                const answered = words > 0;
                return (
                  <div
                    key={part.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 mt-0.5 ${
                          answered ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {answered ? <Check className="w-4 h-4" strokeWidth={3} /> : part.label}
                      </span>
                      <p className="flex-1 text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {part.text}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1 mt-1">
                        {part.marks} {part.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => handleChange(part.id, e.target.value)}
                      rows={7}
                      placeholder="Type your answer here..."
                      data-gramm="false"
                      data-gramm_editor="false"
                      data-enable-grammarly="false"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 resize-y transition"
                    />
                    <p className="mt-2 text-xs text-slate-400 text-right">{words} {words === 1 ? 'word' : 'words'}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-8 pb-6">
              <button
                onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((q) => q + 1)}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => { setSubmitError(''); setSubmitOpen(true); }}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
                >
                  Review &amp; Submit <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Leave warning */}
      {leaveOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Leave the exam?</h3>
            <ul className="text-sm text-slate-600 space-y-1.5 mb-6 list-disc pl-5">
              <li>The exam ends <span className="font-semibold text-slate-900">immediately</span>.</li>
              <li>Your answers will <span className="font-semibold text-slate-900">not be marked</span> and you get no score.</li>
              <li>You cannot come back to this paper. A new exam will have <span className="font-semibold text-slate-900">new questions</span>.</li>
            </ul>
            <div className="flex gap-3">
              <button
                autoFocus
                onClick={() => setLeaveOpen(false)}
                disabled={leaving}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
              >
                Continue exam
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                {leaving ? 'Ending...' : 'Leave & end exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {submitOpen && !submitting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Submit your exam?</h3>
            <p className="text-sm text-slate-600 mb-4">
              You answered <span className="font-semibold text-slate-900">{answeredCount} of {allParts.length}</span> parts.
              {answeredCount < allParts.length && ' Unanswered parts will get 0 marks.'} You cannot change anything after submitting.
            </p>
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{submitError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSubmitOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Keep working
              </button>
              <button
                onClick={doSubmit}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
              >
                Submit exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/95 p-4">
          <div className="text-center">
            <Loader2 className="w-10 h-10 mx-auto text-emerald-500 animate-spin mb-4" />
            <p className="text-lg font-semibold text-slate-900">Marking your answers...</p>
            <p className="text-sm text-slate-500 mt-1">The AI is checking every answer. Please keep this page open.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestExamPage;
