import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast('error', title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast('warning', title, message), [toast]);
  const info = useCallback((title: string, message?: string) => toast('info', title, message), [toast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon size={20} className={styles.icon} />;
      case 'error':
        return <AlertCircleIcon size={20} className={styles.icon} />;
      case 'warning':
        return <AlertTriangleIcon size={20} className={styles.icon} />;
      case 'info':
      default:
        return <InfoIcon size={20} className={styles.icon} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="alert">
            {getIcon(t.type)}
            <div className={styles.body}>
              <div className={styles.title}>{t.title}</div>
              {t.message && <div className={styles.message}>{t.message}</div>}
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <XIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
