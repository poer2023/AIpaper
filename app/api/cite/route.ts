import { NextRequest, NextResponse } from 'next/server';

// 存储已插入的引用（真实环境中应存储在数据库）
// 格式：citation_id => citation_number
let insertedCitations: Map<string, number> = new Map();
let citationCounter = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { citation_id } = body;
    
    if (!citation_id) {
      return NextResponse.json(
        { error: '引用ID不能为空' },
        { status: 400 }
      );
    }
    
    // 检查引用是否已存在，实现引用去重
    let citationNumber: number;
    if (insertedCitations.has(citation_id)) {
      // 如果已存在，返回现有编号
      citationNumber = insertedCitations.get(citation_id) as number;
    } else {
      // 如果不存在，创建新编号
      citationNumber = citationCounter++;
      insertedCitations.set(citation_id, citationNumber);
    }
    
    return NextResponse.json({
      citation_id,
      citation_number: citationNumber,
      is_new: !insertedCitations.has(citation_id),
      total_citations: insertedCitations.size
    });
  } catch (error) {
    console.error('引用API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 