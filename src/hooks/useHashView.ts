import { useEffect, useRef, useState } from 'react';
import type { View } from '../types';

const VIEWS: View[] = ['build', 'catalog', 'saved'];

function getViewFromHash(): View {
  const hash = location.hash.replace('#', '');
  return VIEWS.find((view) => view === hash) ?? 'build';
}

export function useHashView(): View {
  const [view, setView] = useState<View>(getViewFromHash);
  const previousView = useRef(view);

  useEffect(() => {
    function handleHashChange() {
      setView(getViewFromHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (previousView.current !== view) {
      previousView.current = view;
      window.scrollTo(0, 0);
    }
  }, [view]);

  return view;
}
