import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, FileText, PlayCircle, Sparkles, Star } from 'lucide-react';

const PREVIEW_BOOKS = [
  { title: 'The Future of Remote Work', chapters: 12, tone: 'from-violet-500 to-fuchsia-400', state: 'Draft' },
  { title: 'Mindful Mornings', chapters: 8, tone: 'from-sky-500 to-cyan-400', state: 'Published' },
  { title: 'Product Design Playbook', chapters: 15, tone: 'from-amber-500 to-orange-400', state: 'Draft' },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary-200/60 via-primary-100/40 to-fuchsia-100 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate text-xs text-slate-400">app.aiebookcreator.com/dashboard</span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">All eBooks</p>
              <p className="text-xs text-slate-400">3 projects · 35 chapters</p>
            </div>
            <span className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1.5 text-xs font-semibold text-white">
              + Create New
            </span>
          </div>

          <div className="space-y-3">
            {PREVIEW_BOOKS.map((book) => (
              <div
                key={book.title}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-primary-200"
              >
                <div className={`flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${book.tone} text-white`}>
                  <BookOpen size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{book.title}</p>
                  <p className="text-[11px] text-slate-400">{book.chapters} chapters</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    book.state === 'Published'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {book.state}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-700">
              <Sparkles size={13} /> Generate chapter with AI
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-primary-200/70" />
              <div className="h-1.5 w-11/12 rounded-full bg-primary-200/60" />
              <div className="h-1.5 w-4/5 rounded-full bg-primary-200/50" />
              <div className="h-1.5 w-2/3 rounded-full bg-primary-200/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-6 top-16 hidden -translate-x-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card sm:block">
        <p className="text-[11px] font-semibold text-slate-800">Export ready</p>
        <p className="text-[10px] text-slate-400">ebook.pdf · 1.2 MB</p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,246,.12),transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Sparkles size={13} /> AI-Powered Publishing
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Create Stunning{' '}
            <span className="bg-gradient-to-r from-primary-600 to-fuchsia-500 bg-clip-text text-transparent">
              eBooks
            </span>{' '}
            in Minutes
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
            Write, design and export professional eBooks using AI. Generate outlines, draft full
            chapters, refine them in a real Markdown editor and download publication-ready PDF or
            DOCX files — all in one workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn-primary px-5 py-3 text-base">
              Start Creating for Free <ArrowRight size={17} />
            </Link>
            <a href="#features" className="btn-secondary px-5 py-3 text-base">
              <PlayCircle size={17} className="text-primary-600" /> Watch Demo
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {['No credit card required', 'Export PDF & DOCX', 'Your data stays yours'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-500" /> {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-primary-500 to-fuchsia-400"
                />
              ))}
            </div>
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <strong className="text-slate-800">4.9/5</strong> from 2,400+ creators
            </span>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
