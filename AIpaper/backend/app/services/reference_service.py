import aiohttp
import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class CrossrefResponse(BaseModel):
    """Crossref API响应模型"""
    DOI: str
    title: List[str]
    author: Optional[List[Dict[str, Any]]] = None
    publisher: Optional[str] = None
    type: Optional[str] = None
    issued: Optional[Dict[str, List[int]]] = None
    container_title: Optional[List[str]] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    page: Optional[str] = None
    URL: Optional[str] = None

class SemanticScholarResponse(BaseModel):
    """Semantic Scholar API响应模型"""
    paperId: str
    title: str
    authors: List[Dict[str, str]]
    venue: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None
    url: Optional[str] = None
    citationCount: Optional[int] = None

class ReferenceService:
    """引用检索服务"""
    
    # Crossref API端点
    CROSSREF_API_URL = "https://api.crossref.org/works"
    
    # Semantic Scholar API端点
    SEMANTIC_SCHOLAR_API_URL = "https://api.semanticscholar.org/v1/paper"
    
    @staticmethod
    async def search_crossref(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        通过Crossref API搜索引用
        
        Args:
            query: 搜索关键词
            limit: 返回结果数量限制
            
        Returns:
            List[Dict[str, Any]]: 格式化的引用信息列表
        """
        params = {
            "query": query,
            "rows": limit,
            "select": "DOI,title,author,publisher,type,issued,container-title,volume,issue,page,URL"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(ReferenceService.CROSSREF_API_URL, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        items = data.get("message", {}).get("items", [])
                        
                        formatted_results = []
                        for item in items:
                            # 格式化日期
                            published_date = None
                            if item.get("issued") and item["issued"].get("date-parts") and item["issued"]["date-parts"][0]:
                                date_parts = item["issued"]["date-parts"][0]
                                if len(date_parts) >= 1:
                                    year = date_parts[0]
                                    month = date_parts[1] if len(date_parts) >= 2 else 1
                                    day = date_parts[2] if len(date_parts) >= 3 else 1
                                    published_date = f"{year}-{month:02d}-{day:02d}"
                            
                            # 格式化作者
                            authors = []
                            if item.get("author"):
                                for author in item["author"]:
                                    name = ""
                                    if author.get("family") and author.get("given"):
                                        name = f"{author['family']}, {author['given']}"
                                    elif author.get("family"):
                                        name = author["family"]
                                    
                                    if name:
                                        authors.append(name)
                            
                            # 构建引用信息
                            reference = {
                                "doi": item.get("DOI", ""),
                                "title": item.get("title", [""])[0] if item.get("title") else "",
                                "authors": authors,
                                "publisher": item.get("publisher", ""),
                                "published_date": published_date,
                                "journal": item.get("container-title", [""])[0] if item.get("container-title") else "",
                                "volume": item.get("volume", ""),
                                "issue": item.get("issue", ""),
                                "pages": item.get("page", ""),
                                "url": item.get("URL", ""),
                                "source": "crossref"
                            }
                            
                            formatted_results.append(reference)
                            
                        return formatted_results
                    else:
                        logger.error(f"Crossref API返回错误: {response.status}")
                        return []
            
            except Exception as e:
                logger.error(f"搜索Crossref时出错: {e}")
                return []
    
    @staticmethod
    async def search_semantic_scholar(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        通过Semantic Scholar API搜索引用
        
        Args:
            query: 搜索关键词
            limit: 返回结果数量限制
            
        Returns:
            List[Dict[str, Any]]: 格式化的引用信息列表
        """
        # Semantic Scholar搜索API
        SEARCH_API_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
        
        params = {
            "query": query,
            "limit": limit,
            "fields": "paperId,title,authors,venue,year,abstract,url,citationCount"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(SEARCH_API_URL, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        items = data.get("data", [])
                        
                        formatted_results = []
                        for item in items:
                            # 格式化作者
                            authors = []
                            if item.get("authors"):
                                for author in item["authors"]:
                                    if author.get("name"):
                                        # 尝试分割姓名为姓和名
                                        name_parts = author["name"].split()
                                        if len(name_parts) > 1:
                                            family = name_parts[-1]
                                            given = " ".join(name_parts[:-1])
                                            authors.append(f"{family}, {given}")
                                        else:
                                            authors.append(author["name"])
                            
                            # 构建引用信息
                            reference = {
                                "doi": "",  # S2 API不直接提供DOI
                                "title": item.get("title", ""),
                                "authors": authors,
                                "publisher": "",  # S2 API不直接提供publisher
                                "published_date": f"{item.get('year', '')}-01-01" if item.get("year") else None,
                                "journal": item.get("venue", ""),
                                "volume": "",  # S2 API不直接提供volume
                                "issue": "",  # S2 API不直接提供issue
                                "pages": "",  # S2 API不直接提供pages
                                "url": item.get("url", ""),
                                "abstract": item.get("abstract", ""),
                                "citation_count": item.get("citationCount", 0),
                                "source": "semantic_scholar"
                            }
                            
                            formatted_results.append(reference)
                            
                        return formatted_results
                    else:
                        logger.error(f"Semantic Scholar API返回错误: {response.status}")
                        return []
            
            except Exception as e:
                logger.error(f"搜索Semantic Scholar时出错: {e}")
                return []
    
    @staticmethod
    async def search_references(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        同时搜索Crossref和Semantic Scholar，返回合并结果
        
        Args:
            query: 搜索关键词
            limit: 每个源返回的结果数量
            
        Returns:
            List[Dict[str, Any]]: 合并的引用信息列表
        """
        # 并行执行两个API搜索
        crossref_task = asyncio.create_task(ReferenceService.search_crossref(query, limit))
        semantic_scholar_task = asyncio.create_task(ReferenceService.search_semantic_scholar(query, limit))
        
        # 等待两个任务完成
        crossref_results, semantic_scholar_results = await asyncio.gather(
            crossref_task, 
            semantic_scholar_task
        )
        
        # 合并结果
        all_results = crossref_results + semantic_scholar_results
        
        # 根据标题去重（优先保留Crossref的结果）
        unique_results = {}
        for result in all_results:
            title = result["title"].lower()
            if title not in unique_results or result["source"] == "crossref":
                unique_results[title] = result
        
        return list(unique_results.values())
    
    @staticmethod
    def format_citation(reference: Dict[str, Any], style: str = "apa") -> str:
        """
        根据指定样式格式化引用
        
        Args:
            reference: 引用数据
            style: 引用样式 ("apa", "mla", "chicago", "gb")
            
        Returns:
            str: 格式化的引用字符串
        """
        if style == "apa":
            return ReferenceService._format_apa(reference)
        elif style == "mla":
            return ReferenceService._format_mla(reference)
        elif style == "gb":
            return ReferenceService._format_gb(reference)
        else:
            return ReferenceService._format_apa(reference)  # 默认APA格式
    
    @staticmethod
    def _format_apa(reference: Dict[str, Any]) -> str:
        """APA格式化"""
        # 作者
        author_text = ""
        if reference.get("authors"):
            authors = reference["authors"]
            if len(authors) == 1:
                author_text = authors[0]
            elif len(authors) == 2:
                author_text = f"{authors[0]} & {authors[1]}"
            elif len(authors) > 2:
                author_text = f"{authors[0]} et al."
        
        # 年份
        year = ""
        if reference.get("published_date"):
            try:
                date = datetime.strptime(reference["published_date"], "%Y-%m-%d")
                year = date.strftime("%Y")
            except:
                year = reference.get("published_date", "")[:4]
        
        # 标题
        title = reference.get("title", "")
        
        # 期刊
        journal = reference.get("journal", "")
        if journal:
            journal = f"<i>{journal}</i>"
        
        # 卷期页
        volume_issue_pages = ""
        if reference.get("volume"):
            volume_issue_pages += f", <i>{reference['volume']}</i>"
            if reference.get("issue"):
                volume_issue_pages += f"({reference['issue']})"
        if reference.get("pages"):
            volume_issue_pages += f", {reference['pages']}"
        
        # 拼接APA引用格式
        citation = ""
        if author_text:
            citation += f"{author_text}"
        if year:
            citation += f" ({year})."
        if title:
            citation += f" {title}."
        if journal:
            citation += f" {journal}{volume_issue_pages}."
        if reference.get("doi"):
            citation += f" https://doi.org/{reference['doi']}"
        elif reference.get("url"):
            citation += f" {reference['url']}"
        
        return citation
    
    @staticmethod
    def _format_mla(reference: Dict[str, Any]) -> str:
        """MLA格式化"""
        # 作者
        author_text = ""
        if reference.get("authors"):
            authors = reference["authors"]
            if len(authors) == 1:
                author_text = authors[0]
            elif len(authors) == 2:
                author_text = f"{authors[0]} and {authors[1]}"
            elif len(authors) > 2:
                author_text = f"{authors[0]} et al."
        
        # 标题
        title = f"\"{reference.get('title', '')}\""
        
        # 期刊
        journal = reference.get("journal", "")
        if journal:
            journal = f"<i>{journal}</i>"
        
        # 卷期
        volume_issue = ""
        if reference.get("volume"):
            volume_issue += f", vol. {reference['volume']}"
            if reference.get("issue"):
                volume_issue += f", no. {reference['issue']}"
        
        # 年份
        year = ""
        if reference.get("published_date"):
            try:
                date = datetime.strptime(reference["published_date"], "%Y-%m-%d")
                year = date.strftime("%Y")
            except:
                year = reference.get("published_date", "")[:4]
        
        # 页码
        pages = ""
        if reference.get("pages"):
            pages = f", pp. {reference['pages']}"
        
        # 拼接MLA引用格式
        citation = ""
        if author_text:
            citation += f"{author_text}. "
        if title:
            citation += f"{title}. "
        if journal:
            citation += f"{journal}{volume_issue}"
        if year:
            citation += f", {year}"
        if pages:
            citation += f"{pages}"
        citation += "."
        
        if reference.get("doi"):
            citation += f" DOI: {reference['doi']}"
        elif reference.get("url"):
            citation += f" {reference['url']}"
        
        return citation
    
    @staticmethod
    def _format_gb(reference: Dict[str, Any]) -> str:
        """中国标准GB/T 7714格式化"""
        # 作者
        author_text = ""
        if reference.get("authors"):
            authors = reference["authors"]
            if len(authors) <= 3:
                author_text = ", ".join(authors)
            else:
                author_text = f"{authors[0]}, {authors[1]}, {authors[2]}, 等"
        
        # 标题
        title = reference.get("title", "")
        
        # 期刊
        journal = reference.get("journal", "")
        if journal:
            journal = f"[J]. {journal}"
        
        # 出版信息
        pub_info = ""
        if reference.get("year"):
            pub_info += f", {reference['year']}"
        if reference.get("volume"):
            pub_info += f", {reference['volume']}"
            if reference.get("issue"):
                pub_info += f"({reference['issue']})"
        if reference.get("pages"):
            pub_info += f": {reference['pages']}"
        
        # 拼接GB/T 7714引用格式
        citation = ""
        if author_text:
            citation += f"{author_text}. "
        if title:
            citation += f"{title}"
        if journal:
            citation += f"{journal}"
        if pub_info:
            citation += f"{pub_info}"
        citation += "."
        
        if reference.get("doi"):
            citation += f" DOI: {reference['doi']}."
        
        return citation 