'use client';
import { useEffect, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ICONS = { success: '✅', error: '❌' };

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onDismiss(t.id)}>
          <span>{ICONS[t.type]}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// Hook
let _id = 0;
export function useToast() {
  const [toasts, setToasts] = (typeof window !== 'undefined'
    ? [[] as Toast[], (_: Toast[]) => {}]
    : [[] as Toast[], (_: Toast[]) => {}]);

  // We'll use a simple global approach via module-level state via React state
  return { toasts: [] as Toast[], toast: (_msg: string, _type?: 'success' | 'error') => {} };
}
