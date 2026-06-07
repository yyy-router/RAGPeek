<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { NSelect, NButton, NSpin, NText } from 'naive-ui'
import { SearchIcon, ZapIcon } from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useCollectionsStore } from '../stores/collections'

const props = defineProps<{
  compareA?: string | null
  compareB?: string | null
  compareQuery?: string
}>()

const conn = useConnectionStore()
const colStore = useCollectionsStore()

const queryText = ref('')
const k = ref(5)
const running = ref(false)
const providerId = ref<string | null>(null)
const providers = ref<{ id: string; name: string }[]>([])

watch(() => props.compareQuery, (q) => {
  if (q && props.compareA && props.compareB) {
    queryText.value = q
    comparing.value = true
    runQuery()
  }
})

onMounted(async () => {
  const raw = await window.settings.get('embedding_providers')
  if (raw) {
    try { providers.value = JSON.parse(raw) } catch {}
    if (providers.value.length) providerId.value = providers.value[0].id
  }
})
const error = ref<string | null>(null)

interface ResultDoc {
  id: string
  document: string
  metadata: Record<string, unknown>
  distance: number | null
}

const results = ref<ResultDoc[]>([])
const resultsB = ref<ResultDoc[]>([])
const elapsed = ref(0)
const elapsedB = ref(0)
const comparing = ref(false)

const kOptions = [3, 5, 10, 20, 50].map((v) => ({ label: `Top ${v}`, value: v }))

async function runQuery(): Promise<void> {
  if (!queryText.value.trim() || !colStore.selected) return
  running.value = true
  error.value = null
  results.value = []

  const t0 = performance.now()
  try {
    if (!providerId.value) {
      error.value = 'Select an embedding provider'
      return
    }
    const raw = await window.settings.get('embedding_providers')
    const all = raw ? JSON.parse(raw) : []
    const prov = all.find((p: any) => p.id === providerId.value)
    if (!prov) { error.value = 'Provider not found'; return }

    const apiKey = (await window.settings.getSecure(`embedding_key_${prov.id}`)) || ''
    const dims = prov.dimensions ? Number(prov.dimensions) : undefined

    const embedding = await window.embedding.create(prov.endpoint, apiKey, prov.model, dims, queryText.value.trim())

    const res = await window.chromadb.queryByEmbedding(
      conn.currentUrl,
      'default_tenant',
      'default_database',
      colStore.selected.id,
      embedding,
      k.value
    )

    results.value = (res.ids[0] ?? []).map((id, i) => ({
      id,
      document: res.documents[0]?.[i] ?? '',
      metadata: res.metadatas[0]?.[i] ?? {},
      distance: res.distances[0]?.[i] ?? null,
    }))
    elapsed.value = Math.round(performance.now() - t0)

    if (comparing.value && props.compareB) {
      const t1 = performance.now()
      const resB = await window.chromadb.queryByEmbedding(
        conn.currentUrl, 'default_tenant', 'default_database', props.compareB, embedding, k.value
      )
      resultsB.value = (resB.ids[0] ?? []).map((id, i) => ({
        id,
        document: resB.documents[0]?.[i] ?? '',
        metadata: resB.metadatas[0]?.[i] ?? {},
        distance: resB.distances[0]?.[i] ?? null,
      }))
      elapsedB.value = Math.round(performance.now() - t1)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Query failed'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="pg">
    <div class="pg-bar">
      <div class="pg-input-wrap">
        <SearchIcon :size="14" class="pg-input-icon" />
        <input v-model="queryText" class="pg-input" placeholder="Enter query... (Enter to run)" @keydown.enter="runQuery" />
      </div>
      <NSelect
        v-if="providers.length"
        v-model:value="providerId"
        :options="providers.map(p => ({ label: p.name, value: p.id }))"
        size="small" style="width:120px"
        placement="bottom-start"
        :to="false"
      />
      <NSelect v-model:value="k" :options="kOptions" size="small" style="width:90px" placement="bottom-start" :to="false" />
      <NButton type="primary" size="small" :loading="running" :disabled="!queryText.trim()" @click="runQuery">
        <template #icon><ZapIcon :size="13" /></template>
        Run
      </NButton>
    </div>

    <div v-if="running" class="pg-status"><NSpin :size="16" /> Searching...</div>
    <div v-else-if="error" class="pg-status error">{{ error }}</div>
    <div v-else-if="results.length && !comparing" class="pg-status">{{ results.length }} results in {{ elapsed }}ms</div>

    <!-- Compare mode -->
    <div v-if="comparing && (results.length || resultsB.length)" class="cmp-results">
      <div class="cmp-col">
        <div class="cmp-col-hd">{{ colStore.collections.find(c => c.id === props.compareA)?.name || 'A' }} <span class="pg-time">{{ results.length }} · {{ elapsed }}ms</span></div>
        <div v-for="(r, i) in results" :key="r.id" class="cmp-card">
          <div class="pg-card-head">
            <span class="pg-rank">#{{ i + 1 }}</span>
            <code class="pg-id">{{ r.id }}</code>
            <span class="pg-score" :class="{ best: i === 0 }">{{ r.distance?.toFixed(4) ?? '—' }}</span>
          </div>
          <p class="pg-doc">{{ r.document.slice(0, 200) }}{{ r.document.length > 200 ? '...' : '' }}</p>
        </div>
      </div>
      <div class="cmp-col">
        <div class="cmp-col-hd">{{ colStore.collections.find(c => c.id === props.compareB)?.name || 'B' }} <span class="pg-time">{{ resultsB.length }} · {{ elapsedB }}ms</span></div>
        <div v-for="(r, i) in resultsB" :key="r.id" class="cmp-card">
          <div class="pg-card-head">
            <span class="pg-rank">#{{ i + 1 }}</span>
            <code class="pg-id">{{ r.id }}</code>
            <span class="pg-score" :class="{ best: i === 0 }">{{ r.distance?.toFixed(4) ?? '—' }}</span>
          </div>
          <p class="pg-doc">{{ r.document.slice(0, 200) }}{{ r.document.length > 200 ? '...' : '' }}</p>
        </div>
      </div>
    </div>

    <!-- Normal mode -->
    <div v-if="!comparing && results.length" class="pg-results">
      <div v-for="(r, i) in results" :key="r.id" class="pg-card">
        <div class="pg-card-head">
          <span class="pg-rank">#{{ i + 1 }}</span>
          <code class="pg-id">{{ r.id }}</code>
          <span class="pg-score" :class="{ best: i === 0 }">{{ r.distance?.toFixed(4) ?? '—' }}</span>
        </div>
        <p class="pg-doc">{{ r.document.slice(0, 400) }}{{ r.document.length > 400 ? '...' : '' }}</p>
        <div v-if="Object.keys(r.metadata).length" class="pg-meta">
          <span v-for="(v, k) in r.metadata" :key="k" class="pg-meta-chip"><span class="pg-meta-k">{{ k }}</span>: {{ String(v).slice(0, 60) }}</span>
        </div>
      </div>
    </div>

    <div v-if="!results.length && !running" class="pg-empty">
      <NText depth="3" v-if="colStore.selected">Enter a query to search "{{ colStore.selected.name }}"</NText>
      <NText depth="3" v-else>Select a collection to start querying</NText>
    </div>
  </div>
</template>

<style scoped>
.pg { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

.pg-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  position: relative; z-index: 1;
}
.pg-input-wrap {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 0 10px; background: var(--bg-root);
  border: 1px solid var(--border-default); border-radius: 4px;
}
.pg-input-wrap:focus-within { border-color: var(--accent-dim); }
.pg-input-icon { color: var(--text-muted); flex-shrink: 0; }
.pg-input {
  flex: 1; border: none; outline: none; background: transparent;
  color: var(--text-primary); font-size: 13px; font-family: var(--font-ui);
  padding: 6px 0;
}
.pg-input::placeholder { color: var(--text-muted); }

.pg-status {
  padding: 8px 20px; font-size: 12px; color: var(--text-muted);
  font-family: var(--font-mono); flex-shrink: 0;
}
.pg-status.error { color: var(--danger); }

.pg-results { flex: 1; overflow-y: auto; padding: 8px 16px 24px; }
.pg-card {
  background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 6px; padding: 14px; margin-bottom: 10px;
}
.pg-card:hover { border-color: var(--border-default); }
.pg-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pg-rank { font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 20px; }
.pg-id { font-family: var(--font-mono); font-size: 11px; color: var(--accent); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-score { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); background: var(--bg-root); padding: 2px 8px; border-radius: 3px; }
.pg-score.best { color: var(--success); }
.pg-doc { font-size: 13px; line-height: 1.6; color: var(--text-primary); margin: 0; }
.pg-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.pg-meta-chip { font-family: var(--font-mono); font-size: 10px; padding: 2px 7px; background: var(--bg-root); border-radius: 3px; color: var(--text-muted); }
.pg-meta-k { color: var(--accent-dim); }

.pg-empty { display: flex; align-items: center; justify-content: center; height: 100%; }

/* Compare mode */
.cmp-results { flex: 1; overflow: auto; display: flex; gap: 0; }
.cmp-col { flex: 1; overflow-y: auto; padding: 8px 10px; }
.cmp-col:first-child { border-right: 1px solid var(--border-default); }
.cmp-col-hd { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; padding: 0 4px; }
.cmp-card {
  background: var(--bg-surface); border: 1px solid var(--border-subtle);
  border-radius: 4px; padding: 10px; margin-bottom: 6px;
}
.cmp-card:hover { border-color: var(--border-default); }
.pg-time { font-weight: 400; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
</style>
