import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import SortableList from '../ui/SortableList';
import ConfirmDialog from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';

export default function ChapterSidebar({
  book,
  activeId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onGenerate,
  onClose,
  busy = false,
  generatingId = null,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const chapters = book?.chapters || [];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(pendingDelete._id);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-primary-600"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
              aria-label="Close chapter list"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{book?.title || 'Untitled'}</h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {chapters.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-400">
            No chapters yet. Add your first one below.
          </p>
        ) : (
          <SortableList
            items={chapters.map((chapter) => ({ ...chapter, id: chapter._id }))}
            onReorder={(items) => onReorder(items)}
            itemClassName="mb-1"
            renderItem={(chapter) => {
              const index = chapters.findIndex((item) => item._id === chapter._id);
              const isActive = chapter._id === activeId;
              return (
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded-lg border pl-7 pr-1.5 transition',
                    isActive
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(chapter._id)}
                    className="min-w-0 flex-1 py-2 text-left"
                  >
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-bold',
                          isActive ? 'text-primary-500' : 'text-slate-400'
                        )}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'truncate text-[13px]',
                          isActive ? 'font-semibold text-primary-800' : 'font-medium text-slate-700'
                        )}
                      >
                        {chapter.title}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGenerate(chapter._id)}
                    disabled={busy || Boolean(generatingId)}
                    className={cn(
                      'rounded p-1 text-slate-300 transition focus:opacity-100 disabled:cursor-not-allowed',
                      generatingId === chapter._id
                        ? 'opacity-100 text-primary-600'
                        : isActive
                          ? 'opacity-100 hover:bg-primary-50 hover:text-primary-600'
                          : 'opacity-0 hover:bg-primary-50 hover:text-primary-600 group-hover:opacity-100'
                    )}
                    title="Generate this chapter with AI"
                    aria-label={`Generate ${chapter.title} with AI`}
                  >
                    {generatingId === chapter._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(chapter)}
                    disabled={busy || Boolean(generatingId)}
                    className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
                    title="Delete chapter"
                    aria-label={`Delete ${chapter.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            }}
          />
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-600 disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} New Chapter
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete chapter"
        message={`Delete “${pendingDelete?.title || ''}” and its content? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
