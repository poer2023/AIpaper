import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zh_CN } from 'date-fns/locale';

// 版本类型
interface Version {
  id: number;
  version_number: number;
  title: string;
  commit_message: string;
  word_count: number;
  changes_summary?: {
    added_lines?: number;
    removed_lines?: number;
  };
  created_at: string;
}

// 版本差异类型
interface VersionDiff {
  version1: {
    number: number;
    title: string;
    created_at: string;
  };
  version2: {
    number: number;
    title: string;
    created_at: string;
  };
  diff: string[];
  html_diff: string[];
}

interface DocumentVersionsProps {
  documentId: number;
}

export default function DocumentVersions({ documentId }: DocumentVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  // 加载版本历史
  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/documents/${documentId}/versions`);
        
        if (!response.ok) {
          throw new Error(`获取版本历史失败: ${response.status}`);
        }
        
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        console.error('获取版本历史时出错:', err);
        setError(err instanceof Error ? err.message : '获取版本历史失败');
      } finally {
        setLoading(false);
      }
    };
    
    if (documentId) {
      fetchVersions();
    }
  }, [documentId]);

  // 选择版本进行对比
  const handleVersionSelect = (versionNumber: number) => {
    setSelectedVersions(prev => {
      // 如果已经选中，则取消选中
      if (prev.includes(versionNumber)) {
        return prev.filter(v => v !== versionNumber);
      }
      
      // 如果已有两个选中的版本，则替换最早选中的那个
      if (prev.length >= 2) {
        return [prev[1], versionNumber];
      }
      
      // 否则添加到选中列表
      return [...prev, versionNumber];
    });
  };

  // 获取版本差异
  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      setDiffError('请选择两个版本进行对比');
      return;
    }
    
    setDiffLoading(true);
    setDiffError(null);
    
    try {
      // 确保版本号按照顺序排列，小的在前
      const [v1, v2] = selectedVersions.sort((a, b) => a - b);
      
      const response = await fetch(`/api/documents/${documentId}/diff?version1=${v1}&version2=${v2}`);
      
      if (!response.ok) {
        throw new Error(`获取版本差异失败: ${response.status}`);
      }
      
      const data = await response.json();
      setVersionDiff(data);
      setShowDiff(true);
    } catch (err) {
      console.error('获取版本差异时出错:', err);
      setDiffError(err instanceof Error ? err.message : '获取版本差异失败');
    } finally {
      setDiffLoading(false);
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

  // 恢复到指定版本
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!confirm(`确定要恢复到版本 ${versionNumber} 吗？当前未保存的更改将丢失。`)) {
      return;
    }
    
    try {
      // 获取版本详情
      const response = await fetch(`/api/documents/${documentId}/versions/${versionNumber}`);
      
      if (!response.ok) {
        throw new Error(`获取版本详情失败: ${response.status}`);
      }
      
      const versionData = await response.json();
      
      // 更新文档到此版本
      const updateResponse = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: versionData.title,
          content: versionData.content,
          outline: versionData.outline,
          commit_message: `从版本 ${versionNumber} 恢复`
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`恢复版本失败: ${updateResponse.status}`);
      }
      
      // 重新加载页面或通知父组件
      window.location.reload();
    } catch (err) {
      console.error('恢复版本时出错:', err);
      alert(err instanceof Error ? err.message : '恢复版本失败');
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="spinner"></div>
        <p className="mt-2 text-gray-600">加载版本历史...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">文档版本历史</h2>
      </div>
      
      {/* 版本列表 */}
      <div className="divide-y">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            没有找到版本历史记录
          </div>
        ) : (
          versions.map(version => (
            <div 
              key={version.id} 
              className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                selectedVersions.includes(version.version_number) ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleVersionSelect(version.version_number)}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-medium mr-3">
                    {version.version_number}
                  </span>
                  <div>
                    <p className="font-medium">{version.title}</p>
                    <p className="text-sm text-gray-600">{version.commit_message}</p>
                    <div className="flex mt-1 text-xs text-gray-500">
                      <span className="mr-3">{formatDate(version.created_at)}</span>
                      <span className="mr-3">{version.word_count} 字</span>
                      {version.changes_summary && (
                        <>
                          {version.changes_summary.added_lines !== undefined && (
                            <span className="text-green-600 mr-2">+{version.changes_summary.added_lines}</span>
                          )}
                          {version.changes_summary.removed_lines !== undefined && (
                            <span className="text-red-600">-{version.changes_summary.removed_lines}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestoreVersion(version.version_number);
                  }}
                >
                  恢复
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 对比功能 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm">已选: </span>
            {selectedVersions.length === 0 ? (
              <span className="text-sm text-gray-500">请选择版本</span>
            ) : (
              <span className="text-sm text-blue-600">
                {selectedVersions.sort((a, b) => a - b).join(' → ')}
              </span>
            )}
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={selectedVersions.length !== 2 || diffLoading}
            onClick={handleCompareVersions}
          >
            {diffLoading ? '加载中...' : '对比版本'}
          </button>
        </div>
        
        {diffError && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded">
            {diffError}
          </div>
        )}
        
        {/* 版本差异展示 */}
        {showDiff && versionDiff && (
          <div className="mt-4 border rounded bg-white">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium">版本对比: {versionDiff.version1.number} → {versionDiff.version2.number}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDiff(false)}
              >
                关闭
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="font-mono text-sm whitespace-pre">
                {versionDiff.html_diff.map((line, index) => (
                  <div 
                    key={index} 
                    dangerouslySetInnerHTML={{ __html: line }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 