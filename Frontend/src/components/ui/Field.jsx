import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export function Field({ label, error, hint, htmlFor, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { className = '', invalid = false, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn('field-input', invalid && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100', className)}
      {...rest}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className = '', invalid = false, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn('field-input min-h-[96px] resize-y', invalid && 'border-rose-300', className)}
      {...rest}
    />
  );
});

export const Select = forwardRef(function Select(
  { className = '', children, invalid = false, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn('field-input appearance-none pr-8', invalid && 'border-rose-300', className)}
      {...rest}
    >
      {children}
    </select>
  );
});
