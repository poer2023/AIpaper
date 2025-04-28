from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class Comment(Base):
    """评论模型 - 用于存储文档版本的评论"""
    
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 评论内容
    content = Column(Text)
    
    # 评论位置
    position = Column(String(100), nullable=True)  # 可选，指定评论位置（如行号、段落ID等）
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 关联关系
    document_version_id = Column(Integer, ForeignKey("document_versions.id"))
    document_version = relationship("DocumentVersion", back_populates="comments")
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="comments")
    
    # 回复关系（自引用）
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    replies = relationship("Comment", backref="parent", remote_side=[id], cascade="all, delete-orphan") 