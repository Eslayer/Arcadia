import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, Heart, ShoppingBag, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  comicTitle?: string;
  iconType?: 'cart' | 'favorite' | 'order' | 'default';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, options?: { title?: string; comicTitle?: string; iconType?: 'cart' | 'favorite' | 'order' | 'default' }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'success',
    options?: { title?: string; comicTitle?: string; iconType?: 'cart' | 'favorite' | 'order' | 'default' }
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: Toast = {
      id,
      message,
      type,
      title: options?.title,
      comicTitle: options?.comicTitle,
      iconType: options?.iconType || 'default',
    };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Mantener máximo 4 toasts simultáneos

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-gray-200 text-gray-800';
          let icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;

          if (toast.iconType === 'cart') {
            icon = <ShoppingBag className="w-5 h-5 text-primary-600" />;
          } else if (toast.iconType === 'favorite') {
            icon = <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50 border-rose-200 text-rose-900';
            icon = <AlertCircle className="w-5 h-5 text-rose-600" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-50 border-amber-200 text-amber-900';
            icon = <AlertCircle className="w-5 h-5 text-amber-600" />;
          } else if (toast.type === 'info') {
            bgClass = 'bg-blue-50 border-blue-200 text-blue-900';
            icon = <Info className="w-5 h-5 text-blue-600" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border ${bgClass} transform transition-all duration-300 animate-in slide-in-from-bottom-4`}
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                    {toast.title}
                  </p>
                )}
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.comicTitle && (
                  <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                    «{toast.comicTitle}»
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
};
