'use client';

import React, { useState, useRef } from 'react';
import TiptapEditor from '../../components/editor/TiptapEditor';
import Outline from '../../components/Outline'; // 需要按照实际路径调整
import CitationManager from '../../components/CitationManager'; // 需要按照实际路径调整

// 示例大纲数据类型，你需要根据实际情况调整
interface OutlineItem {
  id: string;
  title: string;
  children?: OutlineItem[];
}

const EditPage: React.FC = () => {
  const [editorContent, setEditorContent] = useState<string>('');
  const editorRef = useRef<{ insertCitation?: (id: string) => void }>(null);
  
  // 示例大纲数据，实际应用中应从后端获取或本地状态管理
  const initialOutline: OutlineItem[] = [
    { id: '1', title: '引言' },
    { id: '2', title: '方法', children: [
      { id: '2.1', title: '数据收集' },
      { id: '2.2', title: '数据分析' },
    ]},
    { id: '3', title: '结果' },
    { id: '4', title: '讨论' },
    { id: '5', title: '结论' },
  ];

  const handleOutlineChange = (newOutline: OutlineItem[]) => {
    console.log('大纲已更新:', newOutline);
    // 在这里处理大纲更新逻辑，例如保存到状态或发送到后端
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    console.log('编辑器内容已更改');
  };
  
  // 处理引用插入
  const handleInsertCitation = (citationId: string) => {
    if (editorRef.current && editorRef.current.insertCitation) {
      editorRef.current.insertCitation(citationId);
    } else {
      console.error('编辑器引用插入方法未找到');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧大纲区域 */}
      <div className="w-1/5 p-4 bg-white shadow-md overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">文档大纲</h2>
        <Outline initialItems={initialOutline} onOutlineChange={handleOutlineChange} />
      </div>

      {/* 中间编辑区域 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
          <TiptapEditor 
            onChange={handleEditorChange} 
            ref={editorRef} 
          />
        </div>
      </div>

      {/* 右侧引用管理区域 */}
      <div className="w-1/4 p-4 bg-white shadow-md overflow-y-auto">
        <CitationManager onInsertCitation={handleInsertCitation} />
      </div>
    </div>
  );
};

export default EditPage; 