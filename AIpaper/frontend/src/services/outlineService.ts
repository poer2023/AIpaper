import { API_PATHS, OutlineRequest, OutlineResponse } from '@/types/api';
import { OutlineItemData } from '@/components/outline/OutlineList';
import { v4 as uuidv4 } from 'uuid';

/**
 * 大纲生成服务
 */

/**
 * 生成大纲参数
 */
export interface GenerateOutlineParams {
  title: string;
  partialContent?: string;
  outlineDepth?: number;
}

/**
 * 生成文档大纲
 * @param params 大纲生成参数
 * @returns Promise<OutlineItemData[]> 大纲项数组
 */
export async function generateOutline(params: GenerateOutlineParams): Promise<OutlineItemData[]> {
  try {
    // 调用后端API
    const response = await fetch(API_PATHS.AI.OUTLINE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        partial_content: params.partialContent,
        outline_depth: params.outlineDepth || 2,
      } as OutlineRequest),
    });
    
    if (!response.ok) {
      throw new Error(`生成大纲失败: ${response.status}`);
    }
    
    const data: OutlineResponse = await response.json();
    
    // 将API响应转换为前端大纲格式
    const outlineItems: OutlineItemData[] = [];
    
    // 扁平化处理大纲项
    const processOutlineItems = (items: any[], parentId?: string) => {
      items.forEach(item => {
        outlineItems.push({
          id: item.id || uuidv4(),
          content: item.title,
          level: item.level
        });
        
        if (item.children && item.children.length > 0) {
          processOutlineItems(item.children, item.id);
        }
      });
    };
    
    processOutlineItems(data.outline);
    
    return outlineItems;
  } catch (error: any) {
    console.error('生成大纲时出错:', error);
    throw error;
  }
}

/**
 * 从编辑器内容中提取标题
 * @param editorContent 编辑器内容
 * @returns string 提取的标题
 */
export function extractTitleFromContent(editorContent: string): string {
  // 尝试找到第一行作为标题
  const lines = editorContent.split('\n');
  
  // 过滤掉空行
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  
  if (nonEmptyLines.length > 0) {
    // 返回第一个非空行作为标题
    return nonEmptyLines[0].replace(/^#+\s+/, '').trim();
  }
  
  return '未命名文档';
} 