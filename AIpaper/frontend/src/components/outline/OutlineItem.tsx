'use client';

import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

export interface OutlineItemProps {
  id: string;
  content: string;
  level: number;
  index: number;
  onEdit: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
}

export const OutlineItem: React.FC<OutlineItemProps> = ({
  id,
  content,
  level,
  index,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit(id, editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getPaddingLeft = () => {
    return `${level * 1.5}rem`;
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`outline-item p-2 my-1 rounded border ${
            snapshot.isDragging ? 'bg-blue-50 shadow-md' : 'bg-white'
          }`}
          style={{
            ...provided.draggableProps.style,
            paddingLeft: getPaddingLeft(),
          }}
        >
          <div className="flex items-center">
            <div
              {...provided.dragHandleProps}
              className="drag-handle mr-2 cursor-move text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </div>
            
            {isEditing ? (
              <div className="flex-1 flex">
                <input
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 p-1 border rounded"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-sm"
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="ml-2 px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex-1 flex justify-between items-center">
                <span className="outline-text">{content}</span>
                <div className="outline-actions">
                  <button
                    onClick={handleEdit}
                    className="text-blue-500 hover:text-blue-600 mx-1"
                    title="编辑"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(id)}
                    className="text-red-500 hover:text-red-600 mx-1"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}; 