# AIpaper - 智能学术写作平台

AIpaper是一个面向研究人员和学生的智能学术写作平台，结合了先进的AI自动补全、引用管理、PDF知识库和版本管理功能，帮助用户高效完成学术写作。

## 主要功能

### 已完成功能

1. **AI辅助写作**
   - 智能自动补全，提供实时写作建议
   - `/continue` 和 `/rewrite` 命令快速生成内容
   - 流式响应，即时呈现AI生成内容

2. **结构化大纲**
   - 一键生成文档大纲功能
   - 大纲与正文双向同步
   - 支持拖拽调整大纲结构

3. **引用管理**
   - 支持Crossref/Semantic Scholar学术数据库检索
   - 多种引用格式支持（APA、MLA、GB/T 7714）
   - 自动格式化引用文献

4. **PDF知识库**
   - PDF文件上传与管理
   - 智能提取PDF元数据
   - 基于向量检索的PDF内容搜索
   - 检索结果一键添加为引用

5. **版本管理与协作**
   - 文档历史版本记录
   - 版本差异对比功能
   - 版本评论系统

## 技术栈

### 前端
- Next.js 15.3
- React
- TailwindCSS
- Tiptap 富文本编辑器

### 后端
- FastAPI
- SQLAlchemy
- PostgreSQL
- Langchain
- OpenAI API

## 系统架构

系统采用前后端分离架构：

1. **前端**：React/Next.js构建的单页应用，负责用户界面及交互
2. **后端API**：FastAPI提供RESTful API服务
3. **数据库**：PostgreSQL存储用户、文档、引用等数据
4. **AI服务**：基于OpenAI API提供自动补全、大纲生成等AI功能
5. **向量存储**：使用Langchain/Chroma存储PDF内容向量，支持语义检索

## 安装与配置

### 环境要求
- Node.js >= 16.0
- Python >= 3.9
- PostgreSQL >= 12.0

### 前端安装
```bash
# 安装依赖
npm install

# 开发环境启动
npm run dev

# 构建生产版本
npm run build
npm run start
```

### 后端安装
```bash
# 安装依赖
pip install -r requirements.txt

# 初始化数据库
alembic upgrade head

# 启动后端服务
uvicorn app.main:app --reload
```

## 环境变量配置

创建`.env`文件配置环境变量：

```
# 后端服务
DATABASE_URL=postgresql://username:password@localhost/aipaper
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your_secret_key

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 下一步计划

1. **部署与测试**
   - 部署应用到测试环境
   - 进行性能优化和负载测试

2. **用户认证与权限**
   - 实现完整的用户认证系统
   - 添加文档访问权限管理
   - 支持团队协作

3. **高级功能**
   - 协作编辑功能
   - 主题模板系统
   - 支持导出为多种格式（Word、PDF、LaTeX等）
   - 引用格式本地化支持

## 贡献

欢迎提交Issue或Pull Request，一起完善AIpaper平台！

## 许可

[MIT License](LICENSE) 