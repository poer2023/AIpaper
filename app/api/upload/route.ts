import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 文件上传配置
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export async function POST(req: NextRequest) {
  try {
    // 获取原始请求数据
    const formData = await req.formData();
    const file = formData.get('file') as File;

    // 检查文件是否存在
    if (!file) {
      return NextResponse.json(
        { error: '没有文件被上传' },
        { status: 400 }
      );
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件过大。最大支持10MB的文件。' },
        { status: 413 }
      );
    }

    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型。请上传PDF、DOCX或TXT文件。' },
        { status: 415 }
      );
    }

    // 生成唯一文件ID和文件路径
    const docId = uuidv4();
    const fileName = `${docId}-${file.name}`;
    
    // 在生产环境中，这里应该保存到云存储或数据库
    // 这里为了演示，我们假设已经保存了文件，直接返回成功
    // 在实际应用中，以下是保存到本地的示例代码：
    /*
    const filePath = join(process.cwd(), 'uploads', fileName);
    const fileBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(fileBuffer));
    */

    // 这里应该将文件元数据保存到数据库
    // 包括 docId, 原始文件名, 大小, 用户ID等
    
    // 成功响应，返回文档ID
    return NextResponse.json({
      success: true,
      doc_id: docId,
      message: '文件上传成功'
    }, { status: 200 });
  } catch (error) {
    console.error('文件上传错误:', error);
    
    return NextResponse.json(
      { error: '处理文件时出错' },
      { status: 500 }
    );
  }
} 