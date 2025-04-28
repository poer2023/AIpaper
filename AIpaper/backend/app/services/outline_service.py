from typing import Dict, List, Any, Optional
import json
import logging
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseMessage, HumanMessage, SystemMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class OutlineService:
    """大纲生成服务"""
    
    # 系统提示词
    SYSTEM_PROMPT = """你是一位专业的学术写作助手，帮助用户生成结构化的论文或文章大纲。
请根据用户提供的标题和可能的部分内容，生成一个有层次的详细大纲。
大纲应该遵循学术写作的标准结构，如果是研究论文，通常包括：
- 引言（研究背景、问题陈述、研究目的）
- 文献综述/相关工作
- 研究方法/方法论
- 结果
- 讨论
- 结论
根据内容的不同，可以灵活调整结构。

大纲应该以JSON格式返回，结构如下：
[
  {
    "id": "1",
    "text": "章节标题",
    "children": [
      {
        "id": "1.1",
        "text": "小节标题",
        "children": []
      }
    ]
  }
]
"""

    @staticmethod
    async def generate_outline(title: str, partial_content: Optional[str] = None, outline_depth: int = 2) -> List[Dict[str, Any]]:
        """
        生成文章大纲
        
        Args:
            title: 文章标题
            partial_content: 已有的部分内容（可选）
            outline_depth: 大纲层级深度
            
        Returns:
            List[Dict[str, Any]]: 大纲结构
        """
        # 构建提示词
        messages = [
            SystemMessage(content=OutlineService.SYSTEM_PROMPT),
        ]
        
        user_message = f"请为以下标题生成一个{outline_depth}级大纲结构：\n\n标题：{title}"
        if partial_content:
            user_message += f"\n\n已有内容：\n{partial_content}"
        
        user_message += f"\n\n请确保大纲深度不超过{outline_depth}级，并保持合理的学术结构。返回JSON结构，不要加额外解释。"
        
        messages.append(HumanMessage(content=user_message))
        
        # 调用语言模型
        try:
            model = ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=settings.MODEL_NAME,
                temperature=0.2,
                streaming=False
            )
            
            response = await model.ainvoke(messages)
            response_content = response.content
            
            # 尝试从回复中解析JSON
            try:
                # 如果响应包含围绕JSON的标记，需要提取JSON部分
                if "```json" in response_content:
                    json_str = response_content.split("```json")[1].split("```")[0].strip()
                    outline = json.loads(json_str)
                else:
                    outline = json.loads(response_content.strip())
                
                return outline
            
            except json.JSONDecodeError as e:
                logger.error(f"解析大纲JSON出错: {e}, 原始响应: {response_content}")
                # 在解析失败时提供默认大纲
                return OutlineService._get_default_outline(title)
        
        except Exception as e:
            logger.error(f"生成大纲时遇到错误: {e}")
            return OutlineService._get_default_outline(title)
    
    @staticmethod
    def _get_default_outline(title: str) -> List[Dict[str, Any]]:
        """提供默认大纲结构"""
        return [
            {
                "id": "1",
                "text": "引言",
                "children": [
                    {"id": "1.1", "text": "研究背景", "children": []},
                    {"id": "1.2", "text": "研究目的", "children": []}
                ]
            },
            {
                "id": "2",
                "text": "文献综述",
                "children": [
                    {"id": "2.1", "text": "相关理论", "children": []},
                    {"id": "2.2", "text": "研究现状", "children": []}
                ]
            },
            {
                "id": "3",
                "text": "研究方法",
                "children": [
                    {"id": "3.1", "text": "数据收集", "children": []},
                    {"id": "3.2", "text": "分析方法", "children": []}
                ]
            },
            {
                "id": "4",
                "text": "结果与讨论",
                "children": [
                    {"id": "4.1", "text": "主要发现", "children": []},
                    {"id": "4.2", "text": "结果分析", "children": []}
                ]
            },
            {
                "id": "5",
                "text": "结论",
                "children": []
            }
        ] 