'use client';

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';

/**
 * V3 Performance Hook: Typing Throttle
 * 
 * When the user types rapidly, this hook adds the `perf-typing` class to <html>,
 * which triggers CSS rules that:
 *   1. Pause ambient mesh animation
 *   2. Reduce backdrop-filter blur from xl to 4px
 *   3. Lower ambient background opacity
 * 
 * After the user stops typing for THAW_DELAY ms, effects are restored.
 * This prevents GPU overload during sustained typing sessions.
 */

const THAW_DELAY = 3000; // ms — resume effects after 3s of no typing

export function useTypingPerformance(editor: Editor | null) {
  const isTypingRef = useRef(false);
  const thawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const onUpdate = () => {
      // Activate performance mode
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        document.documentElement.classList.add('perf-typing');
      }

      // Reset thaw timer
      if (thawTimerRef.current) {
        clearTimeout(thawTimerRef.current);
      }

      thawTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        document.documentElement.classList.remove('perf-typing');
      }, THAW_DELAY);
    };

    editor.on('update', onUpdate);

    return () => {
      editor.off('update', onUpdate);
      if (thawTimerRef.current) {
        clearTimeout(thawTimerRef.current);
      }
      // Ensure cleanup on unmount
      document.documentElement.classList.remove('perf-typing');
    };
  }, [editor]);
}
