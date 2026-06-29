'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { useNoteStore } from '@/store/useNoteStore';
import { ArrowLeft, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

interface TiptapEditorProps {
  noteId: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ noteId }) => {
  const { notes, updateLocalNote, syncNoteToServer, renameNote, setActiveNote } = useNoteStore();
  const note = notes[noteId];

  const [titleInput, setTitleInput] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note) {
      setTitleInput(note.title || '');
    }
  }, [noteId, note?.title]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Start writing your page...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] py-4 cursor-text',
      },
    },
    content: note?.content_json || '',
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      useNoteStore.setState({ syncState: 'SAVING' });

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateLocalNote(noteId, { content_json: json });
        syncNoteToServer(noteId, { content_json: json });
      }, 1000);
    },
  }, [noteId]);

  // Content sync when active note changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const currentContent = note?.content_json;
    queueMicrotask(() => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setContent(currentContent || '', { emitUpdate: false });
    });
  }, [noteId, editor]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Page not found.
      </div>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    renameNote(noteId, val || 'Untitled Page');
  };

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleHeading1 = () => editor?.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleHeading2 = () => editor?.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent p-6 max-w-4xl mx-auto w-full space-y-4">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveNote(null)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Basic formatting toolbar */}
        <div className="flex items-center gap-1 bg-slate-105 dark:bg-slate-900 p-1 rounded-lg">
          <button
            onClick={toggleBold}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-600'}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={toggleItalic}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={toggleUnderline}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('underline') ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />
          <button
            onClick={toggleHeading1}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleHeading2}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />
          <button
            onClick={toggleBulletList}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={toggleOrderedList}
            className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer ${editor?.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500' : 'text-slate-650'}`}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Title Input */}
      <div className="pt-2">
        <input
          type="text"
          value={titleInput}
          onChange={handleTitleChange}
          placeholder="Untitled Page"
          className="text-3xl font-bold border-none bg-transparent focus:outline-none w-full text-slate-800 dark:text-white placeholder-slate-300"
        />
      </div>

      {/* Editor Content Area — warm cream paper feel */}
      <div className="flex-1 overflow-y-auto rounded-xl p-4" style={{ background: '#FAF6F0', color: '#1e293b' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
