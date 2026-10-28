import { Link } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Logo({ to = '/', size = 'md', className = '', onClick }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-sm' },
    md: { box: 'h-9 w-9', icon: 18, text: 'text-base' },
    lg: { box: 'h-11 w-11', icon: 22, text: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  const inner = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 text-white shadow-sm',
          s.box
        )}
      >
        <BookOpenText size={s.icon} />
      </span>
      <span className={cn('font-bold tracking-tight text-slate-900', s.text)}>
        AI eBook <span className="text-primary-600">Creator</span>
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="transition hover:opacity-90">
        {inner}
      </button>
    );
  }

  return (
    <Link to={to} className="transition hover:opacity-90" aria-label="AI eBook Creator home">
      {inner}
    </Link>
  );
}
