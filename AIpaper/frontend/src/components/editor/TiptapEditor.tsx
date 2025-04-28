'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from './EditorToolbar';
import './Editor.css';
import { getAutoCompletion, createAutoCompleteThrottle } from '@/services/autoCompleteService';

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
}

// 使用forwardRef包裹组件以便暴露方法给父组件
const TiptapEditor = forwardRef<
  { insertCitation: (id: string) => void }, 
  TiptapEditorProps
>(({ 
  initialContent = '<p>开始撰写您的文档...</p>', 
  onChange,
  editable = true
}, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // 处理AI自动补全
  const handleAutoComplete = useCallback(async () => {
    if (!editor || isGeneratingSuggestion) return;
    
    // 获取当前文本和光标位置
    const content = editor.getHTML();
    const cursorPosition = editor.state.selection.anchor;
    
    setIsGeneratingSuggestion(true);
    
    try {
      const result = await getAutoCompletion({
        content,
        cursorPosition,
      });
      
      // 设置建议内容
      setSuggestion(result.completion);
    } catch (error) {
      console.error('获取AI建议时出错:', error);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  }, [editor, isGeneratingSuggestion]);

  // 处理命令型自动补全
  const handleCommandAutoComplete = useCallback(async (command: 'continue' | 'rewrite') => {
    if (!editor || isGeneratingSuggestion) return;
    
    // 获取当前文本和光标位置
    const content = editor.getHTML();
    const cursorPosition = editor.state.selection.anchor;
    
    setIsGeneratingSuggestion(true);
    
    try {
      const result = await getAutoCompletion({
        content,
        cursorPosition,
        command,
      });
      
      // 直接插入命令型补全结果
      editor.chain().insertContent(result.completion).run();
    } catch (error) {
      console.error(`执行${command}命令时出错:`, error);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  }, [editor, isGeneratingSuggestion]);

  // 接受建议
  const acceptSuggestion = useCallback(() => {
    if (editor && suggestion) {
      editor.chain().focus().insertContent(suggestion).run();
      setSuggestion(null);
    }
  }, [editor, suggestion]);

  // 拒绝建议
  const rejectSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab键接受建议
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        acceptSuggestion();
      }
      
      // Escape键拒绝建议
      if (e.key === 'Escape' && suggestion) {
        e.preventDefault();
        rejectSuggestion();
      }
      
      // 处理命令：/continue, /rewrite
      if (e.key === 'Enter' && editor) {
        const selection = editor.state.selection;
        const { from, to } = selection;
        
        if (from === to) {
          const position = from;
          const transaction = editor.state.tr;
          const currentNode = transaction.doc.nodeAt(position);
          
          if (currentNode) {
            const nodeText = currentNode.textContent;
            
            if (nodeText.trim() === '/continue') {
              e.preventDefault();
              editor.commands.deleteRange({ from: position - 10, to: position });
              handleCommandAutoComplete('continue');
            } else if (nodeText.trim() === '/rewrite') {
              e.preventDefault();
              editor.commands.deleteRange({ from: position - 9, to: position });
              handleCommandAutoComplete('rewrite');
            }
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, suggestion, acceptSuggestion, rejectSuggestion, handleCommandAutoComplete]);

  // 创建节流函数，在空格后延迟300ms触发自动补全
  useEffect(() => {
    if (!editor) return;
    
    const throttledAutoComplete = createAutoCompleteThrottle(handleAutoComplete, 300);
    
    const handleKeyup = (e: Event) => {
      // 将Event类型转换为KeyboardEvent
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === ' ') {
        throttledAutoComplete();
      }
    };
    
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      editorElement.addEventListener('keyup', handleKeyup);
      
      return () => {
        editorElement.removeEventListener('keyup', handleKeyup);
      };
    }
  }, [editor, handleAutoComplete]);

  // 暴露insertCitation方法给父组件
  useImperativeHandle(ref, () => ({
    insertCitation: (id: string) => {
      if (editor) {
        // 插入引用标记 [n]
        editor.chain().focus().insertContent(`<sup>[${id}]</sup>`).run();
      }
    }
  }));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 防止服务端渲染不匹配
  if (!isMounted) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      {editable && <EditorToolbar editor={editor} />}
      
      <div className="editor-container relative">
        <EditorContent editor={editor} className="editor-content" />
        
        {suggestion && (
          <div className="suggestion-overlay absolute pointer-events-none text-gray-400">
            <span>{suggestion}</span>
          </div>
        )}
        
        {suggestion && (
          <div className="suggestion-hint text-xs text-gray-500 mt-2">
            按 <kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> 接受或 <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> 取消
          </div>
        )}
      </div>
    </div>
  );
});

// 添加displayName以提高调试体验
TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor; 