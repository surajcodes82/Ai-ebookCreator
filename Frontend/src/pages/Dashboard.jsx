import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import BookCard from '../components/BookCard';
import CreateBookWizard from '../components/CreateBookWizard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as booksService from '../services/books.service';
import { getErrorMessage } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBooks(await booksService.listBooks());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await booksService.deleteBook(pendingDelete._id);
      setBooks((current) => current.filter((book) => book._id !== pendingDelete._id));
      toast.success(`“${pendingDelete.title}” was deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">All eBooks</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Create, edit, and manage all your AI-generated eBooks.
              {user && (
                <>
                  {' '}
                  Signed in as <span className="font-medium text-slate-700">{user.email}</span>
                </>
              )}
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="self-start sm:self-auto">
            <Plus size={17} /> Create New eBook
          </Button>
        </div>

        <div className="mt-7">
          {loading ? (
            <LoadingState label="Loading your eBooks..." />
          ) : error ? (
            <div className="card">
              <ErrorState message={error} onRetry={load} />
            </div>
          ) : books.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No eBooks yet"
              description="Create your first eBook — generate an outline with AI, write the chapters and export it as PDF or DOCX."
              action={
                <Button onClick={() => setWizardOpen(true)}>
                  <Plus size={17} /> Create your first eBook
                </Button>
              }
            />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {books.length} eBook{books.length === 1 ? '' : 's'}
                </p>
                <Link to="/dashboard" className="btn-ghost btn-sm" onClick={(event) => { event.preventDefault(); load(); }}>
                  <RefreshCw size={14} /> Refresh
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.map((book) => (
                  <BookCard key={book._id} book={book} onDelete={setPendingDelete} deleting={deleting} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <CreateBookWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete eBook"
        message={`Are you sure you want to delete “${pendingDelete?.title || ''}”? This removes the book, all of its chapters and its cover image. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
