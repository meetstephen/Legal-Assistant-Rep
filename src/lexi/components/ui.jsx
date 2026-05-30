// ============================================================
// lexi/components/ui.jsx — shared UI primitives
// ============================================================

import React, { forwardRef, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../utils.js';

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 focus:ring-emerald-500',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-slate-500',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/25 focus:ring-red-500',
    outline: 'border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 focus:ring-emerald-500',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

export const Card = forwardRef(function Card(
  { className, variant = 'default', hover = false, children, ...props },
  ref
) {
  const base = 'rounded-2xl transition-all duration-300 p-6';
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
    glass: 'bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-xl',
    flat: 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800',
  };
  const hoverStyles = hover ? 'hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 cursor-pointer' : '';
  return (
    <div ref={ref} className={cn(base, variants[variant], hoverStyles, className)} {...props}>
      {children}
    </div>
  );
});

export const Input = forwardRef(function Input(
  { className, label, error, leftIcon, id, hint, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 py-2.5',
            leftIcon ? 'pl-10 pr-4' : 'px-4',
            error ? 'border-red-300 dark:border-red-700 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, label, error, id, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all duration-200 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/20 px-4 py-3 thin-scrollbar',
          error ? 'border-red-300 dark:border-red-700 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { className, label, error, options = [], id, children, ...props },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 px-4 py-2.5',
          error ? 'border-red-300 dark:border-red-700 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500',
          className
        )}
        {...props}
      >
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium rounded-full px-2.5 py-0.5 text-xs', variants[variant], className)}>
      {children}
    </span>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors mt-0.5',
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      {(label || hint) && (
        <span>
          {label && <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}
          {hint && <span className="block text-xs text-slate-400">{hint}</span>}
        </span>
      )}
    </label>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-modalFadeIn', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5 max-h-[72vh] overflow-y-auto thin-scrollbar">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
        {Icon && <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-5">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary" leftIcon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, gradient = 'from-emerald-400 to-teal-500', children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', gradient)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('w-4 h-4 animate-spin', className)} />;
}

export function Disclaimer({ text }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200">
      <strong>⚖️ Disclaimer:</strong> {text}
    </div>
  );
}
