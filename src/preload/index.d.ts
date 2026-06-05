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
  }
}
