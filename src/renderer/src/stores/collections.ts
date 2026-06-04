import { defineStore } from 'pinia'
import { ref } from 'vue'

interface CollectionInfo {
  id: string
  name: string
  metadata: Record<string, unknown> | null
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<CollectionInfo[]>([])
  const counts = ref<Record<string, number>>({})
  const loading = ref(false)

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

  function clear(): void {
    collections.value = []
    counts.value = {}
  }

  return { collections, counts, loading, fetchCollections, clear }
})
