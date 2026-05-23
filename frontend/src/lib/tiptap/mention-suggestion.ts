/**
 * mention-suggestion.ts
 * Factory for Tiptap mention suggestion configuration.
 * Renders a tippy.js popup listing matching items from the Zustand store.
 * Keeps all DOM manipulation out of the React tree to stay React-safe.
 */

import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MentionSuggestionList } from './MentionSuggestionList';
import type { SuggestionOptions } from '@tiptap/suggestion';

export type MentionKind = 'task' | 'subject';

export interface MentionItem {
  id: string;
  label: string;
  kind: MentionKind;
}

export function buildMentionSuggestion(
  kind: MentionKind,
  getItems: (query: string) => MentionItem[],
): Partial<SuggestionOptions<MentionItem>> {
  return {
    items: ({ query }) => getItems(query),

    render: () => {
      let component: ReactRenderer<{ onKeyDown: (e: KeyboardEvent) => boolean }>;
      let popup: TippyInstance[];

      return {
        onStart(props) {
          component = new ReactRenderer(MentionSuggestionList, {
            props: { ...props, kind },
            editor: props.editor,
          });

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            theme: 'mention-popup',
          });
        },

        onUpdate(props) {
          component.updateProps({ ...props, kind });
          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        },

        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup[0]?.hide();
            return true;
          }
          return component.ref?.onKeyDown(props.event) ?? false;
        },

        onExit() {
          popup[0]?.destroy();
          component.destroy();
        },
      };
    },
  };
}
