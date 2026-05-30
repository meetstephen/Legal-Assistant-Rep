// ============================================================
// lexi/components/Toast.jsx — toast notifications
// ============================================================

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../AppContext.jsx';
import { cn } from '../utils.js';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-[420px] animate-slideInRight',
              STYLES[t.type] || STYLES.info
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="p-1 rounded-lg hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
