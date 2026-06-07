<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NSelect, NButton, NInput, NSpin, NText } from 'naive-ui'
import { ZapIcon, GitCompareIcon } from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useCollectionsStore } from '../stores/collections'

const conn = useConnectionStore()
const colStore = useCollectionsStore()

const colA = ref<string | null>(null)
const colB = ref<string | null>(null)
const queryText = ref('')
const k = ref(5)
const running = ref(false)
const error = ref<string | null>(null)

interface ResultDoc { id: string; document: string; metadata: Record<string, unknown>; distance: number | null }

const resultsA = ref<ResultDoc[]>([])
const resultsB = ref<ResultDoc[]>([])
const elapsedA = ref(0)
const elapsedB = ref(0)

const kOptions = [3, 5, 10, 20, 50].map(v => ({ label: `Top ${v}`, value: v }))
const collectionOpts = computed(() => colStore.collections.map(c => ({ label: c.name, value: c.id })))
const providers = ref<{ id: string; name: string }[]>([])
const providerId = ref<string | null>(null)

onMounted(async () => {
  const raw = await window.settings.get('embedding_providers')
  if (raw) {
    try { providers.value = JSON.parse(raw) } catch {}
    if (providers.value.length) providerId.value = providers.value[0].id
  }
})

async function runCompare(): Promise<void> {
  if (!queryText.value.trim() || !colA.value || !colB.value || !providerId.value) return
  running.value = true
  error.value = null
  resultsA.value = []
  resultsB.value = []

  try {
    const raw = await window.settings.get('embedding_providers')
    const all = raw ? JSON.parse(raw) : []
    const prov = all.find((p: any) => p.id === providerId.value)
    if (!prov) throw new Error('Provider not found')
    const apiKey = (await window.settings.getSecure(`embedding_key_${prov.id}`)) || ''
    const dims = prov.dimensions ? Number(prov.dimensions) : undefined
    const embedding = await window.embedding.create(prov.endpoint, apiKey, prov.model, dims, queryText.value.trim())

    const t0 = performance.now()
    const resA = await window.chromadb.queryByEmbedding(conn.currentUrl, 'default_tenant', 'default_database', colA.value, embedding, k.value)
    elapsedA.value = Math.round(performance.now() - t0)
    resultsA.value = (resA.ids[0] ?? []).map((id, i) => ({
      id, document: resA.documents[0]?.[i] ?? '', metadata: resA.metadatas[0]?.[i] ?? {}, distance: resA.distances[0]?.[i] ?? null,
    }))

    const t1 = performance.now()
    const resB = await window.chromadb.queryByEmbedding(conn.currentUrl, 'default_tenant', 'default_database', colB.value, embedding, k.value)
    elapsedB.value = Math.round(performance.now() - t1)
    resultsB.value = (resB.ids[0] ?? []).map((id, i) => ({
      id, document: resB.documents[0]?.[i] ?? '', metadata: resB.metadatas[0]?.[i] ?? {}, distance: resB.distances[0]?.[i] ?? null,
    }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Compare failed'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="cv">
    <div class="cv-bar">
      <div class="cv-bar-row">
        <GitCompareIcon :size="14" class="cv-bar-icon" />
        <NSelect v-model:value="colA" :options="collectionOpts" size="small" placeholder="Collection A" style="width:200px" placement="bottom-start" :to="false" />
        <span class="cv-vs">vs</span>
        <NSelect v-model:value="colB" :options="collectionOpts" size="small" placeholder="Collection B" style="width:200px" placement="bottom-start" :to="false" />
        <NSelect v-if="providers.length" v-model:value="providerId" :options="providers.map(p => ({ label: p.name, value: p.id }))" size="small" style="width:140px" placement="bottom-start" :to="false" />
      </div>
      <div class="cv-bar-row">
        <NInput v-model:value="queryText" size="small" placeholder="Enter query and press Enter..." style="flex:1" @keydown.enter="runCompare" />
        <NSelect v-model:value="k" :options="kOptions" size="small" style="width:90px" placement="bottom-start" :to="false" />
        <NButton type="primary" size="small" :loading="running" :disabled="!queryText.trim() || !colA || !colB" @click="runCompare">
          <template #icon><ZapIcon :size="13" /></template>Compare
        </NButton>
      </div>
    </div>

    <div v-if="running" class="cv-status"><NSpin :size="16" /> Comparing...</div>
    <div v-else-if="error" class="cv-status error">{{ error }}</div>

    <div v-if="resultsA.length || resultsB.length" class="cv-results">
      <div class="cv-col">
        <div class="cv-col-hd">{{ collectionOpts.find(o => o.value === colA)?.label || 'A' }} <span class="cv-time">{{ resultsA.length }} · {{ elapsedA }}ms</span></div>
        <div v-for="(r, i) in resultsA" :key="r.id" class="cv-card">
          <div class="cv-card-hd"><span class="cv-rank">#{{ i + 1 }}</span><code class="cv-id">{{ r.id }}</code><span class="cv-score" :class="{ best: i === 0 }">{{ r.distance?.toFixed(4) ?? '—' }}</span></div>
          <p class="cv-doc">{{ r.document.slice(0, 250) }}{{ r.document.length > 250 ? '...' : '' }}</p>
        </div>
      </div>
      <div class="cv-col">
        <div class="cv-col-hd">{{ collectionOpts.find(o => o.value === colB)?.label || 'B' }} <span class="cv-time">{{ resultsB.length }} · {{ elapsedB }}ms</span></div>
        <div v-for="(r, i) in resultsB" :key="r.id" class="cv-card">
          <div class="cv-card-hd"><span class="cv-rank">#{{ i + 1 }}</span><code class="cv-id">{{ r.id }}</code><span class="cv-score" :class="{ best: i === 0 }">{{ r.distance?.toFixed(4) ?? '—' }}</span></div>
          <p class="cv-doc">{{ r.document.slice(0, 250) }}{{ r.document.length > 250 ? '...' : '' }}</p>
        </div>
      </div>
    </div>

    <div v-else class="cv-empty"><NText depth="3">Select two collections, enter a query, and run comparison</NText></div>
  </div>
</template>

<style scoped>
.cv { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.cv-bar {
  display: flex; flex-direction: column; gap: 8px; padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); flex-shrink: 0;
}
.cv-bar-row {
  display: flex; align-items: center; gap: 8px;
}
.cv-bar-icon { color: var(--accent); flex-shrink: 0; }
.cv-vs { font-size: 11px; color: var(--text-muted); font-weight: 600; }

.cv-status { padding: 8px 20px; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); flex-shrink: 0; }
.cv-status.error { color: var(--danger); }

.cv-results { flex: 1; overflow: hidden; display: flex; }
.cv-col { flex: 1; overflow-y: auto; padding: 8px 10px; }
.cv-col:first-child { border-right: 1px solid var(--border-default); }
.cv-col-hd { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; padding: 0 4px; }
.cv-time { font-weight: 400; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.cv-card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 10px; margin-bottom: 6px; }
.cv-card:hover { border-color: var(--border-default); }
.cv-card-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.cv-rank { font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 20px; }
.cv-id { font-family: var(--font-mono); font-size: 11px; color: var(--accent); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cv-score { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); background: var(--bg-root); padding: 1px 6px; border-radius: 3px; }
.cv-score.best { color: var(--success); }
.cv-doc { font-size: 12px; line-height: 1.6; color: var(--text-primary); margin: 0; }
.cv-empty { display: flex; align-items: center; justify-content: center; height: 100%; }
</style>
