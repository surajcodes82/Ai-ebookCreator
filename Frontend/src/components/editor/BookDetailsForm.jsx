import { useRef, useState } from 'react';
import { ImageUp, Loader2, Trash2 } from 'lucide-react';
import { Field, Input, Select, Textarea } from '../ui/Field';
import Button from '../ui/Button';
import { WRITING_STYLES } from '../CreateBookWizard';
import { bytesToSize, cn, resolveCoverUrl } from '../../lib/utils';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function BookDetailsForm({ details, onChange, uploading, onCoverFile, onRemoveCover }) {
  const fileRef = useRef(null);
  const [localPreview, setLocalPreview] = useState('');
  const [fileError, setFileError] = useState('');

  const previewSrc = localPreview || resolveCoverUrl(details.coverImage);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setFileError('Only JPEG, PNG, WEBP or GIF images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setFileError(`Image is too large (${bytesToSize(file.size)}). Maximum size is 5MB.`);
      return;
    }

    setFileError('');
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return objectUrl;
    });
    onCoverFile(file);
  };

  const handleRemove = () => {
    setLocalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });
    if (fileRef.current) fileRef.current.value = '';
    onRemoveCover();
  };

  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Book Details</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update the metadata shown on your dashboard, in the reader and on the exported files.
        </p>
      </section>

      <div className="card space-y-5 p-6">
        <Field label="Title" htmlFor="detail-title" required>
          <Input id="detail-title" value={details.title} onChange={update('title')} maxLength={200} />
        </Field>

        <Field label="Subtitle" htmlFor="detail-subtitle" hint="Optional tagline displayed under the title.">
          <Input
            id="detail-subtitle"
            value={details.subtitle}
            onChange={update('subtitle')}
            maxLength={300}
            placeholder="A practical handbook for makers"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Author" htmlFor="detail-author">
            <Input id="detail-author" value={details.author} onChange={update('author')} maxLength={120} placeholder="Your name" />
          </Field>

          <Field label="Writing Style" htmlFor="detail-style">
            <Select id="detail-style" value={details.style} onChange={update('style')}>
              {WRITING_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Topic" htmlFor="detail-topic" hint="Used as context when generating chapters with AI.">
          <Textarea
            id="detail-topic"
            value={details.topic}
            onChange={update('topic')}
            maxLength={500}
            placeholder="Audience, focus, key ideas..."
          />
        </Field>
      </div>

      <section className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900">Cover Image</h3>
        <p className="mt-1 text-xs text-slate-500">
          Recommended size: <strong>600×800</strong>. JPEG, PNG, WEBP or GIF up to 5MB.
        </p>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div
            className={cn(
              'relative flex h-56 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50'
            )}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Cover preview" className="h-full w-full object-cover" />
            ) : (
              <div className="px-4 text-center">
                <ImageUp size={22} className="mx-auto text-slate-300" />
                <p className="mt-2 text-[11px] leading-snug text-slate-400">No cover uploaded yet</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/75">
                <Loader2 size={22} className="animate-spin text-primary-500" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFile}
              className="hidden"
              id="cover-input"
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <ImageUp size={16} /> {previewSrc ? 'Replace cover' : 'Upload cover image'}
            </Button>
            {previewSrc && (
              <Button variant="dangerGhost" onClick={handleRemove} disabled={uploading}>
                <Trash2 size={16} /> Remove cover
              </Button>
            )}
            <p className="text-[11px] text-slate-400">Stored locally in /server/uploads or Cloudinary.</p>
            {fileError && <p className="field-error max-w-[16rem]">{fileError}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
