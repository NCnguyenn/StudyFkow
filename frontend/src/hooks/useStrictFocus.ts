import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/useFocusStore';

export const useStrictFocus = () => {
  const { phase, setPhase } = useFocusStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the tab
        if (useFocusStore.getState().phase === 'FOCUSING' || useFocusStore.getState().phase === 'WARNING') {
          // Start 10-second penalty countdown
          timeoutRef.current = setTimeout(() => {
            // Trigger abandoned (stops timer, pauses music, turns red)
            useFocusStore.getState().setPhase('ABANDONED');
          }, 10000);
        }
      } else {
        // User returned
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};
