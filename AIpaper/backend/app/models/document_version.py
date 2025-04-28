from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class DocumentVersion(Base):
    """文档版本模型 - 用于存储文档的历史版本"""
    
    __tablename__ = "document_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 版本信息
    version_number = Column(Integer)  # 版本号，从1开始递增
    content = Column(Text)            # 文档内容快照
    outline = Column(Text, nullable=True)  # 大纲快照
    title = Column(String(255))       # 标题快照
    
    # 版本元数据
    commit_message = Column(String(255), nullable=True)  # 提交信息
    word_count = Column(Integer, default=0)  # 当前版本字数统计
    changes_summary = Column(JSON, nullable=True)  # 变更摘要，如新增/删除行数
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # 关联关系
    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="versions")
    
    # 评论关系
    comments = relationship("Comment", back_populates="document_version", cascade="all, delete-orphan") 