from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.services.reference_service import ReferenceService

router = APIRouter()


class ReferenceSearchRequest(BaseModel):
    """引用搜索请求模型"""
    query: str
    limit: int = 10


class ReferenceSearchResponse(BaseModel):
    """引用搜索响应模型"""
    results: List[Dict[str, Any]]
    count: int


class ReferenceFormatRequest(BaseModel):
    """引用格式化请求模型"""
    reference: Dict[str, Any]
    style: str = "apa"  # "apa", "mla", "gb"


class ReferenceFormatResponse(BaseModel):
    """引用格式化响应模型"""
    formatted: str


@router.get("/search", response_model=ReferenceSearchResponse)
async def search_references(
    query: str = Query(..., description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50, description="结果数量限制"),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    搜索学术引用
    
    同时搜索Crossref和Semantic Scholar API，返回合并去重的结果
    """
    if not query or len(query.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="搜索关键词至少需要3个字符"
        )
    
    results = await ReferenceService.search_references(query, limit)
    
    return {
        "results": results,
        "count": len(results)
    }


@router.post("/format", response_model=ReferenceFormatResponse)
async def format_citation(
    request: ReferenceFormatRequest,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    格式化引用
    
    根据指定的样式格式化引用数据
    """
    if not request.reference:
        raise HTTPException(
            status_code=400,
            detail="引用数据不能为空"
        )
    
    if request.style not in ["apa", "mla", "gb"]:
        raise HTTPException(
            status_code=400,
            detail="不支持的引用格式。支持的格式：apa, mla, gb"
        )
    
    formatted = ReferenceService.format_citation(request.reference, request.style)
    
    return {
        "formatted": formatted
    }


@router.post("/batch-format")
async def batch_format_citations(
    references: List[Dict[str, Any]],
    style: str = Query("apa", description="引用样式"),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    批量格式化引用
    
    一次性格式化多个引用数据
    """
    if not references:
        raise HTTPException(
            status_code=400,
            detail="引用数据列表不能为空"
        )
    
    if style not in ["apa", "mla", "gb"]:
        raise HTTPException(
            status_code=400,
            detail="不支持的引用格式。支持的格式：apa, mla, gb"
        )
    
    formatted_references = []
    for ref in references:
        formatted = ReferenceService.format_citation(ref, style)
        formatted_references.append({
            "original": ref,
            "formatted": formatted
        })
    
    return {
        "results": formatted_references,
        "count": len(formatted_references)
    } 