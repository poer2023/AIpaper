from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.db.database import get_db
from app.services.outline_service import OutlineService

router = APIRouter()


class CompletionRequest(BaseModel):
    """补全请求模型"""
    prompt: str
    document_id: Optional[int] = None
    max_tokens: int = 100
    temperature: float = 0.7


class OutlineRequest(BaseModel):
    """大纲生成请求模型"""
    title: str
    partial_content: Optional[str] = None
    outline_depth: int = 2


class OutlineResponse(BaseModel):
    """大纲响应模型"""
    outline: List[Dict[str, Any]]
    

@router.post("/completion")
async def generate_completion(
    request: CompletionRequest,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """生成AI补全（流式响应）"""
    
    # 实际实现会调用AI服务
    # 这里只是模拟流式响应
    async def fake_stream():
        responses = [
            "这是",
            "一个",
            "模拟的",
            "AI补全",
            "响应，",
            "实际实现时",
            "将调用",
            "OpenAI API",
            "或其他模型",
            "进行文本生成。"
        ]
        
        for text in responses:
            # 模拟延迟
            import asyncio
            await asyncio.sleep(0.2)
            yield f"data: {text}\n\n"
    
    return StreamingResponse(
        fake_stream(),
        media_type="text/event-stream"
    )


@router.post("/outline", response_model=OutlineResponse)
async def generate_outline(
    request: OutlineRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证  
):
    """生成文章大纲"""
    
    # 参数验证
    if not request.title or len(request.title.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="文章标题至少需要3个字符"
        )
    
    if request.outline_depth < 1 or request.outline_depth > 3:
        raise HTTPException(
            status_code=400,
            detail="大纲深度必须在1-3级之间"
        )
    
    # 调用大纲生成服务
    outline = await OutlineService.generate_outline(
        title=request.title,
        partial_content=request.partial_content,
        outline_depth=request.outline_depth
    )
    
    return {"outline": outline} 