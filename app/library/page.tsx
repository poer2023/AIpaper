'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '../../components/FileUpload';
import DocumentCard from '../../components/DocumentCard';

interface Document {
  id: string;
  title: string;
  authors: string;
  year?: string;
  fileType: string;
  pageCount?: number;
  uploadDate: Date;
  doi?: string;
}

const LibraryPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户的文献库
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 暂时使用模拟数据，实际应用中应从 API 获取
        const response = await fetch('/api/library');
        
        if (!response.ok) {
          throw new Error('获取文献列表失败');
        }
        
        const data = await response.json();
        
        // 处理日期格式
        const formattedData = data.documents.map((doc: any) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate || doc.created_at)
        }));
        
        setDocuments(formattedData);
      } catch (err) {
        console.error('获取文献列表时出错:', err);
        setError('无法加载您的文献库。请稍后再试。');
        
        // 使用示例数据作为后备
        setDocuments(getSampleDocuments());
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // 处理上传成功
  const handleUploadSuccess = (docId: string, fileInfo: any) => {
    // 在实际应用中，应刷新整个文献列表
    // 这里为了演示，直接添加一个新条目
    const newDocument: Document = {
      id: docId,
      title: fileInfo.filename,
      authors: '待提取',
      fileType: fileInfo.type,
      uploadDate: new Date(),
    };
    
    setDocuments([newDocument, ...documents]);
    setShowUploadForm(false);
  };

  // 处理上传错误
  const handleUploadError = (error: string) => {
    setError(`上传失败: ${error}`);
  };

  // 处理文献卡片点击
  const handleDocumentClick = (id: string) => {
    // 这里可以实现导航到文献详情页或其他操作
    console.log('文献点击:', id);
  };

  // 生成示例文献数据（仅用于演示）
  const getSampleDocuments = (): Document[] => {
    return [
      {
        id: '1',
        title: '深度学习：现状与未来',
        authors: '张明, 李华, 王强',
        year: '2022',
        fileType: 'pdf',
        pageCount: 28,
        uploadDate: new Date(2022, 11, 15),
        doi: '10.1234/dl.2022.001'
      },
      {
        id: '2',
        title: '计算机视觉的革命',
        authors: '刘伟, 陈亮',
        year: '2021',
        fileType: 'pdf',
        pageCount: 42,
        uploadDate: new Date(2021, 8, 3),
        doi: '10.1234/cv.2021.005'
      },
      {
        id: '3',
        title: '大型语言模型：挑战与机遇',
        authors: '王丽, 赵强, 林树',
        year: '2023',
        fileType: 'docx',
        pageCount: 17,
        uploadDate: new Date(2023, 2, 21),
        doi: '10.1234/llm.2023.012'
      },
      {
        id: '4',
        title: '强化学习的现实应用',
        authors: '马云, 高山',
        year: '2021',
        fileType: 'txt',
        pageCount: 12,
        uploadDate: new Date(2021, 5, 8),
        doi: '10.1234/rl.2021.008'
      }
    ];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">我的文献库</h1>
        
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? '取消上传' : '上传文献'}
        </button>
      </div>

      {/* 上传表单 */}
      {showUploadForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">上传新文献</h2>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">加载文献库...</p>
        </div>
      )}

      {/* 文献列表为空 */}
      {!isLoading && documents.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有文献</h3>
          <p className="text-gray-500 mb-6">
            您的文献库目前是空的。上传一些PDF、DOCX或TXT文件以开始构建您的文献库。
          </p>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowUploadForm(true)}
          >
            上传文献
          </button>
        </div>
      )}

      {/* 文献卡片网格 */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              authors={doc.authors}
              year={doc.year}
              fileType={doc.fileType}
              pageCount={doc.pageCount}
              uploadDate={doc.uploadDate}
              onClick={handleDocumentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryPage; 