import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, BrainCircuit, Clock } from 'lucide-react';
import moment from 'moment';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/documents/${document._id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(document);
  };

  return (
    <div
      className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
      onClick={handleNavigate}
    >
      <div>
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Title & Info */}
        <h3 className="text-lg font-semibold text-slate-900 truncate mb-1" title={document.title}>
          {document.title}
        </h3>
        
        <div className="text-xs text-slate-500 font-medium mb-4">
          {document.fileSize !== undefined && (
            <span>{formatFileSize(document.fileSize)}</span>
          )}
        </div>

        {/* Stats Section (Only Quizzes now) */}
        <div className="flex items-center gap-3">
          {document.quizCount !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-lg">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
              <span className="text-xs font-semibold text-emerald-700">{document.quizCount} Quizzes</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Uploaded {moment(document.createdAt).fromNow()}</span>
        </div>
      </div>

      {/* Hover Indicator */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:to-cyan-500/5 pointer-events-none transition-all duration-300 border-2 border-transparent group-hover:border-emerald-500/20" />
    </div>
  );
};

export default DocumentCard;