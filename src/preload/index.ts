import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {}

const chromadb = {
  heartbeat: (url: string) => ipcRenderer.invoke('chromadb:heartbeat', url),
  listCollections: (url: string) => ipcRenderer.invoke('chromadb:listCollections', url),
  getCollectionCount: (url: string, tenant: string, database: string, collectionId: string) =>
    ipcRenderer.invoke('chromadb:getCollectionCount', url, tenant, database, collectionId),
  getDocuments: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string,
    limit: number,
    offset: number
  ) => ipcRenderer.invoke('chromadb:getDocuments', url, tenant, database, collectionId, limit, offset),
  queryCollection: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string,
    queryTexts: string[],
    nResults: number
  ) => ipcRenderer.invoke('chromadb:queryCollection', url, tenant, database, collectionId, queryTexts, nResults),
  deleteDocuments: (url: string, tenant: string, database: string, collectionId: string, ids: string[]) =>
    ipcRenderer.invoke('chromadb:deleteDocuments', url, tenant, database, collectionId, ids),
  deleteCollection: (url: string, tenant: string, database: string, collectionId: string) =>
    ipcRenderer.invoke('chromadb:deleteCollection', url, tenant, database, collectionId),
}

const storage = {
  saveConnection: (id: string, name: string, url: string, createdAt: string) =>
    ipcRenderer.invoke('storage:saveConnection', id, name, url, createdAt),
  listConnections: () => ipcRenderer.invoke('storage:listConnections'),
  deleteConnection: (id: string) => ipcRenderer.invoke('storage:deleteConnection', id),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('chromadb', chromadb)
    contextBridge.exposeInMainWorld('storage', storage)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.chromadb = chromadb
  // @ts-ignore (define in dts)
  window.storage = storage
}
