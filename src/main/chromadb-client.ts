import http from 'http'

const DEFAULT_TENANT = 'default_tenant'
const DEFAULT_DATABASE = 'default_database'

function request<T>(baseUrl: string, path: string, opts?: { method?: string; body?: string }): Promise<T> {
  return new Promise((resolve, reject) => {
    const u = new URL(path, baseUrl.replace(/\/$/, ''))
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: opts?.method ?? 'GET',
        family: 4,
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`ChromaDB error ${res.statusCode}: ${body.slice(0, 200)}`))
          } else {
            try {
              resolve(JSON.parse(body) as T)
            } catch {
              reject(new Error(`Failed to parse response: ${body.slice(0, 200)}`))
            }
          }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Request timeout')) })
    if (opts?.body) req.write(opts.body)
    req.end()
  })
}

export async function heartbeat(baseUrl: string): Promise<boolean> {
  try {
    const data = await request<{ heartbeat: number } | { 'nanosecond heartbeat': number }>(
      baseUrl,
      '/api/v2/heartbeat'
    )
    return typeof (data as any).heartbeat === 'number' ||
           typeof (data as any)['nanosecond heartbeat'] === 'number'
  } catch {
    return false
  }
}

export async function listCollections(
  baseUrl: string,
  tenant: string = DEFAULT_TENANT,
  database: string = DEFAULT_DATABASE
): Promise<{ id: string; name: string; metadata: Record<string, unknown> | null }[]> {
  return request(baseUrl, `/api/v2/tenants/${tenant}/databases/${database}/collections`)
}

export async function getCollectionCount(
  baseUrl: string,
  tenant: string,
  database: string,
  collectionId: string
): Promise<number> {
  const data = await request<number>(
    baseUrl,
    `/api/v2/tenants/${tenant}/databases/${database}/collections/${collectionId}/count`
  )
  return data
}

export async function getCollectionDocuments(
  baseUrl: string,
  tenant: string,
  database: string,
  collectionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ ids: string[]; documents: string[]; metadatas: Record<string, unknown>[] }> {
  return request(baseUrl, `/api/v2/tenants/${tenant}/databases/${database}/collections/${collectionId}/get`, {
    method: 'POST',
    body: JSON.stringify({ limit, offset, include: ['documents', 'metadatas'] }),
  })
}

export async function queryCollection(
  baseUrl: string,
  tenant: string,
  database: string,
  collectionId: string,
  queryTexts: string[],
  nResults: number
): Promise<{ ids: string[][]; documents: string[][]; metadatas: Record<string, unknown>[][]; distances: number[][] }> {
  return request(baseUrl, `/api/v2/tenants/${tenant}/databases/${database}/collections/${collectionId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query_texts: queryTexts,
      n_results: nResults,
      include: ['documents', 'metadatas', 'distances'],
    }),
  })
}
