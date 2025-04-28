import { Citation } from '@/components/citation';
import { API_PATHS, CitationSearchResponse } from '@/types/api';

/**
 * 引用服务 - 提供对Crossref和Semantic Scholar API的访问
 */

// 搜索结果接口
export interface SearchResult {
  items: Citation[];
  totalResults: number;
}

// 搜索来源类型
export type SearchSource = 'crossref' | 'semanticscholar' | 'local';

// 引用API接口
const API_URL = '/api';

export interface SearchCitationParams {
  query: string;
  limit?: number;
}

/**
 * 搜索引用
 * @param params 搜索参数
 * @returns Promise<Citation[]> 引用数组
 */
export async function searchCitations(params: SearchCitationParams): Promise<Citation[]> {
  try {
    // 调用后端API
    const response = await fetch(
      `/api/references/search?query=${encodeURIComponent(params.query)}&limit=${params.limit || 10}`
    );
    
    if (!response.ok) {
      throw new Error(`搜索引用失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 将后端返回的结果转换为前端Citation类型
    return data.results.map((item: any) => ({
      id: item.id || item.doi || `${Date.now()}-${Math.random()}`,
      title: item.title || '',
      authors: item.authors || [],
      year: item.year || new Date().getFullYear(),
      journal: item.journal || item.venue || '',
      doi: item.doi || '',
      url: item.url || '',
    }));
  } catch (error: any) {
    console.error('搜索引用时出错:', error);
    // 出错时返回空数组
    return [];
  }
}

/**
 * 通过DOI获取引用详情
 * @param doi DOI标识符
 * @returns Promise<Citation> 引用详情
 */
export async function getCitationByDoi(doi: string): Promise<Citation | null> {
  try {
    const response = await fetch(`/api/references/search?query=${encodeURIComponent(doi)}&limit=1`);
    
    if (!response.ok) {
      throw new Error(`获取引用详情失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      return {
        id: item.id || item.doi || `${Date.now()}-${Math.random()}`,
        title: item.title || '',
        authors: item.authors || [],
        year: item.year || new Date().getFullYear(),
        journal: item.journal || item.venue || '',
        doi: item.doi || '',
        url: item.url || '',
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('获取引用详情时出错:', error);
    return null;
  }
}

/**
 * 格式化引用为指定样式
 * @param citation 引用数据
 * @param style 引用样式 (apa, mla, gb-t-7714)
 * @returns Promise<string> 格式化后的引用文本
 */
export async function formatCitation(citation: Citation, style: 'apa' | 'mla' | 'gb-t-7714'): Promise<string> {
  try {
    // 将gb-t-7714转换为后端接受的格式
    const backendStyle = style === 'gb-t-7714' ? 'gb' : style;
    
    const response = await fetch('/api/references/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: citation,
        style: backendStyle
      }),
    });
    
    if (!response.ok) {
      throw new Error(`格式化引用失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.formatted;
  } catch (error: any) {
    console.error('格式化引用时出错:', error);
    
    // 如果API调用失败，回退到本地格式化
    switch (style) {
      case 'apa':
        return `${citation.authors.join(', ')}. (${citation.year}). ${citation.title}. ${citation.journal || ''}.`;
        
      case 'mla':
        return `${citation.authors.join(', ')}. "${citation.title}." ${citation.journal || ''}, ${citation.year}.`;
        
      case 'gb-t-7714':
        return `${citation.authors.join(', ')}. ${citation.title}[J]. ${citation.journal || ''}, ${citation.year}.`;
        
      default:
        return `${citation.authors.join(', ')}. (${citation.year}). ${citation.title}.`;
    }
  }
}

// 模拟数据生成函数
function getMockSearchResults(query: string, source: SearchSource): SearchResult {
  // 模拟搜索结果
  const mockItems: Citation[] = [
    {
      id: '1',
      title: `人工智能在${query}研究中的应用`,
      authors: ['张三', '李四'],
      year: 2023,
      journal: '计算机科学与技术',
      doi: '10.1234/5678'
    },
    {
      id: '2',
      title: `基于深度学习的${query}分析`,
      authors: ['王五'],
      year: 2022,
      journal: '人工智能学报',
      doi: '10.5678/1234'
    },
    {
      id: '3',
      title: `${query}的研究现状与展望`,
      authors: ['赵六', '钱七'],
      year: 2021,
      journal: '科学通报',
      doi: '10.9876/5432'
    }
  ];

  // 模拟不同来源返回不同结果
  if (source === 'semanticscholar') {
    mockItems.push({
      id: '4',
      title: `Semantic Scholar关于${query}的研究`,
      authors: ['John Doe', 'Jane Smith'],
      year: 2023,
      journal: 'Journal of AI Research',
      doi: '10.1111/2222',
      url: 'https://semanticscholar.org/paper/123'
    });
  } else if (source === 'local') {
    mockItems.push({
      id: '5',
      title: `本地PDF: ${query}相关研究`,
      authors: ['本地作者'],
      year: 2022,
      journal: '上传的PDF文档',
    });
  }

  return {
    items: mockItems,
    totalResults: mockItems.length
  };
} 