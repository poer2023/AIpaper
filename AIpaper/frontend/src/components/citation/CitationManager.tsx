'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { searchCitations, formatCitation as formatCitationText } from '@/services/citationService';

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
}

interface CitationManagerProps {
  onCitationInsert: (citation: Citation) => void;
  citationStyle: 'apa' | 'mla' | 'gb-t-7714';
  onCitationStyleChange: (style: 'apa' | 'mla' | 'gb-t-7714') => void;
}

export function CitationManager({
  onCitationInsert,
  citationStyle,
  onCitationStyleChange
}: CitationManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [addedCitations, setAddedCitations] = useState<Citation[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const results = await searchCitations({ query: searchQuery });
      setSearchResults(results);
    } catch (error) {
      console.error('搜索引用时出错:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addCitation = (citation: Citation) => {
    if (!addedCitations.some(c => c.id === citation.id)) {
      setAddedCitations(prev => [...prev, citation]);
      onCitationInsert(citation);
    }
  };

  const formatCitation = (citation: Citation): string => {
    return formatCitationText(citation, citationStyle);
  };

  return (
    <div className="citation-manager p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">引用管理</h2>
      
      <div className="mb-4">
        <div className="flex space-x-2">
          <select
            className="p-2 border rounded"
            value={citationStyle}
            onChange={(e) => onCitationStyleChange(e.target.value as any)}
          >
            <option value="apa">APA</option>
            <option value="mla">MLA</option>
            <option value="gb-t-7714">GB/T 7714</option>
          </select>
          
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜索文献..."
              className="w-full p-2 pl-8 border rounded"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <button
            className="bg-blue-600 text-white px-3 py-2 rounded"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">搜索结果</h3>
          <ul className="space-y-2">
            {searchResults.map(result => (
              <li key={result.id} className="p-2 border rounded hover:bg-gray-50">
                <div className="flex justify-between">
                  <p className="text-sm">{formatCitation(result)}</p>
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => addCitation(result)}
                  >
                    引用
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {addedCitations.length > 0 && (
        <div>
          <h3 className="text-md font-semibold mb-2">参考文献</h3>
          <ol className="list-decimal list-inside space-y-1">
            {addedCitations.map(citation => (
              <li key={citation.id} className="text-sm">
                {formatCitation(citation)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
} 