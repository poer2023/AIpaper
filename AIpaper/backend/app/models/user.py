from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
import datetime

from app.db.database import Base


class User(Base):
    """用户模型"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(50), index=True)
    hashed_password = Column(String(255), nullable=True)  # OAuth用户可能没有密码
    
    # OAuth相关字段
    oauth_provider = Column(String(50), nullable=True)  # github, google等
    oauth_id = Column(String(255), nullable=True)
    
    # 用户状态
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # 用户配额
    daily_token_limit = Column(Integer, default=5000)
    tokens_used_today = Column(Integer, default=0)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # 关联关系
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan") 