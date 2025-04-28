'use client';

import React, { useState, useEffect } from 'react';
import MetadataEditor from '../../../components/MetadataEditor';
import { PDFIcon, DocIcon, TXTIcon } from '../../../components/FileIcons';

// 页面URL参数接口
interface DocumentDetailParams {
  params: {
    id: string;
  };
}

// 文档详情接口
interface DocumentDetail {
  id: string;
  title: string;
  authors: string;
  year?: string;
  doi?: string;
  fileType: string;
  pageCount?: number;
  text?: string;
  uploadDate: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  vectorizationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  chunks?: Array<{
    id: string;
    chunk_index: number;
    content: string;
  }>;
}

const DocumentDetailPage: React.FC<DocumentDetailParams> = ({ params }) => {
  const { id } = params;
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);

  // 获取文档详情
  useEffect(() => {
    const fetchDocumentDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 在实际应用中，应该调用API获取文档详情
        // 这里为了演示，使用模拟数据
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟文档数据
        const mockDocument: DocumentDetail = {
          id,
          title: '文档标题', // 待提取
          authors: '待提取',
          fileType: 'application/pdf',
          uploadDate: new Date(),
          processingStatus: 'pending', // 初始状态为待处理
          vectorizationStatus: 'pending' // 向量化状态初始为待处理
        };
        
        setDocument(mockDocument);
        
        // 自动触发文本提取
        if (mockDocument.processingStatus === 'pending') {
          processDocument(id, mockDocument.fileType);
        }
      } catch (err) {
        console.error('获取文档详情时出错:', err);
        setError('无法加载文档详情。请稍后再试。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentDetail();
  }, [id]);

  // 处理文档（提取文本和元数据）
  const processDocument = async (docId: string, fileType: string) => {
    try {
      setProcessing(true);
      setDocument(prev => prev ? {...prev, processingStatus: 'processing'} : null);
      
      // 调用文本提取API
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: docId,
          file_type: fileType
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '文本提取失败');
      }
      
      // 更新文档信息
      setDocument(prev => {
        if (!prev) return null;
        
        const updatedDoc = {
          ...prev,
          title: data.metadata?.title || prev.title,
          authors: data.metadata?.authors || prev.authors,
          year: data.metadata?.year || prev.year,
          doi: data.metadata?.doi || prev.doi,
          text: data.text,
          pageCount: data.page_count,
          processingStatus: 'completed'
        };
        
        // 如果提取成功，自动开始向量化
        if (updatedDoc.text) {
          vectorizeDocument(docId, updatedDoc.text);
        }
        
        return updatedDoc;
      });
    } catch (err) {
      console.error('处理文档时出错:', err);
      setDocument(prev => prev ? {
        ...prev,
        processingStatus: 'failed',
        errorMessage: err instanceof Error ? err.message : '处理失败'
      } : null);
    } finally {
      setProcessing(false);
    }
  };
  
  // 向量化文档
  const vectorizeDocument = async (docId: string, text: string) => {
    if (!text) return;
    
    try {
      setVectorizing(true);
      setDocument(prev => prev ? {...prev, vectorizationStatus: 'processing'} : null);
      
      // 调用向量化API
      const response = await fetch('/api/vectorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: docId,
          text
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '向量化失败');
      }
      
      // 更新文档信息
      setDocument(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          vectorizationStatus: 'completed',
          chunks: data.chunks
        };
      });
    } catch (err) {
      console.error('向量化文档时出错:', err);
      setDocument(prev => prev ? {
        ...prev,
        vectorizationStatus: 'failed',
        errorMessage: (prev.errorMessage || '') + '\n向量化失败: ' + (err instanceof Error ? err.message : '未知错误')
      } : null);
    } finally {
      setVectorizing(false);
    }
  };

  // 保存元数据
  const handleSaveMetadata = async (docId: string, metadata: any) => {
    try {
      // 在实际应用中，应该调用API保存元数据
      // 这里为了演示，直接更新本地状态
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDocument(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          ...metadata
        };
      });
      
      setShowMetadataEditor(false);
    } catch (err) {
      console.error('保存元数据时出错:', err);
    }
  };

  // 获取文件类型图标
  const getFileIcon = (fileType: string) => {
    const iconClass = 'w-16 h-16';
    
    if (fileType.includes('pdf')) {
      return <PDFIcon className={iconClass} />;
    } else if (fileType.includes('docx') || fileType.includes('document')) {
      return <DocIcon className={iconClass} />;
    } else if (fileType.includes('text/plain')) {
      return <TXTIcon className={iconClass} />;
    } else {
      return <PDFIcon className={iconClass} />;
    }
  };

  // 重试处理
  const handleRetry = () => {
    if (document) {
      if (document.processingStatus === 'failed') {
        processDocument(document.id, document.fileType);
      } else if (document.vectorizationStatus === 'failed' && document.text) {
        vectorizeDocument(document.id, document.text);
      }
    }
  };

  // 渲染处理状态
  const renderProcessingStatus = () => {
    if (!document) return null;
    
    switch (document.processingStatus) {
      case 'pending':
        return (
          <div className="flex items-center text-gray-500">
            <span className="mr-2">●</span>
            <span>待处理</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center text-blue-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span>处理中...</span>
          </div>
        );
      case 'completed':
        if (document.vectorizationStatus === 'pending' || document.vectorizationStatus === 'processing') {
          return (
            <div className="flex items-center text-blue-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span>向量化中...</span>
            </div>
          );
        } else if (document.vectorizationStatus === 'failed') {
          return (
            <div className="flex items-center text-orange-500">
              <span className="mr-2">⚠</span>
              <span>提取完成，向量化失败</span>
              <button
                onClick={handleRetry}
                className="ml-2 text-blue-500 hover:text-blue-700 text-sm underline"
              >
                重试
              </button>
            </div>
          );
        } else {
          return (
            <div className="flex items-center text-green-500">
              <span className="mr-2">✓</span>
              <span>处理完成</span>
            </div>
          );
        }
      case 'failed':
        return (
          <div className="flex items-center text-red-500">
            <span className="mr-2">✗</span>
            <span>处理失败</span>
            <button
              onClick={handleRetry}
              className="ml-2 text-blue-500 hover:text-blue-700 text-sm underline"
            >
              重试
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  // 渲染文档块视图
  const renderChunks = () => {
    if (!document || !document.chunks || document.chunks.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">文档分块 ({document.chunks.length})</h2>
        <div className="space-y-4">
          {document.chunks.map(chunk => (
            <div key={chunk.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-gray-500">
                  块 #{chunk.chunk_index + 1}
                </div>
                <div className="text-xs text-gray-400">
                  ID: {chunk.id}
                </div>
              </div>
              <p className="text-gray-700">{chunk.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">加载文档信息...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p>{error || '文档不存在或已被删除'}</p>
          <a href="/library" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
            返回文献库
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <a href="/library" className="text-blue-500 hover:text-blue-700">
          ← 返回文献库
        </a>
      </div>
      
      {/* 文档头部信息 */}
      <div className="flex items-start mb-8">
        <div className="text-indigo-600 mr-6">
          {getFileIcon(document.fileType)}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{document.title}</h1>
            {renderProcessingStatus()}
          </div>
          
          <p className="text-gray-600 mb-1">{document.authors}</p>
          
          <div className="flex flex-wrap text-sm text-gray-500">
            {document.year && <span className="mr-4">发表年份: {document.year}</span>}
            {document.doi && <span className="mr-4">DOI: {document.doi}</span>}
            {document.pageCount && <span className="mr-4">{document.pageCount} 页</span>}
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => setShowMetadataEditor(true)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              编辑元数据
            </button>
          </div>
        </div>
      </div>
      
      {/* 元数据编辑器 */}
      {showMetadataEditor && (
        <div className="mb-8">
          <MetadataEditor
            initialMetadata={{
              title: document.title,
              authors: document.authors,
              year: document.year,
              doi: document.doi
            }}
            documentId={document.id}
            onSave={handleSaveMetadata}
            onCancel={() => setShowMetadataEditor(false)}
          />
        </div>
      )}
      
      {/* 错误信息 */}
      {(document.processingStatus === 'failed' || document.vectorizationStatus === 'failed') && document.errorMessage && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">处理文档时出错:</p>
          <p className="whitespace-pre-line">{document.errorMessage}</p>
        </div>
      )}
      
      {/* 文本内容 */}
      {document.text && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">文档内容</h2>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 max-h-[600px] overflow-y-auto">
            <p className="whitespace-pre-line">{document.text}</p>
          </div>
        </div>
      )}
      
      {/* 处理中状态 */}
      {document.processingStatus === 'processing' && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">正在处理文档，提取文本和元数据...</p>
          <p className="text-sm text-gray-500 mt-2">这可能需要几秒钟时间，请耐心等待</p>
        </div>
      )}
      
      {/* 向量化中状态 */}
      {document.vectorizationStatus === 'processing' && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">正在向量化文档内容...</p>
          <p className="text-sm text-gray-500 mt-2">这可能需要几秒钟时间，请耐心等待</p>
        </div>
      )}
      
      {/* 文档分块视图 */}
      {document.vectorizationStatus === 'completed' && renderChunks()}
      
      {/* 生成引用按钮 */}
      {document.processingStatus === 'completed' && document.vectorizationStatus === 'completed' && (
        <div className="mt-8 flex justify-end">
          <a
            href="/edit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            使用此文献编写文档
          </a>
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage; 