import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
  const connected = ref(false)
  const currentUrl = ref('')
  const currentName = ref('')
  const connecting = ref(false)
  const error = ref<string | null>(null)
  const savedConnections = ref<{ id: string; name: string; url: string }[]>([])

  async function loadSaved(): Promise<void> {
    savedConnections.value = await window.storage.listConnections().then((rows) =>
      rows.map((r) => ({ id: r.id, name: r.name, url: r.url }))
    )
  }

  async function connect(url: string): Promise<boolean> {
    connecting.value = true
    error.value = null
    try {
      const ok = await window.chromadb.heartbeat(url)
      if (!ok) throw new Error('Unable to reach ChromaDB')
      connected.value = true
      currentUrl.value = url
      currentName.value = new URL(url).hostname
      const id = crypto.randomUUID()
      await window.storage.saveConnection(id, currentName.value, url, new Date().toISOString())
      await loadSaved()
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Connection failed'
      return false
    } finally {
      connecting.value = false
    }
  }

  function disconnect(): void {
    connected.value = false
    currentUrl.value = ''
    currentName.value = ''
  }

  return { connected, currentUrl, currentName, connecting, error, savedConnections, loadSaved, connect, disconnect }
})
