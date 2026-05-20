import { Node, mergeAttributes } from '@tiptap/core';
import { InputRule } from '@tiptap/core';

/**
 * Bidirectional Link Node — Zettelkasten [[wikilink]] support for Tiptap.
 *
 * Syntax: [[Note Title]]
 *
 * Renders as an immutable inline pill/badge with a subtle background.
 * The node stores the linked note title in a `title` attribute and renders
 * as a `<span data-wiki-link="...">` in the DOM.
 */

export interface BidirectionalLinkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bidirectionalLink: {
      /**
       * Insert a [[wikilink]] node at the current cursor position.
       */
      setBidirectionalLink: (attrs: { title: string }) => ReturnType;
    };
  }
}

export const BidirectionalLink = Node.create<BidirectionalLinkOptions>({
  name: 'bidirectionalLink',

  group: 'inline',
  inline: true,
  atom: true, // makes it an immutable, non-editable inline block

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-wiki-link') || '',
        renderHTML: (attributes) => ({
          'data-wiki-link': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: [
          'inline-flex items-center gap-1',
          'px-1.5 py-0.5 mx-0.5',
          'rounded-md',
          'bg-indigo-50 text-indigo-600',
          'text-sm font-medium',
          'cursor-pointer hover:bg-indigo-100',
          'border border-indigo-200/60',
          'transition-colors',
          'select-none',
        ].join(' '),
        contenteditable: 'false',
      }),
      // Link icon (inline SVG for zero-dependency rendering)
      [
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '12',
          height: '12',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          class: 'shrink-0 opacity-60',
        },
        ['path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }],
        ['path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }],
      ],
      // Title text
      ['span', {}, `${HTMLAttributes['data-wiki-link'] ?? ''}`],
    ];
  },

  addCommands() {
    return {
      setBidirectionalLink:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addInputRules() {
    // Matches [[Some Title]] and converts it to a bidirectionalLink node
    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ state, range, match }) => {
          const title = match[1]?.trim();
          if (!title) return;

          const { tr } = state;
          const node = this.type.create({ title });
          tr.replaceWith(range.from, range.to, node);
          // Add a trailing space so the user can keep typing
          tr.insertText(' ');
        },
      }),
    ];
  },
});
