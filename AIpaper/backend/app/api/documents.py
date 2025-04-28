from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.db.database import get_db
from app.services.document_service import DocumentService
from app.models.document import Document as DocumentModel
from app.models.document_version import DocumentVersion as DocumentVersionModel

router = APIRouter()


class DocumentBase(BaseModel):
    """文档基础模型"""
    title: str
    content: Optional[str] = None
    outline: Optional[str] = None
    is_public: bool = False


class DocumentCreate(DocumentBase):
    """文档创建模型"""
    pass


class DocumentUpdate(BaseModel):
    """文档更新模型"""
    title: Optional[str] = None
    content: Optional[str] = None
    outline: Optional[str] = None
    is_public: Optional[bool] = None
    commit_message: Optional[str] = None


class DocumentResponse(DocumentBase):
    """文档响应模型"""
    id: int
    word_count: int
    current_version: int
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True


class VersionResponse(BaseModel):
    """版本响应模型"""
    id: int
    version_number: int
    title: str
    commit_message: str
    word_count: int
    changes_summary: Optional[Dict[str, Any]] = None
    created_at: str


class VersionDetailResponse(VersionResponse):
    """版本详情响应模型"""
    content: str
    outline: Optional[str] = None


class CommentBase(BaseModel):
    """评论基础模型"""
    content: str
    position: Optional[str] = None
    parent_id: Optional[int] = None


class CommentResponse(CommentBase):
    """评论响应模型"""
    id: int
    created_at: str
    user_id: int
    replies: Optional[List["CommentResponse"]] = None


# 处理循环引用
CommentResponse.update_forward_refs()


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """创建新文档"""
    created_doc = await DocumentService.create_document(
        db=db,
        title=document.title,
        content=document.content or "",
        outline=document.outline,
        user_id=None # 实际应该使用current_user.id
    )
    
    return created_doc


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document: DocumentUpdate,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """更新文档"""
    updated_doc = await DocumentService.update_document(
        db=db,
        document_id=document_id,
        title=document.title,
        content=document.content,
        outline=document.outline,
        commit_message=document.commit_message
    )
    
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    return updated_doc


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取文档列表"""
    # 获取文档列表逻辑（占位）
    # 实际实现时应该根据用户ID过滤
    documents = db.query(DocumentModel).offset(skip).limit(limit).all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取单个文档"""
    document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    return document


@router.get("/{document_id}/versions", response_model=List[VersionResponse])
async def get_document_versions(
    document_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取文档版本历史"""
    versions = await DocumentService.get_document_versions(db, document_id)
    return versions


@router.get("/{document_id}/versions/{version_id}", response_model=VersionDetailResponse)
async def get_document_version(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取文档指定版本"""
    version = await DocumentService.get_document_version(db, version_id)
    if not version or version.document_id != document_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定版本不存在"
        )
    
    return {
        "id": version.id,
        "version_number": version.version_number,
        "title": version.title,
        "content": version.content,
        "outline": version.outline,
        "commit_message": version.commit_message,
        "word_count": version.word_count,
        "changes_summary": version.changes_summary,
        "created_at": version.created_at.isoformat()
    }


@router.get("/{document_id}/diff", response_model=Dict[str, Any])
async def get_version_diff(
    document_id: int,
    version1: int,
    version2: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取两个版本之间的差异"""
    diff = await DocumentService.get_version_diff(db, document_id, version1, version2)
    if "error" in diff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=diff["error"]
        )
    
    return diff


@router.post("/{document_id}/versions/{version_id}/comments", response_model=CommentResponse)
async def add_comment(
    document_id: int,
    version_id: int,
    comment: CommentBase,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """添加评论"""
    # 验证版本是否存在且属于当前文档
    version = db.query(DocumentVersionModel).filter(
        DocumentVersionModel.id == version_id,
        DocumentVersionModel.document_id == document_id
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定版本不存在"
        )
    
    # 创建评论
    created_comment = await DocumentService.add_comment(
        db=db,
        version_id=version_id,
        user_id=1,  # 实际应该使用current_user.id
        content=comment.content,
        position=comment.position,
        parent_id=comment.parent_id
    )
    
    # 返回创建的评论
    return {
        "id": created_comment.id,
        "content": created_comment.content,
        "position": created_comment.position,
        "parent_id": created_comment.parent_id,
        "created_at": created_comment.created_at.isoformat(),
        "user_id": created_comment.user_id,
        "replies": []
    }


@router.get("/{document_id}/versions/{version_id}/comments", response_model=List[CommentResponse])
async def get_version_comments(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """获取版本评论"""
    # 验证版本是否存在且属于当前文档
    version = db.query(DocumentVersionModel).filter(
        DocumentVersionModel.id == version_id,
        DocumentVersionModel.document_id == document_id
    ).first()
    
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定版本不存在"
        )
    
    # 获取评论
    comments = await DocumentService.get_version_comments(db, version_id)
    return comments 