import { useEffect } from 'react';

/** Keeps the browser tab title in sync with the current screen. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = `${title} · AI eBook Creator`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
