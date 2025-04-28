# Jenni.ai Demo 复刻 — 完整 PRD (Next.js 15.3)

> **目的**：在 Cursor 编辑器内快速验证并演示 Jenni.ai 全套核心写作体验，包括 AI 自动补全、结构化大纲、引用管理、PDF 知识检索、版本 diff & 协作。目标运行环境为 4C 8 GB 云服务器 (Ubuntu 22.04)，使用现成 PostgreSQL 实例。

---

## 1 功能范围
| 模块 | 说明 | 关键指标 |
|------|------|----------|
| **AI 自动补全** | 基于 GPT‑4o 流式续写、改写、扩写；空格 300 ms 内触发建议；`/rewrite`、`/continue` 命令 | P95 延迟 ≤ 800 ms；接受率 ≥ 30 % |
| **结构化大纲** | 一键生成文章大纲；拖拽章节重排后实时同步正文 | 大纲生成准确率(人工评估) ≥ 80 % |
| **引用检索 & 格式化** | Crossref / Semantic Scholar｜PDF 元数据检索；插入脚注 `[n]` & 文末 References；支持 APA / MLA / GB/T 7714 | 引用匹配准确率 ≥ 95 % |
| **样式切换** | 单击切换整篇引用风格；脚注‑文献映射保持一致 | 切换耗时 < 2 s |
| **PDF 知识库检索** | 上传 ≤ 10 MB PDF；向量化分块检索；Answer / 引用 | Top‑3 命中率 ≥ 85 % |
| **版本 diff & 评论** | 保存每次编辑后的文本快照；双栏 diff 视图；@评论 | 历史追溯 30 天；diff 渲染 < 1 s |

---

## 2 技术栈
| 层级 | 选型 | 理由 |
|------|------|------|
| **前端** | Next.js 15.3 (App Router + TS) · Shadcn/ui · TailwindCSS | 与团队技能匹配，支持 React 18 Streaming |
| **富文本** | Tiptap + Yjs (CRDT) | 插件生态完善，天然支持协作 & diff |
| **后端** | FastAPI 0.111 / Python 3.12 | 类型安全；易扩展 LLM Gateway |
| **AI Gateway** | LangChain Router → GPT‑4o / Gemini / DeepSeek 可插拔 | 兼顾成本与质量 |
| **向量库** | Chroma (local SQLite backend) **或** Qdrant Docker | 单节点即可满足小规模检索 |
| **主数据库** | **PostgreSQL 15 (云端服务 / Docker)** | 已有资源；存储用户、文档、版本快照、引用元数据 |
| **文件存储** | 云服务器本地 `/opt/app/uploads/` | Demo 阶段无需对象存储 |
| **部署** | Docker Compose (nginx‑proxy + web + api + qdrant) | 一条命令启动；适配 4C 8G |

---

## 3 核心流程
1. **AI 自动补全**  
   * 客户端捕获最近 ≤1 000 token 上下文 → `/api/complete`  
   * FastAPI 拼接大纲摘要 Prompt → GPT‑4o ChatCompletion (stream)  
   * SSE push；Tiptap 将建议渲染为灰色幻影，Tab 键接受

2. **结构化大纲**  
   * 用户点击『生成大纲』→ `/api/outline`  
   * LLM 依据标题 & 摘要输出 markdown 列表  
   * 大纲节点与正文段落通过同一 id 链接；拖拽后发送 patch 更新

3. **引用检索**  
   * `/cite 关键词` 或 PDF 段落选中 → 调用 Crossref/SS API + 本地 PDF 元数据  
   * 返回 CSL‑JSON → citeproc‑py 渲染为所选格式  
   * 插入脚注编号；Reference 列表实时刷新

4. **版本 diff**  
   * 每次用户保存时，将文档 AST 存入 `revisions` 表，并生成 `diff` (google‑diff‑match‑patch)  
   * 前端 diff viewer 双栏高亮变化；支持时间线回滚

5. **PDF 检索**  
   * PyPDF 提取文本 → 300 词分块 → `text-embedding-3-small`  
   * 嵌入存入向量库；查询时取 Top‑k & 生成答案

---

## 4 里程碑 (T = 项目启动)
| 日期 | 交付物 |
|------|--------|
| **T+3 天** | 基础仓库 (Next.js 15.3 + FastAPI + PostgreSQL 接入脚手架) |
| **T+7 天** | AI 自动补全 MVP (本地流式) |
| **T+11 天** | 结构化大纲生成与编辑联调 |
| **T+14 天** | 引用检索 & 格式化 (三种样式) |
| **T+17 天** | PDF 上传 & 检索模块 |
| **T+20 天** | 版本 diff & 评论功能 |
| **T+22 天** | 集成测试 + 演示录像 |

---

## 5 非功能
* **性能**：单用户 ≤ 2 并发；P95 补全延迟 ≤ 800 ms。
* **成本**：每日 token 限额 5 000；超额提示。
* **安全**：OAuth (GitHub) 登录；API key 与文件存储仅本机访问。
* **备份**：PostgreSQL WAL + 每日快照；`uploads/` 定期 rsync。

---

## 6 风险 & 对策
| 风险 | 影响 | 应对 |
|------|------|------|
| LLM 成本不可控 | 费用超标 | 词数/天 限流；离线批量向量化 |
| 引用 API 限流 | 引用失败 | 本地缓存 24 h；退化到 PDF 元数据 |
| PDF OCR 失败 | 数据缺失 | 提示『扫描版暂不支持』或调 Google Vision OCR |
| 单机资源瓶颈 | 性能下降 | Docker Compose 预设 CPU/内存 limits；监控 top 1% 慢查询 |

---

> **结论**：在 4C 8G 云服务器上，通过 Docker Compose 部署即可完成 Demo；保持所有 Jenni.ai 核心功能，侧重验证写作流与引用体验。 