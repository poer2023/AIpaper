from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class PDFSource(Base):
    """PDF源文件模型"""
    
    __tablename__ = "pdf_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 文件信息
    filename = Column(String(255))
    file_path = Column(String(1024))
    file_size = Column(Integer)  # 字节数
    
    # 索引状态
    is_indexed = Column(Boolean, default=False)
    index_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    
    # 向量索引信息
    vector_db_id = Column(String(255), nullable=True)  # 在向量数据库中的ID或集合名称
    chunk_count = Column(Integer, default=0)  # 分块数量
    
    # 元数据
    title = Column(String(512), nullable=True)
    authors = Column(String(512), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    indexed_at = Column(DateTime, nullable=True)  # 索引完成时间
    
    # 关联关系
    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="pdf_sources")
    
    # 从PDF提取的引用
    extracted_references = relationship("Reference", back_populates="pdf_source") 