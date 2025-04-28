from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class Document(Base):
    """文档模型"""
    
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    content = Column(Text)
    outline = Column(Text, nullable=True)
    
    # 文档元数据
    word_count = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    current_version = Column(Integer, default=1)  # 当前版本号
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 关联关系
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="documents")
    
    # 引用关系
    references = relationship("Reference", back_populates="document", cascade="all, delete-orphan")
    
    # PDF关联
    pdf_sources = relationship("PDFSource", back_populates="document", cascade="all, delete-orphan")
    
    # 版本关联
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan") 