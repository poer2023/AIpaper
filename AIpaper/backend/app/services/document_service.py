import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import difflib
import json

from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.comment import Comment

logger = logging.getLogger(__name__)

class DocumentService:
    """文档服务"""
    
    @staticmethod
    async def create_document(db: Session, title: str, content: str, outline: Optional[str] = None, user_id: Optional[int] = None) -> Document:
        """
        创建新文档
        
        Args:
            db: 数据库会话
            title: 文档标题
            content: 文档内容
            outline: 文档大纲
            user_id: 用户ID
            
        Returns:
            Document: 创建的文档对象
        """
        # 计算字数
        word_count = len(content.split()) if content else 0
        
        # 创建文档
        document = Document(
            title=title,
            content=content,
            outline=outline,
            word_count=word_count,
            user_id=user_id,
            current_version=1
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # 创建初始版本
        initial_version = DocumentVersion(
            document_id=document.id,
            version_number=1,
            title=title,
            content=content,
            outline=outline,
            word_count=word_count,
            commit_message="初始版本"
        )
        
        db.add(initial_version)
        db.commit()
        
        return document
    
    @staticmethod
    async def update_document(db: Session, document_id: int, title: Optional[str] = None, 
                             content: Optional[str] = None, outline: Optional[str] = None, 
                             commit_message: Optional[str] = None, create_version: bool = True) -> Optional[Document]:
        """
        更新文档
        
        Args:
            db: 数据库会话
            document_id: 文档ID
            title: 文档标题
            content: 文档内容 
            outline: 文档大纲
            commit_message: 提交信息
            create_version: 是否创建新版本
            
        Returns:
            Optional[Document]: 更新后的文档对象
        """
        # 获取文档
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return None
        
        # 准备更新数据
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if content is not None:
            update_data["content"] = content
            # 更新字数统计
            update_data["word_count"] = len(content.split())
        if outline is not None:
            update_data["outline"] = outline
        
        # 如果没有更新数据，直接返回
        if not update_data:
            return document
        
        # 如果需要创建新版本
        if create_version:
            # 获取当前版本号并递增
            current_version = document.current_version
            new_version_number = current_version + 1
            update_data["current_version"] = new_version_number
            
            # 计算变更摘要
            changes_summary = {}
            if content is not None and document.content:
                # 获取内容差异
                old_lines = document.content.splitlines()
                new_lines = content.splitlines()
                diff = list(difflib.unified_diff(old_lines, new_lines, n=0))
                
                # 统计添加和删除的行数
                added = sum(1 for line in diff if line.startswith('+') and not line.startswith('+++'))
                removed = sum(1 for line in diff if line.startswith('-') and not line.startswith('---'))
                
                changes_summary["added_lines"] = added
                changes_summary["removed_lines"] = removed
            
            # 创建新版本
            new_version = DocumentVersion(
                document_id=document_id,
                version_number=new_version_number,
                title=title if title is not None else document.title,
                content=content if content is not None else document.content,
                outline=outline if outline is not None else document.outline,
                word_count=update_data.get("word_count", document.word_count),
                commit_message=commit_message or "更新文档",
                changes_summary=changes_summary
            )
            
            db.add(new_version)
        
        # 更新文档
        for key, value in update_data.items():
            setattr(document, key, value)
        
        db.commit()
        db.refresh(document)
        
        return document
    
    @staticmethod
    async def get_document_versions(db: Session, document_id: int) -> List[Dict[str, Any]]:
        """
        获取文档版本历史
        
        Args:
            db: 数据库会话
            document_id: 文档ID
            
        Returns:
            List[Dict[str, Any]]: 版本列表
        """
        versions = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).all()
        
        return [
            {
                "id": version.id,
                "version_number": version.version_number,
                "title": version.title,
                "commit_message": version.commit_message,
                "word_count": version.word_count,
                "changes_summary": version.changes_summary,
                "created_at": version.created_at.isoformat(),
            }
            for version in versions
        ]
    
    @staticmethod
    async def get_document_version(db: Session, version_id: int) -> Optional[DocumentVersion]:
        """
        获取指定的文档版本
        
        Args:
            db: 数据库会话
            version_id: 版本ID
            
        Returns:
            Optional[DocumentVersion]: 文档版本对象
        """
        return db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()
    
    @staticmethod
    async def get_version_diff(db: Session, document_id: int, version1_number: int, version2_number: int) -> Dict[str, Any]:
        """
        获取两个版本之间的差异
        
        Args:
            db: 数据库会话
            document_id: 文档ID
            version1_number: 版本1的版本号
            version2_number: 版本2的版本号
            
        Returns:
            Dict[str, Any]: 差异信息
        """
        # 获取两个版本
        version1 = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version1_number
        ).first()
        
        version2 = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id,
            DocumentVersion.version_number == version2_number
        ).first()
        
        if not version1 or not version2:
            return {
                "error": "指定的版本不存在"
            }
        
        # 计算内容差异
        diff = list(difflib.unified_diff(
            version1.content.splitlines(),
            version2.content.splitlines(),
            fromfile=f"版本 {version1_number}",
            tofile=f"版本 {version2_number}",
            lineterm=""
        ))
        
        # 格式化差异
        html_diff = []
        for line in diff:
            if line.startswith('+'):
                html_diff.append(f'<div class="diff-add">{line}</div>')
            elif line.startswith('-'):
                html_diff.append(f'<div class="diff-remove">{line}</div>')
            elif line.startswith('@@'):
                html_diff.append(f'<div class="diff-info">{line}</div>')
            else:
                html_diff.append(f'<div class="diff-context">{line}</div>')
        
        return {
            "version1": {
                "number": version1_number,
                "title": version1.title,
                "created_at": version1.created_at.isoformat(),
            },
            "version2": {
                "number": version2_number,
                "title": version2.title,
                "created_at": version2.created_at.isoformat(),
            },
            "diff": diff,
            "html_diff": html_diff
        }
    
    @staticmethod
    async def add_comment(db: Session, version_id: int, user_id: int, content: str, position: Optional[str] = None, parent_id: Optional[int] = None) -> Comment:
        """
        添加评论
        
        Args:
            db: 数据库会话
            version_id: 文档版本ID
            user_id: 用户ID
            content: 评论内容
            position: 评论位置
            parent_id: 父评论ID
            
        Returns:
            Comment: 创建的评论对象
        """
        # 创建评论
        comment = Comment(
            document_version_id=version_id,
            user_id=user_id,
            content=content,
            position=position,
            parent_id=parent_id
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        return comment
    
    @staticmethod
    async def get_version_comments(db: Session, version_id: int) -> List[Dict[str, Any]]:
        """
        获取版本的评论
        
        Args:
            db: 数据库会话
            version_id: 文档版本ID
            
        Returns:
            List[Dict[str, Any]]: 评论列表
        """
        # 获取根评论
        root_comments = db.query(Comment).filter(
            Comment.document_version_id == version_id,
            Comment.parent_id == None
        ).order_by(Comment.created_at).all()
        
        result = []
        for comment in root_comments:
            # 递归获取回复
            comment_data = {
                "id": comment.id,
                "content": comment.content,
                "position": comment.position,
                "created_at": comment.created_at.isoformat(),
                "user_id": comment.user_id,
                "replies": await DocumentService._get_comment_replies(db, comment.id)
            }
            result.append(comment_data)
        
        return result
    
    @staticmethod
    async def _get_comment_replies(db: Session, comment_id: int) -> List[Dict[str, Any]]:
        """
        递归获取评论回复
        
        Args:
            db: 数据库会话
            comment_id: 评论ID
            
        Returns:
            List[Dict[str, Any]]: 回复列表
        """
        replies = db.query(Comment).filter(
            Comment.parent_id == comment_id
        ).order_by(Comment.created_at).all()
        
        result = []
        for reply in replies:
            reply_data = {
                "id": reply.id,
                "content": reply.content,
                "position": reply.position,
                "created_at": reply.created_at.isoformat(),
                "user_id": reply.user_id,
                "replies": await DocumentService._get_comment_replies(db, reply.id)
            }
            result.append(reply_data)
        
        return result 