/**
 * API路径常量
 */
export const API_PATHS = {
  REFERENCES: {
    SEARCH: '/api/references/search',
    FORMAT: '/api/references/format',
    BATCH_FORMAT: '/api/references/batch-format',
  },
  AI: {
    COMPLETION: '/api/ai/completion',
    OUTLINE: '/api/ai/outline',
  },
  DOCUMENT: {
    SAVE: '/api/documents/save',
    GET: '/api/documents/get',
    VERSIONS: '/api/documents/versions',
  },
  PDF: {
    UPLOAD: '/api/pdf/upload',
    SEARCH: '/api/pdf/search',
    EXTRACT: '/api/pdf/extract',
  }
};

/**
 * 引用搜索API响应
 */
export interface ReferenceSearchResponse {
  results: Array<{
    id?: string;
    title: string;
    authors: string[];
    year: number;
    journal?: string;
    venue?: string;
    doi?: string;
    url?: string;
    abstract?: string;
  }>;
  count: number;
}

/**
 * 引用格式化请求
 */
export interface ReferenceFormatRequest {
  reference: {
    id?: string;
    title: string;
    authors: string[];
    year: number;
    journal?: string;
    venue?: string;
    doi?: string;
    url?: string;
  };
  style: 'apa' | 'mla' | 'gb';
}

/**
 * 引用格式化响应
 */
export interface ReferenceFormatResponse {
  formatted: string;
}

/**
 * 大纲生成请求
 */
export interface OutlineRequest {
  title: string;
  partial_content?: string;
  outline_depth?: number;
}

/**
 * 大纲生成响应
 */
export interface OutlineResponse {
  outline: Array<{
    id: string;
    title: string;
    level: number;
    children?: Array<{
      id: string;
      title: string;
      level: number;
      children?: Array<any>;
    }>;
  }>;
}

/**
 * AI补全请求
 */
export interface CompletionRequest {
  prompt: string;
  document_id?: number;
  max_tokens?: number;
  temperature?: number;
  command?: 'continue' | 'rewrite';
}

/**
 * AI补全响应
 */
export interface CompletionResponse {
  completion: string;
}

/**
 * PDF搜索请求
 */
export interface PDFSearchRequest {
  query: string;
  pdf_ids?: string[];
  limit?: number;
}

/**
 * PDF搜索响应
 */
export interface PDFSearchResponse {
  results: Array<{
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
  }>;
  count: number;
}

/**
 * PDF元数据提取响应
 */
export interface PDFExtractResponse {
  title?: string;
  authors?: string[];
  abstract?: string;
  year?: number;
  doi?: string;
  journal?: string;
  keywords?: string[];
} 