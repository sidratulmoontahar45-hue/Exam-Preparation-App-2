import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, Mail, Search, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import professorService from '../../services/professorService';
import Spinner from '../../components/common/Spinner';

const emptyForm = {
  name: '',
  email: '',
  courseName: '',
  batch: '',
  section: '',
  department: '',
};

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500';

const ProfessorPage = () => {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [professorToDelete, setProfessorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProfessors = async () => {
    try {
      const data = await professorService.getProfessors();
      setProfessors(data);
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to fetch professors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (prof) => {
    setEditingId(prof._id);
    setForm({
      name: prof.name,
      email: prof.email,
      courseName: prof.courseName,
      batch: prof.batch,
      section: prof.section,
      department: prof.department,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const values = Object.values(form).map((v) => v.trim());
    if (values.some((v) => !v)) {
      toast.error('Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      if (editingId) {
        await professorService.updateProfessor(editingId, payload);
        toast.success('Professor updated!');
      } else {
        await professorService.createProfessor(payload);
        toast.success('Professor saved!');
      }
      setIsModalOpen(false);
      fetchProfessors();
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to save professor.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!professorToDelete) return;
    setDeleting(true);
    try {
      await professorService.deleteProfessor(professorToDelete._id);
      toast.success('Professor deleted.');
      setProfessorToDelete(null);
      fetchProfessors();
    } catch (error) {
      toast.error(error.error || error.message || 'Failed to delete professor.');
    } finally {
      setDeleting(false);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = professors.filter((p) =>
    [p.name, p.courseName, p.department, p.batch, p.section, p.email].some((v) =>
      v.toLowerCase().includes(term)
    )
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen relative bg-slate-50/50">
      

      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Contact Professor</h1>
            <p className="text-slate-500 text-base">Save your professors' details and email them easily</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Add Professor
          </button>
        </div>

        {professors.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, course, department..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {professors.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-2xl">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-medium text-slate-900 mb-1">No professors saved yet</h4>
            <p className="text-sm text-slate-500">Click "Add Professor" to save your first one.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No professors match your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((prof) => (
              <div
                key={prof._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">{prof.name}</h3>
                    <p className="text-sm font-medium text-slate-700 truncate">{prof.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 -mr-1">
                    <button
                      onClick={() => openEditModal(prof)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProfessorToDelete(prof)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                  <p className="text-sm font-semibold text-emerald-700">{prof.courseName}</p>
                  <p className="text-sm font-medium text-slate-600">
                    <span className="text-blue-700 font-semibold">Batch {prof.batch}</span>
                    {' · '}
                    <span className="text-purple-700 font-semibold">Section {prof.section}</span>
                    {' · '}
                    <span className="text-amber-700 font-semibold">{prof.department}</span>
                  </p>
                </div>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prof.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition"
                >
                  <Mail className="w-4 h-4" /> Send Email
                </a>
              </div>
            ))}
          </div>
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
              <h3 className="text-xl font-semibold text-slate-900">
                {editingId ? 'Edit Professor' : 'Add Professor'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Professor name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Dr. Rahman" className={inputClass} />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="professor@university.edu" className={inputClass} />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Course name *</label>
                <input name="courseName" value={form.courseName} onChange={handleChange} placeholder="e.g. Algorithms" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Batch *</label>
                  <input name="batch" value={form.batch} onChange={handleChange} placeholder="e.g. 45" className={inputClass} />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Section *</label>
                  <input name="section" value={form.section} onChange={handleChange} placeholder="e.g. A" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Department *</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. CSE" className={inputClass} />
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
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {professorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete professor?</h3>
            <p className="text-sm text-slate-600 mb-6">
              "{professorToDelete.name}" will be removed permanently.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setProfessorToDelete(null)}
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

export default ProfessorPage;
