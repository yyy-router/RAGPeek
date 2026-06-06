import Database from 'better-sqlite3'
import { app, safeStorage } from 'electron'
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
      url TEXT NOT NULL UNIQUE,
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

const MAX_CONNECTIONS = 20

export function saveConnection(id: string, name: string, url: string, createdAt: string): void {
  const existing = db.prepare('SELECT id FROM connections WHERE url = ?').get(url) as { id: string } | undefined
  if (existing) {
    db.prepare('UPDATE connections SET created_at = ? WHERE id = ?').run(createdAt, existing.id)
  } else {
    db.prepare('INSERT INTO connections (id, name, url, created_at) VALUES (?, ?, ?, ?)').run(
      id, name, url, createdAt
    )
    const count = (db.prepare('SELECT COUNT(*) as n FROM connections').get() as { n: number }).n
    if (count > MAX_CONNECTIONS) {
      db.prepare(
        'DELETE FROM connections WHERE id IN (SELECT id FROM connections ORDER BY created_at ASC LIMIT ?)'
      ).run(count - MAX_CONNECTIONS)
    }
  }
}

export function listConnections(): ConnectionRow[] {
  return db.prepare('SELECT * FROM connections ORDER BY created_at DESC').all() as ConnectionRow[]
}

export function deleteConnection(id: string): void {
  db.prepare('DELETE FROM connections WHERE id = ?').run(id)
}

// --- Settings ---

function ensureSettingsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `)
}

export function getSetting(key: string): string | null {
  ensureSettingsTable()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  ensureSettingsTable()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getSecureSetting(key: string): string | null {
  const val = getSetting(key)
  if (!val) return null
  try {
    return safeStorage.decryptString(Buffer.from(val, 'base64'))
  } catch {
    return null
  }
}

export function setSecureSetting(key: string, value: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }
  const encrypted = safeStorage.encryptString(value).toString('base64')
  setSetting(key, encrypted)
}
