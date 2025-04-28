import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zh_CN } from 'date-fns/locale';

// 评论类型
interface Comment {
  id: number;
  content: string;
  position?: string;
  parent_id?: number;
  created_at: string;
  user_id: number;
  replies?: Comment[];
}

// 用户类型（简化版）
interface User {
  id: number;
  username: string;
  avatar?: string;
}

interface DocumentCommentsProps {
  documentId: number;
  versionId: number;
}

export default function DocumentComments({ documentId, versionId }: DocumentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [users, setUsers] = useState<Record<number, User>>({});

  // 加载评论数据
  useEffect(() => {
    const fetchComments = async () => {
      if (!documentId || !versionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/comments`);
        
        if (!response.ok) {
          throw new Error(`获取评论失败: ${response.status}`);
        }
        
        const data = await response.json();
        setComments(data);
        
        // 提取所有用户ID
        const userIds = new Set<number>();
        const extractUserIds = (comments: Comment[]) => {
          comments.forEach(comment => {
            userIds.add(comment.user_id);
            if (comment.replies && comment.replies.length > 0) {
              extractUserIds(comment.replies);
            }
          });
        };
        
        extractUserIds(data);
        
        // 获取用户信息（实际项目中应该用批量接口）
        // 这里简化实现，使用模拟数据
        const mockUsers: Record<number, User> = {};
        userIds.forEach(userId => {
          mockUsers[userId] = {
            id: userId,
            username: `用户${userId}`,
            avatar: `/avatars/${userId}.jpg`
          };
        });
        
        setUsers(mockUsers);
      } catch (err) {
        console.error('获取评论时出错:', err);
        setError(err instanceof Error ? err.message : '获取评论失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [documentId, versionId]);

  // 提交评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/documents/${documentId}/versions/${versionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parent_id: replyTo
        }),
      });
      
      if (!response.ok) {
        throw new Error(`提交评论失败: ${response.status}`);
      }
      
      const addedComment = await response.json();
      
      if (replyTo) {
        // 添加回复到现有评论
        setComments(prevComments => {
          const updateReplies = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === replyTo) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), addedComment]
                };
              } else if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateReplies(comment.replies)
                };
              }
              return comment;
            });
          };
          
          return updateReplies(prevComments);
        });
      } else {
        // 添加顶级评论
        setComments(prev => [...prev, addedComment]);
      }
      
      // 重置表单
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('提交评论时出错:', err);
      alert(err instanceof Error ? err.message : '提交评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: zh_CN });
    } catch (err) {
      return dateString;
    }
  };

  // 渲染单个评论
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const user = users[comment.user_id] || { username: `用户${comment.user_id}` };
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mb-6 border-b pb-4'}`}>
        <div className="flex">
          <div className="mr-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline">
              <span className="font-medium">{user.username}</span>
              <span className="ml-2 text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            </div>
            <p className="mt-1 text-gray-800">{comment.content}</p>
            <div className="mt-2">
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setReplyTo(comment.id)}
              >
                回复
              </button>
            </div>
          </div>
        </div>
        
        {/* 回复列表 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="spinner"></div>
        <p className="mt-2 text-gray-600">加载评论...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">评论 ({comments.length})</h2>
      </div>
      
      {/* 评论列表 */}
      <div className="p-4">
        {error ? (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            暂无评论，来添加第一条评论吧
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
      
      {/* 评论表单 */}
      <div className="p-4 border-t bg-gray-50">
        {replyTo !== null && (
          <div className="mb-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
            <span className="text-sm">
              回复评论 #{replyTo}
            </span>
            <button 
              className="text-sm text-gray-600 hover:text-gray-800"
              onClick={() => setReplyTo(null)}
            >
              取消
            </button>
          </div>
        )}
        
        <div className="flex">
          <textarea
            className="flex-1 p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="添加评论..."
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button
            className="px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!newComment.trim() || submitting}
            onClick={handleSubmitComment}
          >
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  );
} 