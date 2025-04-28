'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { OutlineItem } from './OutlineItem';
import { v4 as uuidv4 } from 'uuid';
import { generateOutline, extractTitleFromContent } from '@/services/outlineService';

export interface OutlineItemData {
  id: string;
  content: string;
  level: number;
}

interface OutlineListProps {
  initialItems?: OutlineItemData[];
  editorContent?: string;
  documentTitle?: string;
  onChange?: (items: OutlineItemData[]) => void;
}

export const OutlineList: React.FC<OutlineListProps> = ({
  initialItems = [],
  editorContent = '',
  documentTitle = '',
  onChange
}) => {
  const [items, setItems] = useState<OutlineItemData[]>(initialItems);
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemLevel, setNewItemLevel] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'}|null>(null);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // 如果没有目标位置或目标位置与源位置相同，不做任何处理
    if (!destination || (destination.index === source.index)) {
      return;
    }

    const newItems = Array.from(items);
    const [removed] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, removed);

    setItems(newItems);
    onChange?.(newItems);
  };

  const handleAddItem = () => {
    if (newItemContent.trim() === '') return;

    const newItem: OutlineItemData = {
      id: uuidv4(),
      content: newItemContent,
      level: newItemLevel
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange?.(updatedItems);
    setNewItemContent('');
  };

  const handleEditItem = (id: string, newContent: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, content: newContent } : item
    );
    setItems(updatedItems);
    onChange?.(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onChange?.(updatedItems);
  };

  const handleGenerateOutline = async () => {
    try {
      setIsGenerating(true);
      setMessage(null);
      
      // 从编辑器内容提取标题
      const title = documentTitle || extractTitleFromContent(editorContent);
      
      // 调用大纲生成服务
      const generatedOutline = await generateOutline({
        title: title,
        partialContent: editorContent,
        outlineDepth: 2
      });
      
      setItems(generatedOutline);
      onChange?.(generatedOutline);
      
      setMessage({
        text: "已根据文档内容生成大纲",
        type: "success"
      });
      
      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('生成大纲失败', error);
      setMessage({
        text: error.message || "生成大纲失败，请稍后重试",
        type: "error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="outline-container p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">文档大纲</h2>
        <button 
          onClick={handleGenerateOutline}
          disabled={isGenerating}
          className={`px-3 py-1.5 rounded text-white ${
            isGenerating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGenerating ? '生成中...' : '生成大纲'}
        </button>
      </div>
      
      {message && (
        <div className={`mb-4 p-2 rounded text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="outline-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="outline-items min-h-[200px]"
            >
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  大纲为空，请添加大纲项或生成大纲
                </div>
              ) : (
                items.map((item, index) => (
                  <OutlineItem
                    key={item.id}
                    id={item.id}
                    content={item.content}
                    level={item.level}
                    index={index}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="add-outline-item mt-4">
        <div className="flex items-center mb-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="输入新大纲项..."
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <select
            value={newItemLevel}
            onChange={(e) => setNewItemLevel(Number(e.target.value))}
            className="ml-2 p-2 border rounded"
          >
            <option value={1}>级别 1</option>
            <option value={2}>级别 2</option>
            <option value={3}>级别 3</option>
          </select>
          <button
            onClick={handleAddItem}
            className="ml-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!newItemContent.trim()}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}; 