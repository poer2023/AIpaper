// 简化版toast hook
import { useState, useEffect } from "react";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prevToasts) => prevToasts.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const toast = (props: ToastProps) => {
    setToasts((prevToasts) => [...prevToasts, props]);
  };

  return { toast, toasts };
}; 