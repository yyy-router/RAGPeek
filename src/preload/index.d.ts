import { ElectronAPI } from '@electron-toolkit/preload'

interface ChromaDBAPI {
  heartbeat: (url: string) => Promise<boolean>
  listCollections: (url: string) => Promise<
    { id: string; name: string; metadata: Record<string, unknown> | null }[]
  >
  getCollectionCount: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string
  ) => Promise<number>
  getDocuments: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string,
    limit: number,
    offset: number
  ) => Promise<{
    ids: string[]
    documents: string[]
    metadatas: Record<string, unknown>[]
  }>
  deleteDocuments: (url: string, tenant: string, database: string, collectionId: string, ids: string[]) => Promise<void>
  deleteCollection: (url: string, tenant: string, database: string, collectionId: string) => Promise<void>
  queryByEmbedding: (
    url: string, tenant: string, database: string,
    collectionId: string, embedding: number[], nResults: number
  ) => Promise<{
    ids: string[][]; documents: string[][]; metadatas: Record<string, unknown>[][]; distances: number[][]
  }>
  queryCollection: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string,
    queryTexts: string[],
    nResults: number
  ) => Promise<{
    ids: string[][]
    documents: string[][]
    metadatas: Record<string, unknown>[][]
    distances: number[][]
  }>
}

interface ConnectionRow {
  id: string
  name: string
  url: string
  created_at: string
}

interface EmbeddingAPI {
  create: (endpoint: string, apiKey: string, model: string, dimensions: number | undefined, text: string) => Promise<number[]>
}

interface StorageAPI {
  saveConnection: (id: string, name: string, url: string, createdAt: string) => Promise<void>
  listConnections: () => Promise<ConnectionRow[]>
  deleteConnection: (id: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    chromadb: ChromaDBAPI
    storage: StorageAPI
    settings: { get: (k: string) => Promise<string | null>, set: (k: string, v: string) => Promise<void>, getSecure: (k: string) => Promise<string | null>, setSecure: (k: string, v: string) => Promise<void> }
    embedding: EmbeddingAPI
  }
}
