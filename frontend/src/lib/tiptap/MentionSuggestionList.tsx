'use client';

/**
 * MentionSuggestionList.tsx
 * React component rendered inside the tippy.js popup for mention suggestions.
 * Exposed via ReactRenderer so it can be forward-ref'd for keyboard control.
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { MentionItem, MentionKind } from './mention-suggestion';

interface Props {
  items: MentionItem[];
  kind: MentionKind;
  command: (item: MentionItem) => void;
}

export interface MentionSuggestionListHandle {
  onKeyDown: (e: KeyboardEvent) => boolean;
}

export const MentionSuggestionList = forwardRef<MentionSuggestionListHandle, Props>(
  ({ items, kind, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') {
          setSelectedIndex(i => (i + items.length - 1) % items.length);
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % items.length);
          return true;
        }
        if (e.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="mention-popup-panel">
          <p className="mention-popup-empty">No results</p>
        </div>
      );
    }

    return (
      <div className="mention-popup-panel">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => command(item)}
            className={[
              'mention-popup-item',
              kind === 'task' ? 'mention-popup-item--task' : 'mention-popup-item--subject',
              idx === selectedIndex ? 'mention-popup-item--active' : '',
            ].join(' ')}
          >
            <span className={kind === 'task' ? 'mention-trigger--task' : 'mention-trigger--subject'}>
              {kind === 'task' ? '@' : '#'}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    );
  },
);

MentionSuggestionList.displayName = 'MentionSuggestionList';
