import { useCallback, useEffect, useState } from "react";

const INITIAL_TOAST = {
  message: "",
  type: "success",
  visible: false
};

export function useToast() {
  const [toast, setToast] = useState(INITIAL_TOAST);

  const hideToast = useCallback(() => {
    setToast((current) => ({ ...current, visible: false }));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
  }, []);

  useEffect(() => {
    if (!toast.visible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      hideToast();
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [hideToast, toast.visible]);

  return { toast, showToast, hideToast };
}

export default useToast;
