import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Layers, Pencil, Sparkles, Trash2 } from 'lucide-react';
import AppHeader, { Breadcrumb } from '../components/layout/AppHeader';
import ExportMenu from '../components/ExportMenu';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import * as booksService from '../services/books.service';
import { formatDate, resolveCoverUrl } from '../lib/utils';
import { getErrorMessage } from '../lib/api';

export default function BookOverview() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await booksService.deleteBook(bookId);
      toast.success('eBook deleted.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <LoadingState label="Loading eBook..." />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="card">
            <ErrorState message={error || 'eBook not found.'} onRetry={load} />
          </div>
          <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const cover = resolveCoverUrl(book.coverImage);
  const chapters = book.chapters || [];
  const writtenWords = chapters.reduce(
    (total, chapter) => total + ((chapter.content || '').trim() ? (chapter.content || '').trim().split(/\s+/).length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: book.title },
          ]}
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="card overflow-hidden">
            <div className="aspect-[3/4] bg-slate-100">
              {cover ? (
                <img src={cover} alt={`${book.title} cover`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-600 to-fuchsia-500 p-6 text-center text-white">
                  <span className="text-sm font-bold leading-snug">{book.title}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 p-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <Layers size={13} className="text-slate-400" /> {chapters.length} chapters
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays size={13} className="text-slate-400" /> Updated {formatDate(book.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <Sparkles size={13} /> {book.style || 'Informative'}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{book.title}</h1>
            {book.subtitle && <p className="mt-1 text-lg text-slate-500">{book.subtitle}</p>}
            <p className="mt-2 text-sm text-slate-600">
              by <span className="font-medium text-slate-800">{book.author || 'Unknown author'}</span>
            </p>

            {book.topic && (
              <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">Topic: </span>
                {book.topic}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={`/books/${bookId}/edit`} className="btn-primary">
                <Pencil size={16} /> Edit eBook
              </Link>
              <Link to={`/books/${bookId}/read`} className="btn-secondary">
                Read
              </Link>
              <ExportMenu bookId={bookId} />
              <Button variant="dangerGhost" onClick={() => setConfirming(true)}>
                <Trash2 size={16} /> Delete
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Chapters', value: chapters.length },
                { label: 'Words written', value: writtenWords.toLocaleString() },
                { label: 'Last updated', value: formatDate(book.updatedAt) },
              ].map((stat) => (
                <div key={stat.label} className="card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="card mt-6 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Chapters</h2>
              {chapters.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No chapters yet. Open the editor to add your first chapter.
                </p>
              ) : (
                <ol className="mt-3 divide-y divide-slate-100">
                  {chapters.map((chapter, index) => (
                    <li key={chapter._id} className="flex items-start gap-3 py-2.5">
                      <span className="mt-0.5 text-xs font-bold text-primary-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{chapter.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-400">
                          {chapter.description || (chapter.content ? `${chapter.content.length} characters` : 'Not written yet')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete eBook"
        message={`Are you sure you want to delete “${book.title}”? This removes the book, all of its chapters and its cover image. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
