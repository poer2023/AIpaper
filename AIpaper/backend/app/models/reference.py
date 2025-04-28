from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class Reference(Base):
    """文献引用模型"""
    
    __tablename__ = "references"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 引用元数据
    title = Column(String(512))
    authors = Column(Text)  # 存储作者列表的JSON字符串
    journal = Column(String(512), nullable=True)
    year = Column(String(10), nullable=True)
    doi = Column(String(255), nullable=True, index=True)
    url = Column(String(1024), nullable=True)
    
    # 引用数据
    raw_data = Column(JSON, nullable=True)  # 原始引用数据
    citation_key = Column(String(100), nullable=True)  # 如 "smith2020"
    
    # 格式化引用
    apa_citation = Column(Text, nullable=True)
    mla_citation = Column(Text, nullable=True)
    chicago_citation = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 关联关系
    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="references")
    
    # PDF来源关系（如果引用来自上传的PDF）
    pdf_source_id = Column(Integer, ForeignKey("pdf_sources.id"), nullable=True)
    pdf_source = relationship("PDFSource", back_populates="extracted_references") 