import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Jenni.ai Demo</h1>
      <p className="text-xl mb-8">AI驱动的智能写作助手</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">AI自动补全</h2>
          <p>基于GPT-4o的流式续写、改写与扩写</p>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">结构化大纲</h2>
          <p>一键生成文章大纲，拖拽重排后实时同步</p>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">引用检索与格式化</h2>
          <p>Crossref/语义学者API，支持多种引用格式</p>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-semibold mb-2">PDF知识检索</h2>
          <p>上传PDF，向量化分块检索与引用</p>
        </div>
      </div>
      
      <Link href="/document">
        <button className="mt-10 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          开始写作
        </button>
      </Link>
    </div>
  );
} 