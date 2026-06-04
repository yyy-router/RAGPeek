import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'ragpeek.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)
}

export interface ConnectionRow {
  id: string
  name: string
  url: string
  created_at: string
}

export function saveConnection(id: string, name: string, url: string, createdAt: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO connections (id, name, url, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, name, url, createdAt)
}

export function listConnections(): ConnectionRow[] {
  return db.prepare('SELECT * FROM connections ORDER BY created_at DESC').all() as ConnectionRow[]
}

export function deleteConnection(id: string): void {
  db.prepare('DELETE FROM connections WHERE id = ?').run(id)
}
