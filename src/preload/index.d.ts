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

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    chromadb: ChromaDBAPI
  }
}
