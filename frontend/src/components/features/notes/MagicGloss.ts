import { Mark, mergeAttributes } from '@tiptap/core';

export interface MagicGlossOptions {
  multicolor: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    magicGloss: {
      setMagicGloss: (attributes?: { color?: string; comment?: string }) => ReturnType;
      toggleMagicGloss: (attributes?: { color?: string; comment?: string }) => ReturnType;
      unsetMagicGloss: () => ReturnType;
    };
  }
}

export const MagicGloss = Mark.create<MagicGlossOptions>({
  name: 'magicGloss',

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor,
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }
          const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(attributes.color);
          const safeColor = isValidHex ? attributes.color : '#fef08a';
          return {
            'data-color': safeColor,
            style: `background-color: ${safeColor}; color: inherit`,
          };
        },
      },
      comment: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment'),
        renderHTML: attributes => {
          if (!attributes.comment) {
            return {};
          }
          return {
            'data-comment': attributes.comment,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'magic-gloss cursor-pointer' }), 0];
  },

  addCommands() {
    return {
      setMagicGloss: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleMagicGloss: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetMagicGloss: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
