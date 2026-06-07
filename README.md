# RAGPeek

面向 RAG 检索质量的桌面调试工具 — 连接 ChromaDB，检查、查询和对比向量检索结果。

## 功能特性

- **连接管理** — 连接本地或远程 ChromaDB 实例，支持保存历史连接
- **集合浏览** — 查看集合列表，动态 Schema 检查，分页浏览文档数据
- **文档编辑** — 多选文档，查看详情，复制 JSON，批量删除
- **Query Playground** — 语义搜索，支持多厂商 Embedding（OpenAI、智谱、Ollama 等）
- **Chunk Compare** — 两个集合并排对比检索结果，验证不同 Chunk 策略的召回质量
- **暗色/亮色主题** — 自动切换，可折叠侧栏，Ctrl+/- 缩放

## 技术栈

Electron · Vue 3 · TypeScript · Naive UI · Pinia · ECharts · SQLite · ChromaDB

## 安装

### 下载安装包（推荐）

在 [Releases](https://github.com/yyy-router/RAGPeek/releases) 页面下载对应平台的安装包。

### 本地开发

```bash
git clone https://github.com/yyy-router/RAGPeek.git
cd RAGPeek
npm install
npm run dev
```

## 使用说明

1. 启动应用后，在顶部输入 ChromaDB 地址（如 `http://localhost:8000`），点击连接
2. 连接成功后，左侧边栏显示所有集合，点击集合进入浏览模式
3. 浏览模式下查看 Schema 和文档，支持多选编辑
4. 切换到 Playground 进行语义搜索，需先在设置中配置 Embedding 服务商
5. 切换到 Compare 选择两个集合进行检索结果对比

## 项目结构

```
src/
├── main/          # Electron 主进程（IPC、ChromaDB 客户端、数据库）
├── preload/       # 预加载脚本（contextBridge 暴露 API）
└── renderer/      # Vue 3 渲染进程
    ├── src/
    │   ├── components/   # 组件
    │   ├── stores/       # Pinia 状态管理
    │   ├── composables/  # 组合式函数
    │   └── styles/       # 主题样式
    └── index.html
```

## 许可证

MIT
