import { ipcMain } from 'electron'
import * as chromadb from './chromadb-client'

export function registerChromadbHandlers(): void {
  ipcMain.handle('chromadb:heartbeat', (_e, url: string) => chromadb.heartbeat(url))

  ipcMain.handle('chromadb:listCollections', (_e, url: string) =>
    chromadb.listCollections(url)
  )

  ipcMain.handle(
    'chromadb:getCollectionCount',
    (_e, url: string, tenant: string, database: string, collectionId: string) =>
      chromadb.getCollectionCount(url, tenant, database, collectionId)
  )

  ipcMain.handle(
    'chromadb:queryCollection',
    (
      _e,
      url: string,
      tenant: string,
      database: string,
      collectionId: string,
      queryTexts: string[],
      nResults: number
    ) => chromadb.queryCollection(url, tenant, database, collectionId, queryTexts, nResults)
  )
}
