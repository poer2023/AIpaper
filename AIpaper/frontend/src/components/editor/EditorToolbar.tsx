'use client';

import { Editor } from '@tiptap/react';
import React from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="粗体"
      >
        <span className="toolbar-icon">B</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="斜体"
      >
        <span className="toolbar-icon">I</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="删除线"
      >
        <span className="toolbar-icon">S</span>
      </button>
      <div className="toolbar-divider"></div>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title="标题1"
      >
        <span className="toolbar-icon">H1</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        title="标题2"
      >
        <span className="toolbar-icon">H2</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        title="标题3"
      >
        <span className="toolbar-icon">H3</span>
      </button>
      <div className="toolbar-divider"></div>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="无序列表"
      >
        <span className="toolbar-icon">•</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="有序列表"
      >
        <span className="toolbar-icon">1.</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        title="引用"
      >
        <span className="toolbar-icon">""</span>
      </button>
      <div className="toolbar-divider"></div>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        title="撤销"
      >
        <span className="toolbar-icon">↩</span>
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        title="重做"
      >
        <span className="toolbar-icon">↪</span>
      </button>
    </div>
  );
}; 