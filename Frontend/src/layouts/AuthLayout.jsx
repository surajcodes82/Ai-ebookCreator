import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';

const HIGHLIGHTS = [
  'AI outlines and full chapter drafts',
  'Real Markdown editor with live preview',
  'Drag-and-drop chapter reordering',
  'One-click PDF and DOCX export',
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 px-12 py-10 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(139,92,246,.45),transparent_65%)]" />
        <div className="relative">
          <Link to="/">
            <span className="flex items-center gap-2.5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-400">
                <Sparkles size={18} />
              </span>
              <span className="text-base font-bold">
                AI eBook <span className="text-primary-300">Creator</span>
              </span>
            </span>
          </Link>
        </div>

        <div className="relative mt-auto">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            From blank page to published eBook in a single session.
          </h2>
          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-slate-500">
            Your books, chapters and covers stay in your own account.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <Logo to="/" />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        {footer && <div className="mx-auto w-full max-w-md text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}
