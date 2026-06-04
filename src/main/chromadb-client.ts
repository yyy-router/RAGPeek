const DEFAULT_TENANT = 'default_tenant'
const DEFAULT_DATABASE = 'default_database'

async function request<T>(baseUrl: string, path: string, options?: RequestInit): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    throw new Error(`ChromaDB error ${res.status}: ${await res.text().catch(() => '')}`)
  }
  return res.json()
}

export async function heartbeat(baseUrl: string): Promise<boolean> {
  try {
    const data = await request<{ heartbeat: number }>(baseUrl, '/api/v2/heartbeat')
    return typeof data.heartbeat === 'number'
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
  const data = await request<{ count: number }>(
    baseUrl,
    `/api/v2/tenants/${tenant}/databases/${database}/collections/${collectionId}/count`
  )
  return data.count
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
