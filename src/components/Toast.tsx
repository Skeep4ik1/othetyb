import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type?: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-semibold ${
                isError
                  ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/40'
                  : isInfo
                  ? 'bg-zinc-900/95 text-amber-300 border-amber-500/40 shadow-zinc-950/50'
                  : 'bg-zinc-900/95 text-zinc-100 border-zinc-800 shadow-zinc-950/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : isInfo ? (
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="ml-3 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Закрыть уведомление"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
