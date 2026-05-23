/**
 * smart-mention.ts
 * Two Tiptap Mention extension instances — one for @Tasks, one for #Subjects.
 * Renders data-attribute-based badges (React-safe: no inline onClick).
 * Click handling is delegated to TiptapEditor's editorProps.handleClick.
 *
 * NOTE: renderHTML must live inside .extend() (schema-level), not .configure()
 * (options-level). HTMLAttributes + suggestion are configure-level only.
 */

import { Mention } from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import { buildMentionSuggestion, type MentionItem } from './mention-suggestion';
import { useTaskStore } from '@/store/useTaskStore';
import { useSubjectStore } from '@/store/useSubjectStore';

// ── @Task Mention ────────────────────────────────────────────────────────────

export const TaskMention = Mention
  .extend({
    name: 'taskMention',
    renderHTML({ node, HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'mention-badge mention-badge--task',
          'data-type': 'task',
          'data-id': node.attrs.id as string,
          'data-label': node.attrs.label as string,
        }),
        `@${node.attrs.label as string}`,
      ];
    },
  })
  .configure({
    suggestion: buildMentionSuggestion('task', (query: string): MentionItem[] => {
      const tasks = useTaskStore.getState().tasks;
      const q = query.toLowerCase();
      return tasks
        .filter(t => t.title.toLowerCase().includes(q))
        .slice(0, 8)
        .map(t => ({ id: t.id, label: t.title, kind: 'task' as const }));
    }),
  });

// ── #Subject Mention ─────────────────────────────────────────────────────────

export const SubjectMention = Mention
  .extend({
    name: 'subjectMention',
    renderHTML({ node, HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'mention-badge mention-badge--subject',
          'data-type': 'subject',
          'data-id': node.attrs.id as string,
          'data-label': node.attrs.label as string,
        }),
        `#${node.attrs.label as string}`,
      ];
    },
  })
  .configure({
    suggestion: {
      char: '#',
      ...buildMentionSuggestion('subject', (query: string): MentionItem[] => {
        const subjects = useSubjectStore.getState().subjects;
        const q = query.toLowerCase();
        return subjects
          .filter(s => s.title.toLowerCase().includes(q))
          .slice(0, 8)
          .map(s => ({ id: s.id, label: s.title, kind: 'subject' as const }));
      }),
    },
  });
