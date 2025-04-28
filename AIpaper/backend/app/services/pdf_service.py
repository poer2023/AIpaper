import os
import uuid
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import asyncio
from pathlib import Path

from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class PDFService:
    """PDF处理服务"""
    
    # 保存PDF文件的目录
    PDF_DIR = os.path.join(settings.UPLOAD_DIR, "pdfs")
    
    # 向量存储目录
    VECTOR_DIR = os.path.join(settings.UPLOAD_DIR, "vectors")
    
    # 确保目录存在
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(VECTOR_DIR, exist_ok=True)
    
    @staticmethod
    async def save_uploaded_pdf(filename: str, file_content: bytes, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        保存上传的PDF文件
        
        Args:
            filename: 文件名
            file_content: 文件内容
            user_id: 用户ID
            
        Returns:
            Dict[str, Any]: 文件信息
        """
        # 生成唯一文件名
        unique_id = str(uuid.uuid4())
        safe_filename = filename.replace(" ", "_")
        file_path = os.path.join(PDFService.PDF_DIR, f"{unique_id}_{safe_filename}")
        
        # 异步写入文件
        async def write_file():
            with open(file_path, "wb") as f:
                f.write(file_content)
        
        # 运行异步任务
        await asyncio.to_thread(lambda: write_file())
        
        # 获取文件信息
        file_info = {
            "id": unique_id,
            "filename": filename,
            "path": file_path,
            "size": len(file_content),
            "upload_time": datetime.now().isoformat(),
            "user_id": user_id
        }
        
        return file_info
    
    @staticmethod
    async def extract_text_from_pdf(file_path: str) -> str:
        """
        从PDF提取文本
        
        Args:
            file_path: PDF文件路径
            
        Returns:
            str: 提取的文本
        """
        try:
            def read_pdf():
                reader = PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n\n"
                return text
            
            # 异步执行PDF读取
            text = await asyncio.to_thread(read_pdf)
            return text
        
        except Exception as e:
            logger.error(f"从PDF提取文本时出错: {e}")
            return ""
    
    @staticmethod
    async def extract_metadata_from_pdf(file_path: str) -> Dict[str, Any]:
        """
        从PDF提取元数据
        
        Args:
            file_path: PDF文件路径
            
        Returns:
            Dict[str, Any]: 元数据
        """
        try:
            def get_metadata():
                reader = PdfReader(file_path)
                metadata = reader.metadata
                
                result = {}
                if metadata:
                    if metadata.title:
                        result["title"] = metadata.title
                    if metadata.author:
                        result["author"] = metadata.author
                    if metadata.creator:
                        result["creator"] = metadata.creator
                    if metadata.producer:
                        result["producer"] = metadata.producer
                    if metadata.subject:
                        result["subject"] = metadata.subject
                
                # 获取页数
                result["pages"] = len(reader.pages)
                
                return result
            
            # 异步执行元数据提取
            metadata = await asyncio.to_thread(get_metadata)
            
            # 提取全文，尝试解析更多元数据
            text = await PDFService.extract_text_from_pdf(file_path)
            
            # 尝试从文本中提取更多元数据
            if text:
                # 如果没有标题，尝试从第一页提取
                if not metadata.get("title"):
                    first_page_text = text.split("\n\n", 1)[0] if "\n\n" in text else text[:500]
                    lines = first_page_text.splitlines()
                    if lines and len(lines[0]) < 200:  # 简单假设：第一行短内容可能是标题
                        metadata["title"] = lines[0].strip()
                
                # 尝试提取DOI
                doi_match = re.search(r'(?:DOI|doi)[:\s]*(10\.\d{4,}(?:\.\d+)*\/\S+)(?:$|\s)', text)
                if doi_match:
                    metadata["doi"] = doi_match.group(1).strip()
                
                # 尝试提取年份
                year_match = re.search(r'(?:©|\(c\)|\(C\)|Copyright)[\s]*(\d{4})', text)
                if year_match:
                    metadata["year"] = year_match.group(1)
                else:
                    # 尝试其他模式查找年份
                    year_match2 = re.search(r'(?:19|20)\d{2}', text[:1000])
                    if year_match2:
                        metadata["year"] = year_match2.group(0)
                
                # 尝试提取摘要
                abstract_match = re.search(r'(?:Abstract|ABSTRACT)[:\s]*([\s\S]{50,1000}?)(?:\n\n|\n[A-Z0-9][A-Z0-9\s]*\n)', text)
                if abstract_match:
                    metadata["abstract"] = abstract_match.group(1).strip()
                
                # 尝试提取关键词
                keywords_match = re.search(r'(?:Keywords|KEYWORDS|Key\s*words)[:\s]*([\s\S]{5,300}?)(?:\n\n|\n[A-Z0-9][A-Z0-9\s]*\n)', text)
                if keywords_match:
                    keywords_text = keywords_match.group(1).strip()
                    # 分割关键词，通常以逗号或分号分隔
                    keywords = [k.strip() for k in re.split(r'[,;]', keywords_text) if k.strip()]
                    metadata["keywords"] = keywords
                
                # 尝试提取作者列表
                if not metadata.get("author"):
                    author_block_match = re.search(r'(?:Abstract|ABSTRACT)[\s\S]{10,2000}?((?:[A-Z][a-z]+(?: [A-Z]\.| [A-Z][a-z]+){1,3}(?:,|\s+and\s+|\s*\n\s*)){1,10})', text[:5000])
                    if author_block_match:
                        authors_text = author_block_match.group(1).strip()
                        authors = [a.strip() for a in re.split(r'(?:,|\s+and\s+|\s*\n\s*)', authors_text) if a.strip()]
                        if authors:
                            metadata["authors"] = authors
                
                # 尝试提取期刊/会议名称
                journal_match = re.search(r'(?:Journal|Proceedings|Conference)[:\s]*([\s\S]{5,100}?)(?:\n\n|\.)', text[:5000])
                if journal_match:
                    metadata["journal"] = journal_match.group(1).strip()
            
            return metadata
        
        except Exception as e:
            logger.error(f"提取PDF元数据时出错: {e}")
            return {"pages": 0}
    
    @staticmethod
    async def process_pdf(pdf_id: str, file_path: str) -> Dict[str, Any]:
        """
        处理PDF文件，包括文本提取、分块和向量化
        
        Args:
            pdf_id: PDF唯一ID
            file_path: PDF文件路径
            
        Returns:
            Dict[str, Any]: 处理结果
        """
        # 提取文本
        text = await PDFService.extract_text_from_pdf(file_path)
        if not text:
            return {
                "success": False,
                "message": "未能从PDF提取文本"
            }
        
        # 提取元数据
        metadata = await PDFService.extract_metadata_from_pdf(file_path)
        
        # 文本分块
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        )
        
        chunks = await asyncio.to_thread(lambda: text_splitter.split_text(text))
        
        # 创建文档对象，带有元数据
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    "pdf_id": pdf_id,
                    "chunk_id": i,
                    "source": os.path.basename(file_path),
                    **metadata
                }
            )
            documents.append(doc)
        
        # 向量化文档
        collection_name = f"pdf_{pdf_id}"
        vector_db_path = os.path.join(PDFService.VECTOR_DIR, collection_name)
        
        # 确保向量存储目录存在
        os.makedirs(vector_db_path, exist_ok=True)
        
        # 创建向量存储
        try:
            embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
            
            async def create_vector_db():
                return Chroma.from_documents(
                    documents,
                    embeddings,
                    persist_directory=vector_db_path
                )
            
            vectordb = await asyncio.to_thread(create_vector_db)
            
            # 持久化向量存储
            await asyncio.to_thread(lambda: vectordb.persist())
            
            return {
                "success": True,
                "message": "PDF处理成功",
                "metadata": metadata,
                "chunk_count": len(chunks)
            }
        
        except Exception as e:
            logger.error(f"向量化PDF时出错: {e}")
            return {
                "success": False,
                "message": f"向量化PDF时出错: {str(e)}"
            }
    
    @staticmethod
    async def search_pdf(pdf_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        搜索PDF内容
        
        Args:
            pdf_id: PDF唯一ID
            query: 搜索查询
            limit: 返回结果限制
            
        Returns:
            List[Dict[str, Any]]: 搜索结果
        """
        collection_name = f"pdf_{pdf_id}"
        vector_db_path = os.path.join(PDFService.VECTOR_DIR, collection_name)
        
        if not os.path.exists(vector_db_path):
            logger.error(f"PDF ID {pdf_id} 的向量存储不存在")
            return []
        
        try:
            # 使用OpenAI嵌入
            embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
            
            # 加载已有的向量存储
            async def load_vectordb():
                return Chroma(
                    persist_directory=vector_db_path,
                    embedding_function=embeddings
                )
            
            vectordb = await asyncio.to_thread(load_vectordb)
            
            # 执行相似性搜索
            async def similarity_search():
                return vectordb.similarity_search_with_score(query, k=limit)
            
            results = await asyncio.to_thread(similarity_search)
            
            # 格式化结果
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": float(score)
                })
            
            return formatted_results
        
        except Exception as e:
            logger.error(f"搜索PDF时出错: {e}")
            return []
        
    @staticmethod
    async def convert_pdf_search_to_citation(search_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        将PDF搜索结果转换为引用格式
        
        Args:
            search_result: PDF搜索结果
            
        Returns:
            Dict[str, Any]: 引用格式
        """
        metadata = search_result.get("metadata", {})
        content = search_result.get("content", "")
        
        # 处理作者信息
        authors = metadata.get("authors", [])
        if not authors and metadata.get("author"):
            # 尝试分割author字段
            author_text = metadata["author"]
            authors = [a.strip() for a in re.split(r'(?:,|;|\s+and\s+|\s*\n\s*)', author_text) if a.strip()]
        
        # 构建引用
        citation = {
            "id": metadata.get("pdf_id", str(uuid.uuid4())),
            "title": metadata.get("title", "未知标题"),
            "authors": authors,
            "year": metadata.get("year"),
            "doi": metadata.get("doi"),
            "journal": metadata.get("journal"),
            "abstract": metadata.get("abstract", content[:200] + "...") if len(content) > 200 else content,
            "content": content,
            "source_type": "pdf",
            "source_id": metadata.get("pdf_id"),
            "page_number": metadata.get("page", None)
        }
        
        return citation 