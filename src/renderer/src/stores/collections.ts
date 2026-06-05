import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PAGE_SIZE = 25

interface CollectionInfo {
  id: string
  name: string
  metadata: Record<string, unknown> | null
}

interface DocRecord {
  id: string
  document: string
  metadata: Record<string, unknown>
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<CollectionInfo[]>([])
  const counts = ref<Record<string, number>>({})
  const loading = ref(false)
  const selectedId = ref<string | null>(null)
  const docs = ref<DocRecord[]>([])
  const docsLoading = ref(false)
  const page = ref(1)

  const selected = computed(() =>
    collections.value.find((c) => c.id === selectedId.value) ?? null
  )

  const totalPages = computed(() => {
    const total = selectedId.value ? (counts.value[selectedId.value] ?? 0) : 0
    return Math.max(1, Math.ceil(total / PAGE_SIZE))
  })

  async function fetchCollections(url: string): Promise<void> {
    loading.value = true
    try {
      const list = await window.chromadb.listCollections(url)
      collections.value = list
      for (const col of list) {
        const c = await window.chromadb.getCollectionCount(
          url, 'default_tenant', 'default_database', col.id
        )
        counts.value[col.id] = c
      }
    } finally {
      loading.value = false
    }
  }

  async function selectCollection(url: string, id: string): Promise<void> {
    selectedId.value = id
    page.value = 1
    const c = await window.chromadb.getCollectionCount(url, 'default_tenant', 'default_database', id)
    counts.value[id] = c
    await loadPage(url, id, 1)
  }

  async function loadPage(url: string, collectionId?: string, pageNum?: number): Promise<void> {
    const cid = collectionId ?? selectedId.value
    const p = pageNum ?? page.value
    if (!cid || !url) return

    // Only show loading on first fetch, not on page switches
    if (docs.value.length === 0) docsLoading.value = true
    try {
      const offset = (p - 1) * PAGE_SIZE
      const result = await window.chromadb.getDocuments(
        url, 'default_tenant', 'default_database', cid, PAGE_SIZE, offset
      )
      docs.value = result.ids.map((docId, i) => ({
        id: docId,
        document: result.documents[i] ?? '',
        metadata: result.metadatas[i] ?? {},
      }))
      page.value = p
    } finally {
      docsLoading.value = false
    }
  }

  function clear(): void {
    collections.value = []
    counts.value = {}
    selectedId.value = null
    docs.value = []
    page.value = 1
  }

  return {
    collections, counts, loading,
    selectedId, selected, docs, docsLoading, page, totalPages,
    fetchCollections, selectCollection, loadPage, clear,
  }
})
