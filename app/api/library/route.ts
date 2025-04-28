import { NextRequest, NextResponse } from 'next/server';

// 模拟数据库中的文献数据
const mockDocuments = [
  {
    id: '1',
    title: '深度学习：现状与未来',
    authors: '张明, 李华, 王强',
    year: '2022',
    fileType: 'application/pdf',
    pageCount: 28,
    uploadDate: '2022-12-15T10:30:00Z',
    doi: '10.1234/dl.2022.001',
    user_id: 'user1'
  },
  {
    id: '2',
    title: '计算机视觉的革命',
    authors: '刘伟, 陈亮',
    year: '2021',
    fileType: 'application/pdf',
    pageCount: 42,
    uploadDate: '2021-09-03T15:45:00Z',
    doi: '10.1234/cv.2021.005',
    user_id: 'user1'
  },
  {
    id: '3',
    title: '大型语言模型：挑战与机遇',
    authors: '王丽, 赵强, 林树',
    year: '2023',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pageCount: 17,
    uploadDate: '2023-03-21T09:15:00Z',
    doi: '10.1234/llm.2023.012',
    user_id: 'user1'
  },
  {
    id: '4',
    title: '强化学习的现实应用',
    authors: '马云, 高山',
    year: '2021',
    fileType: 'text/plain',
    pageCount: 12,
    uploadDate: '2021-06-08T13:20:00Z',
    doi: '10.1234/rl.2021.008',
    user_id: 'user1'
  }
];

export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('user_id') || 'user1'; // 默认用户ID

    // 在实际应用中，这里应该查询数据库
    // 这里为了演示，使用模拟数据
    
    // 模拟分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // 获取当前用户的文献
    const userDocuments = mockDocuments.filter(doc => doc.user_id === userId);
    const paginatedDocuments = userDocuments.slice(startIndex, endIndex);
    
    // 计算总数和总页数
    const totalDocuments = userDocuments.length;
    const totalPages = Math.ceil(totalDocuments / limit);
    
    return NextResponse.json({
      documents: paginatedDocuments,
      pagination: {
        total: totalDocuments,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('获取文献列表错误:', error);
    
    return NextResponse.json(
      { error: '获取文献列表失败' },
      { status: 500 }
    );
  }
} 