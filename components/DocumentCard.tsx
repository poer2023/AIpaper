'use client';

import React from 'react';
import { PDFIcon, DocIcon, TXTIcon } from './FileIcons';

interface DocumentCardProps {
  id: string;
  title: string;
  authors: string;
  year?: string;
  fileType: 'pdf' | 'docx' | 'txt' | string;
  pageCount?: number;
  uploadDate: Date;
  onClick?: (id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  authors,
  year,
  fileType,
  pageCount,
  uploadDate,
  onClick
}) => {
  // 格式化作者列表，如果超过2个作者，显示et al.
  const formatAuthors = (authors: string) => {
    const authorList = authors.split(',').map(a => a.trim());
    if (authorList.length <= 2) {
      return authors;
    }
    return `${authorList[0]}, ${authorList[1]} et al.`;
  };

  // 格式化上传日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 根据文件类型获取图标
  const getFileIcon = () => {
    const iconClass = 'w-12 h-12';
    
    if (fileType === 'pdf' || fileType.includes('pdf')) {
      return <PDFIcon className={iconClass} />;
    } else if (fileType === 'docx' || fileType.includes('docx') || fileType.includes('document')) {
      return <DocIcon className={iconClass} />;
    } else if (fileType === 'txt' || fileType.includes('text')) {
      return <TXTIcon className={iconClass} />;
    } else {
      return <PDFIcon className={iconClass} />;
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onClick && onClick(id)}
    >
      <div className="flex items-start">
        {/* 文件图标 */}
        <div className="text-indigo-600 mr-4">
          {getFileIcon()}
        </div>
        
        {/* 文档信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{title}</h3>
          
          <div className="mt-1">
            <span className="text-sm text-gray-600">{formatAuthors(authors)}</span>
            {year && <span className="text-sm text-gray-600 ml-2">({year})</span>}
          </div>
          
          <div className="mt-2 flex flex-wrap text-xs text-gray-500">
            {pageCount !== undefined && (
              <span className="mr-4">
                {pageCount} 页
              </span>
            )}
            <span>
              上传于 {formatDate(uploadDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard; 