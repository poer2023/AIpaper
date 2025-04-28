import { NextRequest, NextResponse } from 'next/server';

// 模拟向量化结果
interface ChunkData {
  id: string;
  doc_id: string;
  chunk_index: number;
  content: string;
  vector: number[]; // 实际应用中这是向量值
}

// 模拟文档切片和向量化过程
async function chunkAndVectorizeDocument(docId: string, text: string): Promise<ChunkData[]> {
  // 在实际应用中，应该：
  // 1. 将文本分成约300词的段落
  // 2. 对每个段落生成向量嵌入
  // 3. 将结果存储到向量数据库如Qdrant
  
  if (!text) {
    throw new Error('没有要处理的文本内容');
  }
  
  // 模拟文本分段（简单按换行符分割，实际应该有更复杂的逻辑）
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  // 确保至少有一个段落
  if (paragraphs.length === 0) {
    paragraphs.push(text);
  }
  
  // 模拟嵌入生成
  // 在真实环境中，应该使用模型生成向量：
  // 例如使用 OpenAI 的 text-embedding-3-small 生成
  const mockEmbedding = () => {
    // 生成一个768维的随机向量（模拟text-embedding-3-small的尺寸）
    return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
  };
  
  // 模拟延迟，模拟实际处理时间
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 返回生成的数据
  return paragraphs.map((content, index) => ({
    id: `${docId}-chunk-${index}`,
    doc_id: docId,
    chunk_index: index,
    content,
    vector: mockEmbedding()
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document_id, text } = body;
    
    if (!document_id) {
      return NextResponse.json(
        { error: '缺少必要参数document_id' },
        { status: 400 }
      );
    }
    
    if (!text) {
      return NextResponse.json(
        { error: '缺少待处理的文本内容' },
        { status: 400 }
      );
    }
    
    // 执行文档切片和向量化
    const chunks = await chunkAndVectorizeDocument(document_id, text);
    
    // 返回处理结果（只返回ID和内容，不返回向量以减少数据量）
    return NextResponse.json({
      success: true,
      document_id,
      chunk_count: chunks.length,
      chunks: chunks.map(({ id, chunk_index, content }) => ({
        id,
        chunk_index,
        content
      }))
    });
  } catch (error) {
    console.error('向量化处理错误:', error);
    
    return NextResponse.json(
      { error: '处理向量化请求时出错', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 