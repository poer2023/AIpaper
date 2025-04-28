'use client';

import React, { useState, useRef } from 'react';
import { FileIcon, PDFIcon, DocIcon, TXTIcon } from './FileIcons';

interface FileUploadProps {
  onUploadSuccess?: (docId: string, fileInfo: any) => void;
  onUploadError?: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadSuccess, 
  onUploadError 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 限制文件类型和大小
  const acceptedFileTypes = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain'
  ];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File) => {
    // 检查文件类型
    if (!acceptedFileTypes.includes(file.type)) {
      return '不支持的文件类型。请上传PDF、DOCX或TXT文件。';
    }
    
    // 检查文件大小
    if (file.size > maxFileSize) {
      return `文件过大。最大支持${maxFileSize / (1024 * 1024)}MB的文件。`;
    }
    
    return null;
  };

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (onUploadError) onUploadError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      // 调用上传API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      setUploadProgress(100);
      const data = await response.json();
      
      if (onUploadSuccess) {
        onUploadSuccess(data.doc_id, {
          filename: file.name,
          size: file.size,
          type: file.type
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '上传过程中发生错误';
      setError(errorMsg);
      if (onUploadError) onUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理拖放相关事件
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; // 只取第一个文件
      handleUpload(file);
    }
  };

  // 处理文件选择
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleUpload(file);
    }
  };

  // 触发文件选择对话框
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 获取文件类型对应的图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PDFIcon className="w-12 h-12" />;
    if (fileType.includes('document')) return <DocIcon className="w-12 h-12" />;
    if (fileType.includes('text/plain')) return <TXTIcon className="w-12 h-12" />;
    return <FileIcon className="w-12 h-12" />;
  };

  return (
    <div className="w-full">
      {/* 拖放区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        } transition-colors duration-200 cursor-pointer`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.docx,.txt"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 text-indigo-600">
            {getFileIcon('application/pdf')}
          </div>
          
          <p className="mb-2 text-lg font-semibold text-gray-700">
            {isDragging ? '放开以上传文件' : '拖放文件至此处或点击上传'}
          </p>
          
          <p className="text-sm text-gray-500">
            支持PDF、DOCX和TXT格式，最大10MB
          </p>
          
          {!isDragging && !isUploading && (
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              选择文件
            </button>
          )}
        </div>
      </div>

      {/* 上传进度 */}
      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">
            {uploadProgress < 100 ? '上传中...' : '上传完成！'}
          </p>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 