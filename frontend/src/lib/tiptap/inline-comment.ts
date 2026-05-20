import { Mark, mergeAttributes } from '@tiptap/core';

export interface InlineCommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineComment: {
      setInlineComment: (attrs: { comment: string; color?: string }) => ReturnType;
      unsetInlineComment: () => ReturnType;
    };
  }
}

export const InlineComment = Mark.create<InlineCommentOptions>({
  name: 'inlineComment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      comment: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-comment') || '',
        renderHTML: (attributes) => ({ 'data-comment': attributes.comment }),
      },
      color: {
        default: '#fef08a',
        parseHTML: (element) => element.getAttribute('data-color') || '#fef08a',
        renderHTML: (attributes) => ({
          'data-color': attributes.color,
          style: `background-color: ${attributes.color}; border-bottom: 2px dotted color-mix(in srgb, ${attributes.color} 60%, #000); cursor: help;`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-comment]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setInlineComment:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetInlineComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
