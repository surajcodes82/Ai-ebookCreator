import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Expand,
  Loader2,
  Minimize2,
  PanelLeft,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import ChapterSidebar from '../components/editor/ChapterSidebar';
import BookDetailsForm from '../components/editor/BookDetailsForm';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownPreview from '../components/MarkdownPreview';
import ExportMenu from '../components/ExportMenu';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Field, Input } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/States';
import { useToast } from '../context/ToastContext';
import * as booksService from '../services/books.service';
import * as aiService from '../services/ai.service';
import * as uploadService from '../services/upload.service';
import { getErrorMessage } from '../lib/api';
import { cn } from '../lib/utils';

const toDetails = (book) => ({
  title: book.title || '',
  subtitle: book.subtitle || '',
  author: book.author || '',
  topic: book.topic || '',
  style: book.style || 'Informative',
  coverImage: book.coverImage || '',
});

export default function BookEditor() {
  const { bookId } = useParams();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [tab, setTab] = useState('editor');
  const [mode, setMode] = useState('edit');
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [details, setDetails] = useState(null);

  const [saving, setSaving] = useState(false);
  const [chapterBusy, setChapterBusy] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [pendingGenerate, setPendingGenerate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const generating = generatingId !== null;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const loaded = await booksService.getBook(bookId);
      setBook(loaded);
      setDetails(toDetails(loaded));
      const first = loaded.chapters?.[0];
      setActiveId(first ? first._id : null);
      setDraft(first ? { title: first.title, content: first.content || '' } : { title: '', content: '' });
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const chapters = book?.chapters || [];
  const activeChapter = useMemo(
    () => chapters.find((chapter) => chapter._id === activeId) || null,
    [chapters, activeId]
  );

  const chapterDirty = Boolean(
    activeChapter && (draft.title !== activeChapter.title || draft.content !== (activeChapter.content || ''))
  );
  const detailsDirty = Boolean(
    book &&
      details &&
      (details.title !== (book.title || '') ||
        details.subtitle !== (book.subtitle || '') ||
        details.author !== (book.author || '') ||
        details.topic !== (book.topic || '') ||
        details.style !== (book.style || 'Informative') ||
        details.coverImage !== (book.coverImage || ''))
  );
  const hasChanges = chapterDirty || detailsDirty;

  const wordCount = useMemo(() => {
    const text = (draft.content || '').trim();
    return text ? text.split(/\s+/).length : 0;
  }, [draft.content]);

  const persistCurrentChapter = useCallback(async () => {
    if (!activeChapter || !chapterDirty) return null;
    const { book: updated } = await booksService.updateChapter(bookId, activeChapter._id, {
      title: draft.title.trim() || activeChapter.title,
      content: draft.content,
    });
    setBook(updated);
    return updated;
  }, [activeChapter, chapterDirty, draft, bookId]);

  const selectChapter = async (chapterId) => {
    if (chapterId === activeId) {
      setSidebarOpen(false);
      return;
    }
    try {
      if (chapterDirty) await persistCurrentChapter();
    } catch (error) {
      toast.error(getErrorMessage(error));
      return;
    }
    const target = chapters.find((chapter) => chapter._id === chapterId);
    if (!target) return;
    setActiveId(chapterId);
    setDraft({ title: target.title, content: target.content || '' });
    setMode('edit');
    setTab('editor');
    setSidebarOpen(false);
  };

  const handleAddChapter = async () => {
    setChapterBusy(true);
    try {
      if (chapterDirty) await persistCurrentChapter();
      const { book: updated, chapterId } = await booksService.addChapter(bookId, {
        title: `Chapter ${chapters.length + 1}`,
      });
      const created = updated.chapters.find((chapter) => chapter._id === chapterId);
      setBook(updated);
      setActiveId(chapterId);
      setDraft({ title: created?.title || `Chapter ${chapters.length + 1}`, content: created?.content || '' });
      setTab('editor');
      setMode('edit');
      setSidebarOpen(false);
      toast.success('Chapter added.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setChapterBusy(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    try {
      const updated = await booksService.deleteChapter(bookId, chapterId);
      setBook(updated);
      if (chapterId === activeId) {
        const next = updated.chapters?.[0];
        setActiveId(next ? next._id : null);
        setDraft(next ? { title: next.title, content: next.content || '' } : { title: '', content: '' });
      }
      toast.success('Chapter deleted.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleReorder = async (items) => {
    const previous = book.chapters;
    const nextChapters = items.map(({ id, ...rest }) => rest);
    setBook({ ...book, chapters: nextChapters });
    try {
      const updated = await booksService.reorderChapters(
        bookId,
        nextChapters.map((chapter) => chapter._id)
      );
      setBook(updated);
      toast.success('Chapter order saved.');
    } catch (error) {
      setBook({ ...book, chapters: previous });
      toast.error(getErrorMessage(error));
    }
  };

  /** Fills the editor with an AI draft for `chapterId`. Nothing is persisted until Save Changes. */
  const runGenerate = async (chapterId) => {
    if (generatingId) return;
    const target = chapters.find((chapter) => chapter._id === chapterId);
    if (!target) return;

    setGeneratingId(chapterId);
    try {
      let chapter = target;
      // Moving to another chapter would drop unsaved edits, so persist them first.
      if (chapterId !== activeId && chapterDirty) {
        const updated = await persistCurrentChapter();
        chapter = updated?.chapters.find((item) => item._id === chapterId) || chapter;
      }

      const existingContent = chapterId === activeId ? draft.content || '' : chapter.content || '';

      const content = await aiService.generateChapter({
        bookId,
        chapterId,
        existingContent: existingContent || undefined,
      });

      setActiveId(chapterId);
      setDraft({ title: chapter.title, content });
      setMode('edit');
      setTab('editor');
      setSidebarOpen(false);
      toast.success('Chapter generated. Review it, then click Save Changes.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGeneratingId(null);
    }
  };

  /** Chapters that already have text ask before being overwritten. */
  const requestGenerate = (chapterId) => {
    if (generatingId) return;
    const chapter = chapters.find((item) => item._id === chapterId);
    if (!chapter) return;
    const existing = chapterId === activeId ? draft.content : chapter.content;
    if (existing && existing.trim()) {
      setPendingGenerate(chapterId);
      return;
    }
    runGenerate(chapterId);
  };

  const handleGenerate = () => {
    if (!activeChapter) return;
    requestGenerate(activeChapter._id);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!hasChanges) {
      toast.info('No changes to save.');
      return;
    }
    setSaving(true);
    try {
      let updated = book;

      if (chapterDirty && activeChapter) {
        const result = await booksService.updateChapter(bookId, activeChapter._id, {
          title: draft.title.trim() || activeChapter.title,
          content: draft.content,
        });
        updated = result.book;
        setBook(updated);
      }

      if (detailsDirty) {
        updated = await booksService.updateBook(bookId, {
          title: details.title.trim() || (updated.title ?? ''),
          subtitle: details.subtitle,
          author: details.author,
          topic: details.topic,
          style: details.style,
          coverImage: details.coverImage,
        });
        setBook(updated);
        setDetails(toDetails(updated));
      }

      setSavedAt(new Date());
      toast.success('Changes saved successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCoverFile = async (file) => {
    setUploading(true);
    try {
      const url = await uploadService.uploadCover(file);
      setDetails((current) => ({ ...current, coverImage: url }));
      toast.success('Cover uploaded. Save changes to apply it to your eBook.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    const onBeforeUnload = (event) => {
      if (chapterDirty || detailsDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Opening your eBook..." />
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Logo />
        <div className="card mt-6 w-full max-w-lg">
          <ErrorState message={loadError || 'eBook not found.'} onRetry={load} />
        </div>
        <Link to="/dashboard" className="btn-secondary mt-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const sidebarProps = {
    book,
    activeId,
    busy: chapterBusy,
    generatingId,
    onSelect: selectChapter,
    onAdd: handleAddChapter,
    onDelete: handleDeleteChapter,
    onReorder: handleReorder,
    onGenerate: requestGenerate,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {!fullscreen && (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open chapter list"
          >
            <PanelLeft size={18} />
          </button>

          <div className="hidden lg:block">
            <Logo size="sm" to="/dashboard" />
          </div>

          <div className="ml-1 flex rounded-lg bg-slate-100 p-1 sm:ml-3">
            {[
              { key: 'editor', label: 'Editor' },
              { key: 'details', label: 'Book Details' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                  tab === item.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {hasChanges && (
              <span className="hidden items-center gap-1.5 text-xs font-medium text-amber-600 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved
              </span>
            )}
            <ExportMenu bookId={bookId} />
            <Button onClick={handleSave} loading={saving} disabled={!hasChanges} className="px-3 py-2 text-sm">
              <Save size={15} /> <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </header>
      )}

      <div className="flex min-h-0 flex-1">
        {!fullscreen && (
          <>
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 self-start lg:block">
              <ChapterSidebar {...sidebarProps} />
            </aside>

            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-900/50"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] shadow-pop">
                  <ChapterSidebar {...sidebarProps} onClose={() => setSidebarOpen(false)} />
                </div>
              </div>
            )}
          </>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          {tab === 'details' ? (
            <div className="thin-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
              <BookDetailsForm
                details={details}
                onChange={(field, value) => setDetails((current) => ({ ...current, [field]: value }))}
                uploading={uploading}
                onCoverFile={handleCoverFile}
                onRemoveCover={() => setDetails((current) => ({ ...current, coverImage: '' }))}
              />
              <div className="mx-auto mt-6 flex w-full max-w-3xl justify-end pb-10">
                <Button onClick={handleSave} loading={saving} disabled={!detailsDirty}>
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className={cn('border-b border-slate-200 bg-white px-4 py-3 sm:px-6', fullscreen && 'pt-3')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm font-bold uppercase tracking-wide text-primary-600">
                        Chapter Editor
                      </h1>
                      {generating && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                          <Loader2 size={11} className="animate-spin" /> Generating...
                        </span>
                      )}
                      {chapterDirty && !generating && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      Editing:{' '}
                      <span className="font-medium text-slate-800">
                        {draft.title || 'Untitled chapter'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg bg-slate-100 p-1">
                      {[
                        { key: 'edit', label: 'Edit' },
                        { key: 'preview', label: 'Preview' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setMode(item.key)}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                            mode === item.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFullscreen((value) => !value)}
                      className="btn-ghost btn-sm border border-slate-200 bg-white"
                      title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {fullscreen ? <Minimize2 size={15} /> : <Expand size={15} />}
                      <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Fullscreen'}</span>
                    </button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerate}
                      loading={Boolean(activeChapter) && generatingId === activeChapter._id}
                      disabled={!activeChapter || generating}
                      className="px-3 py-2 text-sm"
                    >
                      <Sparkles size={15} /> Generate with AI
                    </Button>
                  </div>
                </div>

                {activeChapter && (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <Field label="Chapter Title" htmlFor="chapter-title" className="min-w-[16rem] flex-1">
                      <Input
                        id="chapter-title"
                        value={draft.title}
                        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                        maxLength={200}
                        placeholder="Chapter title"
                      />
                    </Field>
                    <p className="pb-2.5 text-xs text-slate-400">
                      Chapter {chapters.findIndex((chapter) => chapter._id === activeId) + 1} of {chapters.length}
                    </p>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 p-3 sm:p-5">
                {!activeChapter ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <BookOpen size={26} className="text-primary-400" />
                    <h2 className="text-base font-semibold text-slate-900">No chapter selected</h2>
                    <p className="max-w-sm text-sm text-slate-500">
                      This eBook has no chapters yet. Add one to start writing, or generate an entire
                      outline from the dashboard.
                    </p>
                    <Button onClick={handleAddChapter} loading={chapterBusy}>
                      <Plus size={16} /> New Chapter
                    </Button>
                  </div>
                ) : mode === 'edit' ? (
                  <MarkdownEditor
                    value={draft.content}
                    onChange={(value) => setDraft((current) => ({ ...current, content: value }))}
                    className="h-full"
                  />
                ) : (
                  <div className="thin-scroll h-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
                    <MarkdownPreview content={draft.content} />
                  </div>
                )}
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-400 sm:px-6">
                <span className="flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>{(draft.content || '').length} characters</span>
                  <span className="hidden sm:inline">Markdown</span>
                </span>
                <span className="flex items-center gap-3">
                  {chapterDirty ? (
                    <span className="flex items-center gap-1.5 font-medium text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Not saved yet
                    </span>
                  ) : savedAt ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Check size={13} /> Saved {savedAt.toLocaleTimeString()}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Check size={13} /> All changes saved
                    </span>
                  )}
                  <span className="hidden font-medium text-slate-400 sm:inline">Ctrl+S</span>
                </span>
              </footer>
            </>
          )}
        </main>
      </div>

      {fullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="fixed right-4 top-4 z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-pop transition hover:bg-slate-50"
        >
          <Minimize2 size={14} className="mr-1.5 inline" /> Exit fullscreen
        </button>
      )}

      <ConfirmDialog
        open={Boolean(pendingGenerate)}
        onClose={() => setPendingGenerate(null)}
        onConfirm={() => {
          const chapterId = pendingGenerate;
          setPendingGenerate(null);
          runGenerate(chapterId);
        }}
        danger={false}
        title="Replace this chapter's content?"
        message="The AI will rewrite this chapter in the editor using fresh content based on your eBook. Your current text is replaced, but nothing is saved until you click Save Changes."
        confirmLabel="Generate"
      />
    </div>
  );
}
