# Jenni.ai Demo - AIpaper项目

## 项目介绍

Jenni.ai Demo是一个学术写作助手工具，提供AI自动补全、引用管理、大纲生成和PDF知识库等功能，旨在帮助研究人员提高写作效率。

## 核心功能

- ✅ AI自动补全：实时提供写作建议，支持继续和重写命令
- ✅ 结构化大纲：可视化管理文档结构，支持一键生成和编辑
- ✅ 引用管理：搜索和格式化引用，支持多种引用格式
- ✅ PDF知识库：上传和搜索PDF文件，提取相关内容作为引用

## 技术栈

### 前端
- Next.js 15.3
- TypeScript
- Tailwind CSS
- Tiptap富文本编辑器
- React Beautiful DnD (拖拽功能)

### 后端
- FastAPI
- SQLAlchemy
- LangChain
- Sentence Transformers (向量检索)
- PyPDF2 (PDF处理)

## 项目结构

```
AIpaper/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── app/             # Next.js应用页面
│   │   ├── components/      # React组件
│   │   ├── services/        # API服务
│   │   ├── styles/          # 样式文件
│   │   ├── types/           # TypeScript类型定义
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   └── package.json         # 依赖配置
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── api/             # API路由
│   │   ├── core/            # 核心配置
│   │   ├── db/              # 数据库模型
│   │   ├── models/          # Pydantic模型
│   │   └── services/        # 业务服务
│   ├── requirements.txt     # Python依赖
│   └── Dockerfile           # 后端Docker配置
├── docs/                    # 项目文档
├── docker-compose.yml       # Docker编排配置
└── README.md                # 项目说明
```

## 已完成功能

1. ✅ 基础项目结构搭建 (Next.js 15.3 + TailwindCSS)
2. ✅ Tiptap 富文本编辑器基础实现
3. ✅ 结构化大纲组件实现
4. ✅ 引用管理组件基础实现 (UI + 引文格式化)
5. ✅ 三栏布局：大纲 + 编辑器 + 引用管理
6. ✅ 引用服务接口实现
7. ✅ AI自动补全基础功能实现
8. ✅ 后端FastAPI基础框架搭建
9. ✅ 引用检索API实现 (Crossref/Semantic Scholar)
10. ✅ 一键生成大纲API实现
11. ✅ PDF上传和检索功能API实现
12. ✅ 前端与后端API集成
13. ✅ PDF知识库前端组件实现
14. ✅ 大纲生成功能前端实现

## 运行项目

### 开发环境

1. 克隆仓库
```bash
git clone https://github.com/your-username/AIpaper.git
cd AIpaper
```

2. 前端开发
```bash
cd frontend
npm install
npm run dev
```

3. 后端开发
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker部署

使用Docker Compose一键启动全部服务:

```bash
docker-compose up -d
```

访问 http://localhost:3000 查看应用

## 下一步工作

1. 完善数据库模型和持久化存储
2. 实现引用检索功能添加PDF内容为引用
3. 完善AI自动补全命令解析逻辑
4. 添加文档版本管理功能
5. 实现用户认证和授权系统

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '[模块] 添加了某功能'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT 