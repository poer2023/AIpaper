import { NextRequest, NextResponse } from 'next/server';

// 示例引用数据（真实环境中应从数据库获取）
const mockCitations = [
  {
    id: '1',
    doc_id: 'doc1',
    chunk_id: 'chunk1',
    content: '深度学习已经在许多领域展现出惊人的能力，尤其是在自然语言处理和计算机视觉方面。',
    title: '深度学习：现状与未来',
    authors: '张明, 李华, 王强',
    year: '2022',
    doi: '10.1234/dl.2022.001'
  },
  {
    id: '2',
    doc_id: 'doc1',
    chunk_id: 'chunk2',
    content: 'Transformer架构的出现彻底改变了自然语言处理领域，使得模型能够更好地理解长距离依赖关系。',
    title: '深度学习：现状与未来',
    authors: '张明, 李华, 王强',
    year: '2022',
    doi: '10.1234/dl.2022.001'
  },
  {
    id: '3',
    doc_id: 'doc2',
    chunk_id: 'chunk1',
    content: '卷积神经网络在图像识别任务中取得了突破性进展，超越了人类在某些任务上的表现。',
    title: '计算机视觉的革命',
    authors: '刘伟, 陈亮',
    year: '2021',
    doi: '10.1234/cv.2021.005'
  },
  {
    id: '4',
    doc_id: 'doc3',
    chunk_id: 'chunk1',
    content: '大型语言模型如GPT系列展现了惊人的生成能力，但也面临幻觉和事实准确性等挑战。',
    title: '大型语言模型：挑战与机遇',
    authors: '王丽, 赵强, 林树',
    year: '2023',
    doi: '10.1234/llm.2023.012'
  },
  {
    id: '5',
    doc_id: 'doc4',
    chunk_id: 'chunk1',
    content: '强化学习在游戏和自动驾驶领域的应用取得了显著成功，但将其应用到真实世界仍面临诸多挑战。',
    title: '强化学习的现实应用',
    authors: '马云, 高山',
    year: '2021',
    doi: '10.1234/rl.2021.008'
  },
];

// 简单的向量相似度检索（真实环境中应使用向量数据库）
function searchCitations(query: string, topK: number = 5) {
  // 简化的相似度计算：检查查询词是否出现在内容中
  const results = mockCitations.filter(
    citation => citation.content.toLowerCase().includes(query.toLowerCase())
  );
  
  // 按相关性排序并返回前topK个结果
  return results.slice(0, topK);
}

// 存储已插入的引用（真实环境中应存储在数据库）
let insertedCitations: Map<string, number> = new Map();
let citationCounter = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, top_k = 5 } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: '搜索查询不能为空' },
        { status: 400 }
      );
    }
    
    // 执行搜索
    const results = searchCitations(query, top_k);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('搜索API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 