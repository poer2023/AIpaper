import React, { useState } from 'react';

interface Citation {
  id: string;
  doc_id: string;
  chunk_id: string;
  content: string;
  title?: string;
  authors?: string;
  year?: string;
  doi?: string;
}

interface CitationManagerProps {
  onInsertCitation?: (citationId: string) => void;
}

const CitationManager: React.FC<CitationManagerProps> = ({ onInsertCitation }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentCitations, setDocumentCitations] = useState<Citation[]>([]);

  // 搜索引用
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // 调用API搜索相关chunk
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          top_k: 5 // 根据PRD要求返回Top-k=5
        }),
      });
      
      if (!response.ok) {
        throw new Error('搜索请求失败');
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('搜索引用时出错:', error);
      // 实际应用中应添加错误提示UI
    } finally {
      setLoading(false);
    }
  };

  // 添加引用
  const addCitation = async (citation: Citation) => {
    try {
      // 调用API获取/生成引用编号
      const response = await fetch('/api/cite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citation_id: `${citation.doc_id}#${citation.chunk_id}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('添加引用请求失败');
      }
      
      const data = await response.json();
      
      // 更新文档引用列表
      if (!documentCitations.some(c => c.id === citation.id)) {
        setDocumentCitations([...documentCitations, citation]);
      }
      
      // 通知父组件插入引用标记
      if (onInsertCitation) {
        onInsertCitation(data.citation_number.toString());
      }
    } catch (error) {
      console.error('添加引用时出错:', error);
    }
  };

  // 删除引用
  const removeCitation = (citationId: string) => {
    setDocumentCitations(documentCitations.filter(c => c.id !== citationId));
    // 实际应用中，可能还需要调用API更新后端
  };

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-lg font-semibold mb-4">引用管理</h2>
      
      {/* 引用搜索输入框 */}
      <div className="mb-4">
        <label htmlFor="citation-search" className="block text-sm font-medium text-gray-700 mb-1">
          搜索引用
        </label>
        <div className="flex">
          <input
            type="text"
            id="citation-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词进行搜索..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>

      {/* 引用搜索结果区域 */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">搜索结果</h3>
        <div className="h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">
              {loading ? '正在搜索...' : '无搜索结果，请尝试其他关键词'}
            </p>
          ) : (
            searchResults.map((result) => (
              <div key={result.id} className="p-2 border-b hover:bg-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{result.title || '未知标题'}</p>
                  <p className="text-xs text-gray-600">
                    {result.authors || '未知作者'} ({result.year || 'N/A'})
                    {result.doi && <span className="ml-1">DOI: {result.doi}</span>}
                  </p>
                  <p className="text-xs mt-1 text-gray-700 line-clamp-2">{result.content}</p>
                </div>
                <button
                  onClick={() => addCitation(result)}
                  className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  引用
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 当前文档引用列表 */}
      <div>
        <h3 className="text-md font-semibold mb-2">文档引用</h3>
        <div className="h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
          {documentCitations.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">尚未添加任何引用</p>
          ) : (
            documentCitations.map((citation) => (
              <div key={citation.id} className="flex justify-between items-center p-2 border-b">
                <div className="flex-1">
                  <p className="text-sm">{citation.title || '未知文献'} - {citation.authors || '未知作者'} ({citation.year || 'N/A'})</p>
                </div>
                <button
                  onClick={() => removeCitation(citation.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  移除
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 格式化选项 */}
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2">格式化选项</h3>
        <select
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          defaultValue="apa"
        >
          <option value="apa">APA格式</option>
          <option value="mla">MLA格式</option>
          <option value="chicago">Chicago格式</option>
          <option value="harvard">Harvard格式</option>
          <option value="ieee">IEEE格式</option>
        </select>
      </div>
    </div>
  );
};

export default CitationManager; 