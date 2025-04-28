# 本地文档上传-向量化-引用模块 PRD

## 1. 功能构建

| 编号 | 功能 | 说明 | 关键数据/状态 |
|-----|------|------|-------------|
| F1 | 文档上传 | 支持 PDF / DOCX / TXT；单文件 ≤10MB；拖拽或按钮上传 | file_id, original_name, size, user_id |
| F2 | 文本提取 | ·PDF: PyPDF2 提取文字；检测扫描版一报错·DOCX: python-docx·TXT: 直接读取 | raw_text, page_count |
| F3 | 向量化切片 | ① 以 ~300 词一段切片② 调用 text-embedding-3-small 生成向量③ 写入 Qdrant(doc_id, chunk_id, vector, content) | chunk_size=300, embedding_model = text-embedding-3-small |
| F4 | 元数据提取 | 从首页+正则匹配 Title, Authors, Year, DOI；失败时允许用户手动填 | meta_{title,authors,year,doi} |
| F5 | 文献卡片列表 | /library 页面按卡片展示布局：封面·标题·作者(前2人)+et.al.·年份·页数 \| 上传时间 | cover_icon 根据文件类型显示 |
| F6 | 检索 & 插入引用 | 编辑器选中文字→ 发 /api/search?query=~ 后端用向量量 Top-k=5 → 返回 chunks用户点击某条 → 在正文文档中插入 [n] 并生成引用： 作者, 年份, 标题, 页码 + 引用段落 | citation_id = doc_id#chunk_id; 引用列表实时更新 |
| F7 | 去重 & 统一编号 | 同一 citation_id 多次引用时复用脚注号 | 脚注编号去重 |

## 2. 数据表 (PostgreSQL)

| 表 | 字段要点 |
|----|---------|
| documents | id PK, user_id, file_path, title, authors, year, doi, page_count, created_at |
| chunks | id PK, doc_id FK, chunk_index, content, vector (由 Qdrant 特) |  
| citations | id PK, doc_id, chunk_id, paragraph_idx, created_at |

## 3. API

| Method | Path | 描述 |
|--------|------|------|
| POST | /api/upload | 上传文件, 返回 doc_id |
| GET | /api/library | 分页返回用户全部文献卡片 |
| POST | /api/search | { query, top_k } → 返回匹配 chunks |
| POST | /api/cite | { citation_id } → 生成/返回脚注号 |

## 4. 测试用例

| TC | 场景 | 输入 | 预期 |
|----|------|------|------|
| TC1 | 上传合法 PDF | 5 MB PDF | 状态 200, 返回 doc_id, 文档计数+1 |
| TC2 | 上传扫描版 PDF | 图片扫描 PDF | 返回 415 + "scanned_not_supported" |
| TC3 | 提取元数据成功 | 包含 DOI 的 PDF | documents.title/doi 自动填充 |
| TC4 | 搜索命中 | query="neural network" | Top-k 返回 ≥1 chunks, score 降序 |
| TC5 | 引用去重 | 同一段引用两次 | 脚注编号不变, 引用次数+1 |
| TC6 | 卡片渲染 | Library 页 | 卡片展示标题、作者、年份、类型图标 |
| TC7 | 10MB+1 byte 文件 | 10.000.001 B | 返回 413 "payload too large" |

## 5. 验收标准

1. P95 上传-抽取-向量化 < 6s / 10MB.
2. Top-3 检索准确率(人工评估) ≥ 85%.
3. 空库搜索返回空态提示; 卡片加载第一屏 ≤ 200ms. 