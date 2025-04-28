from pydantic_settings import BaseSettings
from typing import Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置类"""
    
    # 应用基础配置
    APP_NAME: str = "Jenni.ai Demo API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost/jenni_demo"
    
    # AI模型配置
    OPENAI_API_KEY: Optional[str] = None
    MODEL_NAME: str = "gpt-4o"
    TOKEN_LIMIT_PER_DAY: int = 5000  # 每日token限额
    
    # 文件存储路径
    UPLOAD_DIR: str = "/opt/app/uploads/"
    
    # CORS配置
    CORS_ORIGINS: list[str] = ["*"]
    
    # 安全配置
    SECRET_KEY: str = "changeme_in_production"
    TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取缓存的应用配置"""
    return Settings()


# 确保上传目录存在
os.makedirs(get_settings().UPLOAD_DIR, exist_ok=True) 