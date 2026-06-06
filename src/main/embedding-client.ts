import http from 'http'
import https from 'https'

interface EmbeddingConfig {
  endpoint: string
  apiKey: string
  model: string
  dimensions?: number
}

export async function createEmbedding(config: EmbeddingConfig, text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const u = new URL(config.endpoint)
    const payload: Record<string, unknown> = { model: config.model, input: text }
    if (config.dimensions) payload.dimensions = config.dimensions
    const body = JSON.stringify(payload)
    const transport = u.protocol === 'https:' ? https : http

    const req = transport.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        family: 4,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`Embedding error ${res.statusCode}: ${data.slice(0, 300)}`))
            return
          }
          try {
            const json = JSON.parse(data)
            const embedding = json.data?.[0]?.embedding
            if (!embedding || !Array.isArray(embedding)) {
              reject(new Error('Invalid embedding response'))
              return
            }
            resolve(embedding)
          } catch {
            reject(new Error('Failed to parse embedding response'))
          }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Embedding request timeout')) })
    req.write(body)
    req.end()
  })
}
