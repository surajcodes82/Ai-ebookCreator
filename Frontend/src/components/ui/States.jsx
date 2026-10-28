import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} />;
}

export function LoadingState({ label = 'Loading...', className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-slate-500', className)}>
      <Loader2 size={26} className="animate-spin text-primary-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center', className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500 text-lg">
        !
      </span>
      <p className="max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary btn-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center', className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
          <Icon size={22} />
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
