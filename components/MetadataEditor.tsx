'use client';

import React, { useState } from 'react';

interface DocumentMetadata {
  title: string;
  authors: string;
  year?: string;
  doi?: string;
}

interface MetadataEditorProps {
  initialMetadata: DocumentMetadata;
  documentId: string;
  onSave: (docId: string, metadata: DocumentMetadata) => void;
  onCancel?: () => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
  initialMetadata,
  documentId,
  onSave,
  onCancel
}) => {
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    ...initialMetadata
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // 在实际应用中，这里应该调用API保存元数据
      // 这里为了演示，直接调用onSave回调
      onSave(documentId, metadata);
    } catch (err) {
      console.error('保存元数据时出错:', err);
      setError('保存元数据失败。请稍后再试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">编辑文献元数据</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={metadata.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-1">
            作者 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="authors"
            name="authors"
            value={metadata.authors}
            onChange={handleChange}
            required
            placeholder="多位作者请用逗号分隔"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">多位作者请用逗号分隔，例如：张三, 李四, 王五</p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            发表年份
          </label>
          <input
            type="text"
            id="year"
            name="year"
            value={metadata.year || ''}
            onChange={handleChange}
            placeholder="例如：2023"
            pattern="[0-9]{4}"
            title="请输入4位数字的年份"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-1">
            DOI
          </label>
          <input
            type="text"
            id="doi"
            name="doi"
            value={metadata.doi || ''}
            onChange={handleChange}
            placeholder="例如：10.1234/example.2023.001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isSaving ? '保存中...' : '保存元数据'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetadataEditor; 