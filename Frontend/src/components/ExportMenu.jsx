import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileText, FileType2, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import * as booksService from '../services/books.service';
import { downloadBlob } from '../lib/utils';
import { getErrorMessage } from '../lib/api';

export default function ExportMenu({ bookId, disabled = false }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleExport = async (kind) => {
    if (busy) return;
    setBusy(kind);
    try {
      const result = kind === 'pdf' ? await booksService.exportPdf(bookId) : await booksService.exportDocx(bookId);
      downloadBlob(result.blob, result.filename);
      toast.success(`${kind.toUpperCase()} export downloaded.`);
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || Boolean(busy)}
        className="btn-secondary btn-sm px-3 py-2 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        Export
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop" role="menu">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={Boolean(busy)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            role="menuitem"
          >
            {busy === 'pdf' ? (
              <Loader2 size={16} className="animate-spin text-rose-500" />
            ) : (
              <FileText size={16} className="text-rose-500" />
            )}
            <span>
              <span className="block font-medium">Export as PDF</span>
              <span className="block text-[11px] text-slate-400">Print-ready document</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleExport('docx')}
            disabled={Boolean(busy)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            role="menuitem"
          >
            {busy === 'docx' ? (
              <Loader2 size={16} className="animate-spin text-primary-500" />
            ) : (
              <FileType2 size={16} className="text-primary-500" />
            )}
            <span>
              <span className="block font-medium">Export as Document</span>
              <span className="block text-[11px] text-slate-400">Editable .docx file</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
