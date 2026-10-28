import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Field, Input, Select, Textarea } from './ui/Field';
import SortableList from './ui/SortableList';
import { useToast } from '../context/ToastContext';
import * as aiService from '../services/ai.service';
import * as booksService from '../services/books.service';
import { getErrorMessage } from '../lib/api';
import { cn } from '../lib/utils';

export const WRITING_STYLES = [
  'Informative',
  'Professional',
  'Casual',
  'Storytelling',
  'Academic',
  'Creative',
];

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createChapter = (index, title = '', description = '') => ({
  id: newId(),
  title,
  description,
});

export default function CreateBookWizard({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', chapterCount: 5, topic: '', style: 'Informative' });
  const [errors, setErrors] = useState({});
  const [chapters, setChapters] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: '', description: '' });

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({ title: '', chapterCount: 5, topic: '', style: 'Informative' });
      setErrors({});
      setChapters([]);
      setEditingId(null);
      setGenerating(false);
      setCreating(false);
    }
  }, [open]);

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  };

  const validateStepOne = () => {
    const next = {};
    const count = Number(form.chapterCount);
    if (!form.title.trim()) next.title = 'Book title is required.';
    if (!Number.isInteger(count) || count < 1 || count > 30) {
      next.chapterCount = 'Choose between 1 and 30 chapters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateStepOne()) return;
    setGenerating(true);
    setErrors({});
    try {
      const generated = await aiService.generateOutline({
        title: form.title.trim(),
        chapterCount: Number(form.chapterCount),
        topic: form.topic.trim(),
        style: form.style,
      });
      setChapters(generated.map((chapter, index) => createChapter(index, chapter.title, chapter.description)));
      setStep(2);
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
    } finally {
      setGenerating(false);
    }
  };

  const handleManual = () => {
    if (!validateStepOne()) return;
    const count = Number(form.chapterCount);
    setChapters(
      Array.from({ length: count }, (_, index) => createChapter(index, `Chapter ${index + 1}`, ''))
    );
    setStep(2);
  };

  const startEditing = (chapter) => {
    setEditingId(chapter.id);
    setDraft({ title: chapter.title, description: chapter.description });
  };

  const commitDraft = () => {
    const title = draft.title.trim();
    if (!title) {
      toast.error('Chapter title cannot be empty.');
      return;
    }
    setChapters((current) =>
      current.map((chapter) =>
        chapter.id === editingId
          ? { ...chapter, title: title.slice(0, 200), description: draft.description.trim().slice(0, 1000) }
          : chapter
      )
    );
    setEditingId(null);
  };

  const addChapter = () => {
    const chapter = createChapter(chapters.length, `Chapter ${chapters.length + 1}`, '');
    setChapters((current) => [...current, chapter]);
    setEditingId(chapter.id);
    setDraft({ title: chapter.title, description: '' });
  };

  const removeChapter = (id) => {
    setChapters((current) => current.filter((chapter) => chapter.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleCreate = async () => {
    const valid = chapters.filter((chapter) => chapter.title.trim());
    if (!valid.length) {
      toast.error('Add at least one chapter with a title.');
      return;
    }
    if (editingId) commitDraft();

    setCreating(true);
    try {
      const book = await booksService.createBook({
        title: form.title.trim(),
        topic: form.topic.trim(),
        style: form.style,
        chapters: valid.map((chapter, index) => ({
          title: chapter.title.trim(),
          description: chapter.description.trim(),
          order: index,
        })),
      });
      toast.success('eBook created. Let’s write the first chapter.');
      onCreated?.(book);
      navigate(`/books/${book._id}/edit`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const countLabel = useMemo(() => `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`, [chapters]);

  return (
    <Modal
      open={open}
      onClose={creating || generating ? () => {} : onClose}
      size="lg"
      closeOnOverlay={false}
      title={step === 1 ? 'Create New eBook' : 'Review Chapters'}
      description={
        step === 1
          ? 'Step 1 of 2 — tell us about your book, then generate an outline with AI.'
          : `Step 2 of 2 — ${countLabel}. Edit, reorder or remove any chapter before creating.`
      }
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleManual} disabled={generating}>
              Add chapters manually
            </Button>
            <Button onClick={handleGenerate} loading={generating}>
              <Sparkles size={16} /> Generate Outline with AI
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} disabled={creating}>
              <ArrowLeft size={15} /> Go Back
            </Button>
            <Button variant="secondary" onClick={addChapter} disabled={creating}>
              <Plus size={15} /> Add Chapter
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              <Check size={16} /> Create eBook
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-5">
          {errors.form && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {errors.form}
            </div>
          )}

          <Field label="Book Title" htmlFor="book-title" error={errors.title} required>
            <Input
              id="book-title"
              placeholder="e.g. The Practical Guide to Deep Work"
              value={form.title}
              onChange={updateForm('title')}
              invalid={Boolean(errors.title)}
              maxLength={200}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Number of Chapters"
              htmlFor="chapter-count"
              error={errors.chapterCount}
              hint="Between 1 and 30"
              required
            >
              <Input
                id="chapter-count"
                type="number"
                min={1}
                max={30}
                value={form.chapterCount}
                onChange={updateForm('chapterCount')}
                invalid={Boolean(errors.chapterCount)}
              />
            </Field>

            <Field label="Writing Style" htmlFor="style" required>
              <Select id="style" value={form.style} onChange={updateForm('style')}>
                {WRITING_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Topic" htmlFor="topic" hint="Optional — what is this book really about?">
            <Textarea
              id="topic"
              placeholder="Focus areas, audience, key ideas you want covered..."
              value={form.topic}
              onChange={updateForm('topic')}
              maxLength={500}
            />
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          <SortableList
            items={chapters}
            onReorder={setChapters}
            itemClassName="mb-2.5"
            renderItem={(chapter) => (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 pl-8 shadow-sm transition hover:border-primary-200">
                {editingId === chapter.id ? (
                  <div className="space-y-2.5">
                    <Input
                      value={draft.title}
                      autoFocus
                      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Chapter title"
                      maxLength={200}
                    />
                    <Textarea
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="What does this chapter cover?"
                      maxLength={1000}
                      className="min-h-[70px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X size={14} /> Cancel
                      </Button>
                      <Button size="sm" onClick={commitDraft}>
                        <Check size={14} /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600">
                      {chapters.findIndex((item) => item.id === chapter.id) + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {chapter.title || 'Untitled chapter'}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {chapter.description || 'No description yet.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(chapter)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-primary-600"
                        title="Edit chapter"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChapter(chapter.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Delete chapter"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          />

          <button
            type="button"
            onClick={addChapter}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300',
              'py-3 text-sm font-semibold text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600'
            )}
          >
            <Plus size={16} /> Add Chapter
          </button>

          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={12} className={cn('hidden', generating && 'animate-spin')} />
            Drag the handle on the left to reorder chapters.
          </p>
        </div>
      )}
    </Modal>
  );
}
