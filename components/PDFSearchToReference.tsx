import React, { useState } from 'react';

interface Citation {
  id: string;
  title: string;
  authors: string[];
  year?: string;
  doi?: string;
  journal?: string;
  abstract?: string;
  content: string;
  source_type: string;
  source_id: string;
  page_number?: number;
  relevance_score?: number;
}

interface PDFInfo {
  id: string;
  filename: string;
  title?: string;
  is_indexed: boolean;
}

interface PDFSearchToReferenceProps {
  onAddCitation: (citation: Citation) => void;
}

export default function PDFSearchToReference({ onAddCitation }: PDFSearchToReferenceProps) {
  const [pdfs, setPDFs] = useState<PDFInfo[]>([]);
  const [selectedPDFs, setSelectedPDFs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfListLoading, setPDFListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载PDF列表
  const loadPDFs = async () => {
    setPDFListLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pdf/list');
      
      if (!response.ok) {
        throw new Error(`获取PDF列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      setPDFs(data.pdfs || []);
    } catch (err) {
      console.error('获取PDF列表时出错:', err);
      setError(err instanceof Error ? err.message : '获取PDF列表失败');
    } finally {
      setPDFListLoading(false);
    }
  };

  // 初始化时加载PDF列表
  React.useEffect(() => {
    loadPDFs();
  }, []);

  // 切换选中的PDF
  const togglePDFSelection = (pdfId: string) => {
    setSelectedPDFs(prev => {
      if (prev.includes(pdfId)) {
        return prev.filter(id => id !== pdfId);
      } else {
        return [...prev, pdfId];
      }
    });
  };

  // 搜索PDF并获取引用
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    // 如果没有选择PDF，使用所有PDF
    const pdfIds = selectedPDFs.length > 0 ? selectedPDFs : pdfs.map(pdf => pdf.id);
    
    setLoading(true);
    setError(null);
    setCitations([]);
    
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        query: searchQuery.trim()
      });
      
      // 添加PDF IDs
      pdfIds.forEach(id => {
        params.append('pdf_ids', id);
      });
      
      const response = await fetch(`/api/pdf/bulk-search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`搜索PDF失败: ${response.status}`);
      }
      
      const data = await response.json();
      setCitations(data.citations || []);
    } catch (err) {
      console.error('搜索PDF时出错:', err);
      setError(err instanceof Error ? err.message : '搜索PDF失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加为引用
  const handleAddCitation = (citation: Citation) => {
    onAddCitation(citation);
  };

  // 搜索单个PDF
  const handleSearchSinglePDF = async (pdfId: string) => {
    if (!searchQuery.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setCitations([]);
    
    try {
      const response = await fetch(`/api/pdf/search-to-citation/${pdfId}?query=${encodeURIComponent(searchQuery.trim())}`);
      
      if (!response.ok) {
        throw new Error(`搜索PDF失败: ${response.status}`);
      }
      
      const data = await response.json();
      setCitations(data.citations || []);
    } catch (err) {
      console.error('搜索PDF时出错:', err);
      setError(err instanceof Error ? err.message : '搜索PDF失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">PDF检索与引用</h2>
      </div>
      
      {/* 搜索框 */}
      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="pdf-search" className="block text-sm font-medium text-gray-700 mb-1">
            搜索PDF内容
          </label>
          <div className="flex">
            <input
              type="text"
              id="pdf-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入关键词搜索PDF内容..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>
        
        {/* PDF选择列表 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">选择要搜索的PDF</h3>
            <button
              onClick={loadPDFs}
              disabled={pdfListLoading}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              {pdfListLoading ? '加载中...' : '刷新列表'}
            </button>
          </div>
          
          {pdfListLoading ? (
            <div className="py-2 text-center text-gray-500 text-sm">
              加载PDF列表...
            </div>
          ) : pdfs.length === 0 ? (
            <div className="py-2 text-center text-gray-500 text-sm">
              没有找到PDF，请先上传
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {pdfs.map(pdf => (
                <div
                  key={pdf.id}
                  className={`
                    p-2 flex items-center border-b last:border-b-0 hover:bg-gray-50 cursor-pointer
                    ${selectedPDFs.includes(pdf.id) ? 'bg-indigo-50' : ''}
                  `}
                  onClick={() => togglePDFSelection(pdf.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedPDFs.includes(pdf.id)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{pdf.title || pdf.filename}</div>
                    {pdf.title && <div className="text-xs text-gray-500">{pdf.filename}</div>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchSinglePDF(pdf.id);
                    }}
                    disabled={loading || !searchQuery.trim()}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    单独搜索
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 搜索结果 */}
      <div className="p-4 border-t">
        <h3 className="text-md font-semibold mb-2">搜索结果</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="py-4 text-center text-gray-500">
            <div className="spinner inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm">搜索中，请稍候...</p>
          </div>
        ) : citations.length === 0 ? (
          <div className="py-4 text-center text-gray-500 text-sm">
            {error ? '搜索出错' : '暂无搜索结果'}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
            {citations.map((citation, index) => (
              <div key={`${citation.id}-${index}`} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{citation.title}</h4>
                  <button
                    onClick={() => handleAddCitation(citation)}
                    className="ml-2 px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                  >
                    添加为引用
                  </button>
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  {citation.authors && citation.authors.length > 0 ? citation.authors.join(', ') : '未知作者'}
                  {citation.year && <span> ({citation.year})</span>}
                  {citation.journal && <span> - {citation.journal}</span>}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {citation.source_type === 'pdf' && (
                    <span>PDF来源 {citation.page_number && <span>- 第{citation.page_number}页</span>}</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 line-clamp-3">
                  {citation.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 