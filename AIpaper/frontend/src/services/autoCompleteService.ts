import { API_PATHS, DocumentCompleteRequest, DocumentCompleteResponse } from '@/types/api';

/**
 * 自动补全接口参数
 */
export interface AutoCompleteParams {
  content: string;    // 当前文档内容
  cursorPosition: number;  // 光标位置
  command?: 'continue' | 'rewrite';  // 命令类型
  documentId?: string;  // 文档ID
}

/**
 * 自动补全结果
 */
export interface AutoCompleteResult {
  completion: string;  // 补全文本
  cursorPosition: number;  // 补全后的光标位置
}

/**
 * 获取AI自动补全内容（非流式）
 * @param params 补全参数
 * @returns 补全结果
 */
export async function getAutoCompletion(params: AutoCompleteParams): Promise<AutoCompleteResult> {
  try {
    // 实际API调用
    const response = await fetch('/api/ai/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.content,
        document_id: params.documentId,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`自动补全请求失败: ${response.status}`);
    }

    const data = await response.json();
    return {
      completion: data.completion,
      cursorPosition: params.cursorPosition + data.completion.length,
    };
  } catch (error) {
    console.error('获取自动补全时出错:', error);
    // 失败时返回空补全
    return {
      completion: '',
      cursorPosition: params.cursorPosition,
    };
  }
}

/**
 * 流式获取AI自动补全内容
 * @param params 补全参数
 * @param onChunk 接收每个文本块的回调
 * @returns 取消流式请求的函数
 */
export function streamAutoCompletion(
  params: AutoCompleteParams,
  onChunk: (chunk: string) => void
): () => void {
  let abortController = new AbortController();

  // 启动流式请求
  (async () => {
    try {
      const response = await fetch('/api/ai/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          prompt: params.content,
          document_id: params.documentId,
          max_tokens: 200,
          temperature: 0.7,
          command: params.command
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`流式自动补全请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('响应没有可读取的内容');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // 解码二进制数据为文本
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理SSE格式数据
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            onChunk(data);
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('流式自动补全时出错:', error);
      }
    }
  })();

  // 返回取消函数
  return () => {
    abortController.abort();
  };
}

/**
 * 空格输入后延迟触发补全的节流函数
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function createAutoCompleteThrottle(
  callback: () => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastTriggered = 0;

  return () => {
    const now = Date.now();
    const remaining = lastTriggered + delay - now;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (remaining <= 0) {
      lastTriggered = now;
      callback();
    } else {
      timeoutId = setTimeout(() => {
        lastTriggered = Date.now();
        callback();
      }, remaining);
    }
  };
} 