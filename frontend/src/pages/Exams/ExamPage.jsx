import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, CalendarDays, Clock, MapPin, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import examService from '../../services/examService';
import Spinner from '../../components/common/Spinner';

const EXAM_TYPES = ['Quiz', 'Midterm', 'Final', 'Assignment', 'Other'];

const emptyForm = {
  courseName: '',
  examType: 'Midterm',
  examDate: '', // YYYY-MM-DD
  examTime: '', // HH:mm (24h)
  totalMarks: '',
  venue: '',
  notes: '',
};

// ISO date -> "YYYY-MM-DDTHH:mm" in the user's local time (for datetime-local input)
const toInputValue = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getCountdown = (iso) => {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Finished';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `In ${days} day${days > 1 ? 's' : ''} ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `In ${hours}h ${mins}m` : `In ${mins}m`;
};

const pad2 = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateInDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

const DATE_SHORTCUTS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
];
const TIME_SHORTCUTS = [
  { label: '9:00 AM', value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '2:00 PM', value: '14:00' },
];

const isSoon = (iso) => {
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < 86400000;
};

const ExamPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [examToDelete, setExamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = async () => {
    try {
      const data = await examService.getExams();
      setExams(data);
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingId(exam._id);
    setForm({
      courseName: exam.courseName,
      examType: exam.examType,
      examDate: toInputValue(exam.examDate).split('T')[0],
      examTime: toInputValue(exam.examDate).split('T')[1],
      totalMarks: exam.totalMarks,
      venue: exam.venue || '',
      notes: exam.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseName.trim() || !form.examDate || !form.examTime || form.totalMarks === '') {
      toast.error('Course, date & time and marks are required.');
      return;
    }

    const payload = {
      courseName: form.courseName.trim(),
      examType: form.examType,
      // convert local time -> absolute ISO time so the time never shifts
      examDate: new Date(`${form.examDate}T${form.examTime}`).toISOString(),
      totalMarks: Number(form.totalMarks),
      venue: form.venue.trim(),
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await examService.updateExam(editingId, payload);
        toast.success('Exam updated!');
      } else {
        await examService.createExam(payload);
        toast.success('Exam saved!');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to save exam.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      await examService.deleteExam(examToDelete._id);
      toast.success('Exam deleted.');
      setExamToDelete(null);
      fetchExams();
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to delete exam.');
    } finally {
      setDeleting(false);
    }
  };

  const now = Date.now();
  const upcoming = exams.filter((e) => new Date(e.examDate).getTime() >= now);
  const past = exams.filter((e) => new Date(e.examDate).getTime() < now).reverse();

  const renderCard = (exam, isPast) => {
    const d = new Date(exam.examDate);
    const soon = !isPast && isSoon(exam.examDate);
    const icon = isPast ? 'text-slate-300' : 'text-slate-500';
    return (
      <div
        key={exam._id}
        className={`group relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:shadow-md ${
          isPast
            ? 'bg-slate-50/70 border-slate-200/70'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${
                isPast
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
              }`}
            >
              {exam.examType}
            </span>
            <h3 className={`text-lg font-semibold truncate ${isPast ? 'text-slate-400' : 'text-slate-900'}`}>
              {exam.courseName}
            </h3>
          </div>
          <div className={`flex gap-1 shrink-0 ${isPast ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
            <button
              onClick={() => openEditModal(exam)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExamToDelete(exam)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`mt-4 space-y-2 text-[15px] ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>
          <p className="flex items-center gap-2.5 font-medium">
            <CalendarDays className={`w-4 h-4 ${icon}`} />
            {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 ${icon}`} />
            {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="flex items-center gap-2.5">
            <Award className={`w-4 h-4 ${icon}`} />
            {exam.totalMarks} marks
          </p>
          {exam.venue && (
            <p className="flex items-center gap-2.5">
              <MapPin className={`w-4 h-4 ${icon}`} />
              {exam.venue}
            </p>
          )}
          {exam.notes && (
            <p className={`text-[13px] leading-relaxed pt-1 whitespace-pre-wrap ${isPast ? 'text-slate-400' : 'text-slate-600'}`}>
              {exam.notes}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/70">
          <span
            className={`inline-block text-sm font-semibold px-3 py-0.5 rounded-full ${
              isPast
                ? 'bg-slate-100 text-slate-400'
                : soon
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {getCountdown(exam.examDate)}
          </span>
        </div>

        {/* Hover glow (same as My Notes) */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:to-cyan-500/5 pointer-events-none transition-all duration-300 border-2 border-transparent group-hover:border-emerald-500/20" />
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen relative bg-slate-50/50">

      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Upcoming Exams</h1>
            <p className="text-slate-600 text-base">Save your exam schedule and never miss one</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-2xl">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-medium text-slate-900 mb-1">No exams saved yet</h4>
            <p className="text-sm text-slate-500">Click "Add Exam" to save your first one.</p>
          </div>
        ) : (
          <>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
              Upcoming
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{upcoming.length}</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500 mb-8">No upcoming exams.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {upcoming.map((e) => renderCard(e, false))}
              </div>
            )}

            {past.length > 0 && (
              <>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                  Past
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">{past.length}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {past.map((e) => renderCard(e, true))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Edit Exam' : 'Add Exam'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Course name *</label>
                <input
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  placeholder="e.g. Algorithms & Data Structures"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Exam type</label>
                  <select
                    name="examType"
                    value={form.examType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total marks *</label>
                  <input
                    type="number"
                    min="0"
                    name="totalMarks"
                    value={form.totalMarks}
                    onChange={handleChange}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-2">Date & time *</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                      <input
                        type="date"
                        name="examDate"
                        value={form.examDate}
                        onChange={handleChange}
                        onClick={(e) => e.target.showPicker?.()}
                        className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                      <input
                        type="time"
                        name="examTime"
                        value={form.examTime}
                        onChange={handleChange}
                        onClick={(e) => e.target.showPicker?.()}
                        className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DATE_SHORTCUTS.map((o) => {
                      const val = dateInDays(o.days);
                      const active = form.examDate === val;
                      return (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, examDate: val }))}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                    <span className="w-px bg-slate-200 mx-1" />
                    {TIME_SHORTCUTS.map((o) => {
                      const active = form.examTime === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, examTime: o.value }))}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Venue (optional)</label>
                <input
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Room 304"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Chapters, syllabus, reminders..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save Exam'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete exam?</h3>
            <p className="text-sm text-slate-600 mb-6">
              "{examToDelete.courseName}" will be removed permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExamToDelete(null)}
                className="flex-1 h-11 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
