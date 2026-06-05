<script setup lang="ts">
import { computed, ref } from 'vue'
import { NText, NSpin } from 'naive-ui'
import { FileTextIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useCollectionsStore } from '../stores/collections'

const conn = useConnectionStore()
const store = useCollectionsStore()

interface ColumnDef {
  key: string
  type: string
}

const columns = computed<ColumnDef[]>(() => {
  if (!store.docs.length) return []
  const keys = new Set<string>()
  for (const doc of store.docs) {
    keys.add('id')
    keys.add('document')
    for (const k of Object.keys(doc.metadata)) keys.add(k)
  }
  return Array.from(keys).map((key) => ({
    key,
    type: getType(store.docs[0], key),
  }))
})

function getType(doc: { metadata: Record<string, unknown> }, key: string): string {
  if (key === 'id') return 'string'
  if (key === 'document') return 'string'
  const val = doc.metadata[key]
  if (val === null || val === undefined) return 'null'
  return Array.isArray(val) ? 'array' : typeof val
}

function getDocValue(doc: { id: string; document: string; metadata: Record<string, unknown> }, key: string): unknown {
  if (key === 'id') return doc.id
  if (key === 'document') return doc.document
  return doc.metadata[key]
}

function getFullText(doc: { id: string; document: string; metadata: Record<string, unknown> }, key: string): string {
  const val = getDocValue(doc, key)
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

const selectedDocId = ref<string | null>(null)

function goPage(p: number): void {
  if (p >= 1 && p <= store.totalPages) store.loadPage(conn.currentUrl, undefined, p)
  selectedDocId.value = null
}
</script>

<template>
  <div class="preview">
    <template v-if="store.docsLoading">
      <NSpin :size="20" class="spinner" />
    </template>

    <template v-else-if="store.selected && store.docs.length > 0">
      <div class="table-header">
        <span class="table-title">{{ store.selected.name }}</span>
        <span class="table-sub">{{ store.counts[store.selected.id] ?? 0 }} documents</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">
                <span class="th-label">{{ col.key }}</span>
                <span class="th-type">{{ col.type }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in store.docs" :key="doc.id"
                :class="{ selected: selectedDocId === doc.id }"
                @click="selectedDocId = selectedDocId === doc.id ? null : doc.id">
              <td v-for="col in columns" :key="col.key" :title="getFullText(doc, col.key)">
                <code v-if="col.key === 'id'" class="cell-id">{{ doc.id }}</code>
                <span v-else class="cell-text">{{ getFullText(doc, col.key) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="store.totalPages > 1" class="paginator">
        <button class="page-btn" :disabled="store.page <= 1" @click="goPage(store.page - 1)">
          <ChevronLeftIcon :size="14" />
        </button>
        <span class="page-info">Page {{ store.page }} of {{ store.totalPages }}</span>
        <button class="page-btn" :disabled="store.page >= store.totalPages" @click="goPage(store.page + 1)">
          <ChevronRightIcon :size="14" />
        </button>
      </div>
    </template>

    <template v-else-if="store.selected">
      <div class="empty">
        <FileTextIcon :size="20" class="empty-icon" />
        <NText depth="3">No documents in this collection</NText>
      </div>
    </template>

    <template v-else>
      <div class="empty">
        <FileTextIcon :size="20" class="empty-icon" />
        <NText depth="3">Select a collection to preview documents</NText>
      </div>
    </template>
  </div>
</template>

<style scoped>
.preview { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.spinner { display: flex; justify-content: center; padding: 24px; }

.table-header {
  display: flex; align-items: baseline; gap: 10px;
  padding: 14px 20px 10px; flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}
.table-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.table-sub { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }

.table-wrapper { flex: 1; overflow: auto; }
.data-table { border-collapse: collapse; }

thead { position: sticky; top: 0; z-index: 1; }
th {
  background: var(--bg-surface);
  padding: 6px 12px; text-align: left; font-size: 12px;
  border-bottom: 2px solid var(--border-default); white-space: nowrap;
  max-width: 220px;
}
th:first-child { max-width: 140px; }
.th-label { color: var(--text-primary); font-weight: 600; }
.th-type { color: var(--text-muted); font-weight: 400; font-size: 10px; margin-left: 6px; text-transform: uppercase; }

td {
  padding: 6px 12px; border-bottom: 1px solid var(--border-subtle);
  vertical-align: top; font-size: 13px; color: var(--text-primary);
  max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
td:first-child { max-width: 140px; }

tr:hover td { background: var(--bg-hover); }
tr.selected td { background: var(--bg-raised); border-left: 2px solid var(--accent); }

.cell-id { font-family: var(--font-mono); font-size: 12px; color: var(--accent); }
.cell-text { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); }

.paginator {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 10px; border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface); flex-shrink: 0;
}
.page-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid var(--border-default);
  border-radius: 4px; background: transparent; cursor: pointer;
  color: var(--text-secondary);
}
.page-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.page-btn:disabled { opacity: .3; cursor: not-allowed; }
.page-info {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-secondary); min-width: 80px; text-align: center;
}

.empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 8px; color: var(--text-muted);
}
.empty-icon { opacity: .4; }
</style>
