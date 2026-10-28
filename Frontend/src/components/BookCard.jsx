import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Layers, Pencil, Trash2, Eye } from 'lucide-react';
import { formatDate, resolveCoverUrl } from '../lib/utils';

export default function BookCard({ book, onDelete, deleting }) {
  const cover = resolveCoverUrl(book.coverImage);

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-pop">
      <Link to={`/books/${book._id}`} className="relative block aspect-[3/4] overflow-hidden bg-slate-100">
        {cover ? (
          <img
            src={cover}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-600 via-primary-500 to-fuchsia-500 p-5 text-center text-white">
            <BookOpen size={26} className="opacity-90" />
            <span className="line-clamp-4 text-sm font-semibold leading-snug">{book.title}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
          {book.style || 'Informative'}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/books/${book._id}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-primary-600">
          {book.title}
        </Link>
        <p className="mt-1 truncate text-xs text-slate-500">
          by {book.author || 'Unknown author'}
          {book.subtitle ? ` · ${book.subtitle}` : ''}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Layers size={12} /> {book.chapterCount ?? book.chapters?.length ?? 0} chapters
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} /> {formatDate(book.updatedAt)}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          <Link to={`/books/${book._id}/read`} className="btn-ghost btn-sm flex-1" title="Read">
            <Eye size={14} /> Read
          </Link>
          <Link to={`/books/${book._id}/edit`} className="btn-secondary btn-sm flex-1" title="Edit">
            <Pencil size={14} /> Edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(book)}
            disabled={deleting}
            className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
            title="Delete eBook"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
