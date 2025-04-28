from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os

from app.db.database import get_db
from app.services.pdf_service import PDFService

router = APIRouter()


class PDFSearchRequest(BaseModel):
    """PDF检索请求模型"""
    pdf_id: str
    query: str
    limit: int = 5


class PDFSearchResponse(BaseModel):
    """PDF检索响应模型"""
    results: List[Dict[str, Any]]
    count: int


@router.post("/upload")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    上传PDF文件
    
    上传并处理PDF文件，提取文本和元数据，并执行向量化
    """
    # 检查文件类型
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="只接受PDF文件"
        )
    
    # 读取文件内容
    file_content = await file.read()
    
    # 检查文件大小
    if len(file_content) > 50 * 1024 * 1024:  # 50MB上限
        raise HTTPException(
            status_code=400,
            detail="PDF文件不能超过50MB"
        )
    
    # 保存上传的PDF
    file_info = await PDFService.save_uploaded_pdf(
        filename=file.filename,
        file_content=file_content,
        user_id=None  # 实际应该使用current_user.id
    )
    
    # 在后台处理PDF
    async def process_pdf_task():
        await PDFService.process_pdf(
            pdf_id=file_info["id"],
            file_path=file_info["path"]
        )
    
    # 添加后台任务
    background_tasks.add_task(process_pdf_task)
    
    return {
        "message": "PDF文件已上传，正在处理",
        "pdf_id": file_info["id"],
        "filename": file_info["filename"],
        "size": file_info["size"],
        "document_id": document_id
    }


@router.get("/status/{pdf_id}")
async def get_pdf_status(
    pdf_id: str,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    获取PDF处理状态
    
    检查PDF是否已完成处理和向量化
    """
    # 检查向量存储是否存在
    collection_name = f"pdf_{pdf_id}"
    vector_db_path = PDFService.VECTOR_DIR + f"/{collection_name}"
    
    if os.path.exists(vector_db_path):
        return {
            "pdf_id": pdf_id,
            "status": "processed",
            "vector_db": True
        }
    
    # 检查PDF文件是否存在
    pdf_files = [f for f in os.listdir(PDFService.PDF_DIR) if f.startswith(f"{pdf_id}_")]
    
    if pdf_files:
        return {
            "pdf_id": pdf_id,
            "status": "processing",
            "filename": pdf_files[0]
        }
    
    # 文件不存在
    raise HTTPException(
        status_code=404,
        detail=f"找不到ID为 {pdf_id} 的PDF文件"
    )


@router.get("/search/{pdf_id}")
async def search_pdf(
    pdf_id: str,
    query: str = Query(..., description="搜索查询"),
    limit: int = Query(5, description="返回结果数量限制", ge=1, le=20),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    搜索PDF内容
    
    根据查询在指定PDF中搜索相关内容
    """
    results = await PDFService.search_pdf(pdf_id, query, limit)
    
    if not results:
        return {
            "message": "没有找到匹配的内容",
            "results": []
        }
    
    return {
        "message": f"找到 {len(results)} 条匹配结果",
        "results": results
    }


@router.post("/search-to-citation/{pdf_id}")
async def search_pdf_to_citation(
    pdf_id: str,
    query: str = Query(..., description="搜索查询"),
    limit: int = Query(3, description="返回结果数量限制", ge=1, le=10),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    搜索PDF内容并转换为引用格式
    
    根据查询在指定PDF中搜索相关内容，并将结果转换为可直接引用的格式
    """
    # 搜索PDF
    search_results = await PDFService.search_pdf(pdf_id, query, limit)
    
    if not search_results:
        return {
            "message": "没有找到匹配的内容",
            "citations": []
        }
    
    # 将搜索结果转换为引用格式
    citations = []
    for result in search_results:
        citation = await PDFService.convert_pdf_search_to_citation(result)
        citations.append(citation)
    
    return {
        "message": f"找到 {len(citations)} 条引用",
        "citations": citations
    }


@router.get("/list")
async def list_pdfs(
    document_id: Optional[int] = None,
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    列出上传的PDF文件
    
    返回所有上传的PDF文件信息
    """
    # 获取PDF目录中的所有文件
    pdf_files = os.listdir(PDFService.PDF_DIR)
    
    # 解析文件信息
    pdf_list = []
    for file in pdf_files:
        if file.endswith(".pdf"):
            parts = file.split("_", 1)
            if len(parts) == 2:
                pdf_id = parts[0]
                filename = parts[1]
                
                # 检查向量存储状态
                collection_name = f"pdf_{pdf_id}"
                vector_db_path = os.path.join(PDFService.VECTOR_DIR, collection_name)
                processed = os.path.exists(vector_db_path)
                
                pdf_list.append({
                    "pdf_id": pdf_id,
                    "filename": filename,
                    "processed": processed,
                    "upload_time": os.path.getctime(os.path.join(PDFService.PDF_DIR, file))
                })
    
    # 按上传时间排序
    pdf_list.sort(key=lambda x: x["upload_time"], reverse=True)
    
    return {
        "pdfs": pdf_list,
        "count": len(pdf_list)
    }


@router.post("/bulk-search")
async def bulk_search_pdfs(
    query: str = Query(..., description="搜索查询"),
    pdf_ids: List[str] = Query(None, description="要搜索的PDF ID列表，为空则搜索所有PDF"),
    limit_per_pdf: int = Query(2, description="每个PDF返回的结果数量", ge=1, le=5),
    total_limit: int = Query(10, description="总结果数量限制", ge=1, le=20),
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user) # 暂时注释掉认证
):
    """
    批量搜索多个PDF
    
    在多个PDF中搜索相同查询，返回综合结果
    """
    # TODO: 如果pdf_ids为空，从数据库获取用户所有PDF
    # 暂时使用模拟列表
    if not pdf_ids:
        pdf_ids = ["1", "2"]
    
    all_results = []
    
    # 对每个PDF执行搜索
    for pdf_id in pdf_ids:
        results = await PDFService.search_pdf(pdf_id, query, limit_per_pdf)
        all_results.extend(results)
    
    # 按相关性得分排序
    all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    # 限制总结果数量
    all_results = all_results[:total_limit]
    
    # 将搜索结果转换为引用格式
    citations = []
    for result in all_results:
        citation = await PDFService.convert_pdf_search_to_citation(result)
        citations.append(citation)
    
    return {
        "message": f"找到 {len(citations)} 条引用",
        "citations": citations
    } 