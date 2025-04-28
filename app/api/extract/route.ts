import { NextRequest, NextResponse } from 'next/server';

// 模拟文档提取结果
interface ExtractionResult {
  success: boolean;
  documentId: string;
  text?: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    authors?: string;
    year?: string;
    doi?: string;
  };
  error?: string;
  errorCode?: string;
}

// 模拟文档提取过程
async function extractDocumentContent(documentId: string, fileType: string): Promise<ExtractionResult> {
  // 在实际应用中，这里应该根据文件类型调用不同的提取逻辑
  // PDF: PyPDF2, DOCX: python-docx, TXT: 直接读取
  
  // 为演示目的，这里使用模拟数据
  const mockExtractionResults: Record<string, ExtractionResult> = {
    // 正常PDF
    'pdf-doc-1': {
      success: true,
      documentId: 'pdf-doc-1',
      text: '这是从PDF中提取的文本内容。深度学习已经在许多领域展现出惊人的能力，尤其是在自然语言处理和计算机视觉方面。',
      pageCount: 28,
      metadata: {
        title: '深度学习：现状与未来',
        authors: '张明, 李华, 王强',
        year: '2022',
        doi: '10.1234/dl.2022.001'
      }
    },
    // 扫描版PDF
    'pdf-doc-2': {
      success: false,
      documentId: 'pdf-doc-2',
      error: '无法提取扫描版PDF的文本内容',
      errorCode: 'scanned_not_supported'
    },
    // DOCX文件
    'docx-doc-1': {
      success: true,
      documentId: 'docx-doc-1',
      text: '这是从DOCX中提取的文本内容。大型语言模型如GPT系列展现了惊人的生成能力，但也面临幻觉和事实准确性等挑战。',
      pageCount: 17,
      metadata: {
        title: '大型语言模型：挑战与机遇',
        authors: '王丽, 赵强, 林树',
        year: '2023',
        doi: '10.1234/llm.2023.012'
      }
    },
    // TXT文件
    'txt-doc-1': {
      success: true,
      documentId: 'txt-doc-1',
      text: '这是从TXT中提取的文本内容。强化学习在游戏和自动驾驶领域的应用取得了显著成功，但将其应用到真实世界仍面临诸多挑战。',
      pageCount: 12,
      metadata: {
        title: '强化学习的现实应用',
        authors: '马云, 高山',
        year: '2021'
      }
    }
  };

  // 模拟延时，模拟实际处理时间
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 返回模拟结果或默认结果
  return mockExtractionResults[documentId] || {
    success: true,
    documentId,
    text: `这是从${fileType}文件中提取的示例文本内容。`,
    pageCount: Math.floor(Math.random() * 30) + 1,
    metadata: {
      title: '未能自动提取标题',
      authors: '未知作者'
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document_id, file_type } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: '缺少必要参数document_id' },
        { status: 400 }
      );
    }

    // 处理文本提取
    const extractionResult = await extractDocumentContent(
      document_id,
      file_type || 'application/pdf'
    );

    if (!extractionResult.success) {
      // 如果提取失败，返回特定错误
      return NextResponse.json(
        {
          success: false,
          error: extractionResult.error,
          error_code: extractionResult.errorCode
        },
        { status: extractionResult.errorCode === 'scanned_not_supported' ? 415 : 500 }
      );
    }

    // 成功提取文本
    return NextResponse.json({
      success: true,
      document_id: extractionResult.documentId,
      text: extractionResult.text,
      page_count: extractionResult.pageCount,
      metadata: extractionResult.metadata
    });
  } catch (error) {
    console.error('文本提取错误:', error);
    
    return NextResponse.json(
      { error: '处理文本提取请求时出错' },
      { status: 500 }
    );
  }
} 