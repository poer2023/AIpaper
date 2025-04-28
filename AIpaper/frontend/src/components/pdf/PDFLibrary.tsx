import React, { useState, useEffect, useCallback } from 'react';
import PDFUpload from './PDFUpload';

interface PDFInfo {
  pdf_id: string;
  filename: string;
  processed: boolean;
  upload_time: number;
}

interface PDFSearchResult {
  id: string;
  pdf_id: string;
  pdf_title: string;
  page_number: number;
  content: string;
  score: number;
  highlight: {
    start_offset: number;
    end_offset: number;
  };
}

/**
 * PDF知识库组件
 * 显示已上传的PDF文件，支持PDF检索和引用
 */
const PDFLibrary: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PDFSearchResult[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载已上传的PDF列表
  const loadPDFs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pdf/list');
      
      if (!response.ok) {
        throw new Error(`获取PDF列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      setPdfs(data.pdfs || []);
    } catch (error: any) {
      console.error('加载PDF列表出错:', error);
      setError('无法加载PDF列表');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 搜索PDF内容
  const searchPDF = useCallback(async () => {
    if (!selectedPdf || !searchQuery.trim() || searchQuery.length < 3) {
      setError('请选择PDF并输入至少3个字符的搜索内容');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/pdf/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_id: selectedPdf,
          query: searchQuery,
          limit: 10
        }),
      });
      
      if (!response.ok) {
        throw new Error(`搜索PDF失败: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('没有找到匹配的结果');
      } else {
        setError(null);
      }
    } catch (error: any) {
      console.error('搜索PDF出错:', error);
      setError('搜索过程中出错');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPdf, searchQuery]);

  // 处理PDF上传成功
  const handleUploadSuccess = (pdfInfo: { pdf_id: string; filename: string }) => {
    // 重新加载PDF列表
    loadPDFs();
    setError(null);
  };

  // 处理PDF上传错误
  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
  };

  // 格式化显示时间
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // 组件挂载时加载PDF列表
  useEffect(() => {
    loadPDFs();
  }, [loadPDFs]);

  // 高亮显示搜索结果
  const highlightText = (text: string, start: number, end: number) => {
    return (
      <>
        {text.substring(0, start)}
        <span className="bg-yellow-200">{text.substring(start, end)}</span>
        {text.substring(end)}
      </>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-3">PDF知识库</h2>
        <PDFUpload 
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          className="mb-4"
        />
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        {/* PDF列表 */}
        <div className="w-1/3 bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-2">已上传的PDF</h3>
          
          {isLoading && pdfs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">加载中...</div>
          ) : pdfs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">暂无PDF文件</div>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {pdfs.map((pdf) => (
                <li 
                  key={pdf.pdf_id}
                  className={`p-2 rounded cursor-pointer ${
                    selectedPdf === pdf.pdf_id ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedPdf(pdf.pdf_id)}
                >
                  <div className="font-medium truncate">{pdf.filename}</div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{formatDate(pdf.upload_time)}</span>
                    <span className={pdf.processed ? 'text-green-500' : 'text-yellow-500'}>
                      {pdf.processed ? '已处理' : '处理中'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          <button
            className="w-full mt-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            onClick={loadPDFs}
          >
            刷新列表
          </button>
        </div>

        {/* 搜索区域 */}
        <div className="w-2/3 bg-white p-4 rounded-lg border">
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="在选中的PDF中搜索..."
              className="flex-1 border rounded-l px-3 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPdf || isLoading}
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
              onClick={searchPDF}
              disabled={!selectedPdf || isLoading || searchQuery.length < 3}
            >
              搜索
            </button>
          </div>

          {/* 搜索结果 */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="spinner"></div>
                <p className="mt-2 text-gray-500">搜索中...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="space-y-4">
                {searchResults.map((result) => (
                  <li key={result.id} className="border-b pb-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{result.pdf_title}</span>
                      <span className="text-gray-500 text-sm">第 {result.page_number} 页</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {highlightText(
                        result.content,
                        result.highlight.start_offset,
                        result.highlight.end_offset
                      )}
                    </p>
                    <div className="flex justify-end">
                      <button className="text-sm text-blue-500 hover:text-blue-700">
                        添加为引用
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchQuery.length > 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedPdf ? '没有找到匹配的结果' : '请先选择一个PDF文件'}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                选择PDF并输入搜索词以查找内容
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFLibrary; 