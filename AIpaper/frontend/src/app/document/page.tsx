'use client';

import { useState, useRef } from 'react';
import { TiptapEditor } from '@/components/editor';
import { OutlineList, OutlineItemData } from '@/components/outline';
import { CitationManager, Citation } from '@/components/citation';

export default function DocumentPage() {
  const [editorContent, setEditorContent] = useState('<p>开始编写您的学术论文...</p>');
  const [outlineItems, setOutlineItems] = useState<OutlineItemData[]>([]);
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'gb-t-7714'>('apa');
  const editorRef = useRef<{ insertCitation: (id: string) => void }>(null);

  const handleEditorChange = (html: string) => {
    setEditorContent(html);
    // TODO: 同步编辑器内容到大纲?
  };

  const handleOutlineChange = (items: OutlineItemData[]) => {
    setOutlineItems(items);
    // TODO: 同步大纲变动到编辑器?
  };

  const handleCitationInsert = (citation: Citation) => {
    // 调用编辑器方法插入引用
    if (editorRef.current) {
      editorRef.current.insertCitation(citation.id);
    }
  };

  return (
    <main className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 大纲区域 */}
      <div className="lg:col-span-3 order-last lg:order-first">
        <OutlineList 
          initialItems={outlineItems}
          onChange={handleOutlineChange} 
        />
      </div>

      {/* 编辑器区域 */}
      <div className="lg:col-span-6">
        <h1 className="text-2xl font-bold mb-4">文档编辑器</h1>
        <div className="mb-6">
          <TiptapEditor 
            ref={editorRef}
            initialContent={editorContent}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* 引用管理区域 */}
      <div className="lg:col-span-3 order-last">
        <CitationManager 
          onCitationInsert={handleCitationInsert}
          citationStyle={citationStyle}
          onCitationStyleChange={setCitationStyle}
        />
      </div>
    </main>
  );
} 