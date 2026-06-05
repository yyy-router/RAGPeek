import { ipcMain } from 'electron'
import * as chromadb from './chromadb-client'
import * as database from './database'

export function registerHandlers(): void {
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
    'chromadb:getDocuments',
    (_e, url: string, tenant: string, database: string, collectionId: string, limit: number, offset: number) =>
      chromadb.getCollectionDocuments(url, tenant, database, collectionId, limit, offset)
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

  ipcMain.handle(
    'chromadb:deleteDocuments',
    (_e, url: string, tenant: string, database: string, collectionId: string, ids: string[]) =>
      chromadb.deleteDocuments(url, tenant, database, collectionId, ids)
  )

  ipcMain.handle(
    'chromadb:deleteCollection',
    (_e, url: string, tenant: string, database: string, collectionId: string) =>
      chromadb.deleteCollection(url, tenant, database, collectionId)
  )

  ipcMain.handle('storage:saveConnection', (_e, id: string, name: string, url: string, createdAt: string) =>
    database.saveConnection(id, name, url, createdAt)
  )
  ipcMain.handle('storage:listConnections', () => database.listConnections())
  ipcMain.handle('storage:deleteConnection', (_e, id: string) => database.deleteConnection(id))
}
