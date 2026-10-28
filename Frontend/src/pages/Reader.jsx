import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Pencil,
  Plus,
} from 'lucide-react';
import MarkdownPreview from '../components/MarkdownPreview';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';
import { ErrorState } from '../components/ui/States';
import * as booksService from '../services/books.service';
import { getErrorMessage } from '../lib/api';
import { cn, formatDate } from '../lib/utils';

const MIN_FONT = 14;
const MAX_FONT = 24;

export default function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [fontSize, setFontSize] = useState(17);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBook(await booksService.getBook(bookId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const chapters = useMemo(() => book?.chapters || [], [book]);
  const current = chapters[index] || null;

  const goTo = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= chapters.length) return;
    setIndex(nextIndex);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeFont = (delta) => {
    setFontSize((size) => Math.min(MAX_FONT, Math.max(MIN_FONT, size + delta)));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={26} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Logo />
        <div className="card mt-6 w-full max-w-lg">
          <ErrorState message={error || 'eBook not found.'} onRetry={load} />
        </div>
        <Link to="/dashboard" className="btn-secondary mt-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open chapter list"
          >
            <BookOpen size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/books/${bookId}`)}
            className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-primary-600 lg:flex"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-slate-900">{book.title}</p>
            <p className="truncate text-[11px] text-slate-400">
              {book.author || 'Unknown author'} · Chapter {index + 1} of {chapters.length}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => changeFont(-1)}
              disabled={fontSize <= MIN_FONT}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              <Minus size={15} />
            </button>
            <span className="w-9 text-center text-[11px] font-semibold text-slate-500">{fontSize}</span>
            <button
              type="button"
              onClick={() => changeFont(1)}
              disabled={fontSize >= MAX_FONT}
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
              title="Increase font size"
              aria-label="Increase font size"
            >
              <Plus size={15} />
            </button>
          </div>

          <Link to={`/books/${bookId}/edit`} className="btn-secondary btn-sm hidden sm:inline-flex">
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapters</p>
            <nav className="thin-scroll mt-3 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
              {chapters.map((chapter, chapterIndex) => (
                <button
                  key={chapter._id}
                  type="button"
                  onClick={() => goTo(chapterIndex)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                    chapterIndex === index
                      ? 'bg-primary-50 font-semibold text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className="mt-0.5 text-[10px] font-bold opacity-60">
                    {String(chapterIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="line-clamp-2">{chapter.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {current ? (
            <article>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
                Chapter {index + 1}
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900">{current.title}</h1>
              {current.description && <p className="mt-2 text-slate-500">{current.description}</p>}
              <div className="mt-6 border-t border-slate-100 pt-2" style={{ fontSize: `${fontSize}px` }}>
                <MarkdownPreview
                  content={current.content}
                  emptyLabel="This chapter hasn't been written yet. Open the editor and generate it with AI."
                />
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <BookOpen size={24} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">This eBook has no chapters yet.</p>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Button
              variant="secondary"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <span className="text-xs text-slate-400">Updated {formatDate(book.updatedAt)}</span>
            <Button
              variant="secondary"
              onClick={() => goTo(index + 1)}
              disabled={index >= chapters.length - 1}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-pop">
            <div className="mb-4 flex items-center justify-between">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close chapter list"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapters</p>
            <nav className="mt-3 space-y-1">
              {chapters.map((chapter, chapterIndex) => (
                <button
                  key={chapter._id}
                  type="button"
                  onClick={() => goTo(chapterIndex)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                    chapterIndex === index
                      ? 'bg-primary-50 font-semibold text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span className="mt-0.5 text-[10px] font-bold opacity-60">
                    {String(chapterIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="line-clamp-2">{chapter.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
