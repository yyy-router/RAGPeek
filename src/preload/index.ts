import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {}

const chromadb = {
  heartbeat: (url: string) => ipcRenderer.invoke('chromadb:heartbeat', url),
  listCollections: (url: string) => ipcRenderer.invoke('chromadb:listCollections', url),
  getCollectionCount: (url: string, tenant: string, database: string, collectionId: string) =>
    ipcRenderer.invoke('chromadb:getCollectionCount', url, tenant, database, collectionId),
  queryCollection: (
    url: string,
    tenant: string,
    database: string,
    collectionId: string,
    queryTexts: string[],
    nResults: number
  ) => ipcRenderer.invoke('chromadb:queryCollection', url, tenant, database, collectionId, queryTexts, nResults),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('chromadb', chromadb)
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
}
