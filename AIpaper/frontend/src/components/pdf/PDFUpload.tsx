import React, { useState, useRef, useCallback } from 'react';

interface PDFUploadProps {
  onUploadSuccess: (pdfInfo: {
    pdf_id: string;
    filename: string;
    size: number;
  }) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

/**
 * PDF上传组件
 * 支持拖放和文件选择
 */
const PDFUpload: React.FC<PDFUploadProps> = ({ 
  onUploadSuccess, 
  onUploadError,
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理拖放事件
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理文件上传
  const uploadFile = async (file: File) => {
    // 验证是否为PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      onUploadError('只支持上传PDF文件');
      return;
    }

    // 验证文件大小
    if (file.size > 50 * 1024 * 1024) { // 50MB
      onUploadError('文件大小不能超过50MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // 创建XHR请求以跟踪进度
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          onUploadSuccess({
            pdf_id: response.pdf_id,
            filename: response.filename,
            size: response.size
          });
        } else {
          onUploadError(`上传失败: ${xhr.statusText}`);
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        onUploadError('上传过程中发生错误');
        setIsUploading(false);
      });

      xhr.open('POST', '/api/pdf/upload', true);
      xhr.send(formData);
    } catch (error) {
      console.error('PDF上传错误:', error);
      onUploadError('上传过程中发生错误');
      setIsUploading(false);
    }
  };

  // 处理拖放文件
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  }, [onUploadSuccess, onUploadError]);

  // 处理文件选择
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadFile(file);
    }
  }, [onUploadSuccess, onUploadError]);

  // 点击上传区域触发文件选择
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
        
        {isUploading ? (
          <div>
            <div className="mb-2">上传中... {uploadProgress}%</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              拖放PDF文件到此处，或者
              <span className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                点击选择文件
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-500">仅支持PDF文件，最大50MB</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFUpload; 