# RAGPeek

Desktop debugging tool for RAG retrieval quality — inspect, query, and optimize your vector database.

## Features

- **Connect** to ChromaDB instances (local or remote)
- **Browse** collections with dynamic schema inspection and paginated document tables
- **Query Playground** — semantic search with configurable embedding providers (OpenAI, Zhipu, Ollama, etc.)
- **Edit** documents — multi-select, view detail drawer, copy JSON, batch delete
- **Manage** collections — delete collections directly from the sidebar
- **Dark/Light** themes, collapsible sidebar, Ctrl+/- zoom

## Development

```bash
git clone https://github.com/yyy-router/RAGPeek.git
cd RAGPeek
npm install
npm run dev
```

## Tech Stack

Electron · Vue 3 · TypeScript · Naive UI · Pinia · ECharts · SQLite · ChromaDB

## License

MIT
