<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NText, NSpin, useMessage } from 'naive-ui'
import {
  FileTextIcon, ChevronLeftIcon, ChevronRightIcon, KeyIcon,
  Trash2Icon, EyeIcon, SquareIcon, CheckSquareIcon, MinusSquareIcon,
  XIcon, CopyIcon
} from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useCollectionsStore } from '../stores/collections'

const conn = useConnectionStore()
const store = useCollectionsStore()
const message = useMessage()
const selectedIds = ref<Set<string>>(new Set())
const activeTab = ref<'schema' | 'documents'>('schema')

watch(() => store.selectedId, () => {
  selectedIds.value = new Set()
  viewDoc.value = null
})
const viewDoc = ref<{ id: string; document: string; metadata: Record<string, unknown> } | null>(null)

function handleView(): void {
  const ids = Array.from(selectedIds.value)
  if (ids.length !== 1) return
  const doc = store.docs.find((d) => d.id === ids[0])
  if (doc) viewDoc.value = { id: doc.id, document: doc.document, metadata: { ...doc.metadata } }
}

async function handleCopyJson(): Promise<void> {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  const docs = store.docs.filter((d) => ids.includes(d.id)).map((d) => ({
    id: d.id, document: d.document, metadata: d.metadata,
  }))
  await navigator.clipboard.writeText(JSON.stringify(docs, null, 2))
  message.success(`Copied ${docs.length} document(s) to clipboard`)
}
const deleting = ref(false)

interface ColumnDef { key: string; type: string }

const columns = computed<ColumnDef[]>(() => {
  if (!store.docs.length) return []
  const keys = new Set<string>()
  for (const doc of store.docs) {
    keys.add('id')
    keys.add('document')
    for (const k of Object.keys(doc.metadata)) keys.add(k)
  }
  return Array.from(keys).map((key) => ({ key, type: getType(store.docs, key) }))
})

function getType(docs: { metadata: Record<string, unknown> }[], key: string): string {
  if (key === 'id') return 'string'
  if (key === 'document') return 'string'
  for (const doc of docs) {
    const val = doc.metadata[key]
    if (val === null || val === undefined) continue
    if (Array.isArray(val)) {
      if (val.length === 0) return 'array'
      return `array<${typeof val[0]}>`
    }
    return typeof val
  }
  return 'null'
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

const allSelected = computed(() =>
  store.docs.length > 0 && store.docs.every((d) => selectedIds.value.has(d.id))
)
const someSelected = computed(() => selectedIds.value.size > 0)

function toggleSelect(id: string): void {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function toggleAll(): void {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(store.docs.map((d) => d.id))
  }
}


async function handleDelete(): Promise<void> {
  const ids = Array.from(selectedIds.value)
  if (!ids.length || !confirm(`Delete ${ids.length} document(s)? This cannot be undone.`)) return
  deleting.value = true
  try {
    await window.chromadb.deleteDocuments(conn.currentUrl, 'default_tenant', 'default_database', store.selected!.id, ids)
    selectedIds.value = new Set()
    await store.loadPage(conn.currentUrl)
  } finally {
    deleting.value = false
  }
}

function goPage(p: number): void {
  if (p >= 1 && p <= store.totalPages) store.loadPage(conn.currentUrl, undefined, p)
  selectedIds.value = new Set()
}

const typeColors: Record<string, string> = {
  string: 't-string', number: 't-number', boolean: 't-boolean',
  array: 't-array', object: 't-object', null: 't-null',
}
</script>

<template>
  <div class="preview">
    <template v-if="store.docsLoading && store.docs.length === 0">
      <div class="loading-state"><NSpin :size="22" /></div>
    </template>

    <template v-else-if="store.selected">
      <!-- Header -->
      <div class="pv-head">
        <div class="pv-head-left">
          <span class="pv-dot">&#9632;</span>
          <span class="pv-name">{{ store.selected.name }}</span>
        </div>
        <div class="pv-head-right">
          <span v-if="activeTab === 'documents' && someSelected" class="sel-count">{{ selectedIds.size }} selected</span>
          <span class="pv-count">{{ store.counts[store.selected.id] ?? 0 }} docs</span>
        </div>
      </div>

      <!-- Tabs + Actions -->
      <div class="pv-bar">
        <div class="pv-tabs">
          <button class="pv-tab" :class="{ active: activeTab === 'schema' }" @click="activeTab = 'schema'">Schema</button>
          <button class="pv-tab" :class="{ active: activeTab === 'documents' }" @click="activeTab = 'documents'">Documents</button>
        </div>
        <div v-if="activeTab === 'documents'" class="pv-actions">
          <button class="act-btn" :class="{ on: selectedIds.size === 1 }" :disabled="selectedIds.size !== 1" title="View document" @click="handleView">
            <EyeIcon :size="13" /><span>View</span>
          </button>
          <button class="act-btn" :class="{ on: someSelected }" :disabled="!someSelected" title="Copy JSON" @click="handleCopyJson">
            <CopyIcon :size="13" /><span>Copy</span>
          </button>
          <button class="act-btn danger" :class="{ on: someSelected }" :disabled="!someSelected || deleting" title="Delete selected" @click="handleDelete">
            <Trash2Icon :size="13" /><span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
          </button>
        </div>
      </div>

      <!-- Schema Content -->
      <div v-show="activeTab === 'schema'" class="pv-body">
        <div class="schema-top">
          <div class="card">
            <div class="card-hd">Overview</div>
            <div class="card-bd">
              <div class="ov-item"><span class="ov-label">ID</span><code class="ov-value">{{ store.selected.id }}</code></div>
              <div class="ov-item"><span class="ov-label">Documents</span><code class="ov-value">{{ store.counts[store.selected.id] ?? '—' }}</code></div>
              <div class="ov-item"><span class="ov-label">Database</span><code class="ov-value">default_database</code></div>
              <div class="ov-item"><span class="ov-label">Tenant</span><code class="ov-value">default_tenant</code></div>
            </div>
          </div>
          <div class="card">
            <div class="card-hd">Metadata</div>
            <div class="card-bd card-meta" v-if="store.selected.metadata && Object.keys(store.selected.metadata).length">
              <div v-for="(v, k) in store.selected.metadata" :key="k" class="m-row"><span class="m-key">{{ k }}</span><span class="m-eq">=</span><code class="m-val">{{ v }}</code></div>
            </div>
            <div class="card-bd empty-meta" v-else>No metadata</div>
          </div>
        </div>
        <div class="card" v-if="columns.length">
          <div class="card-hd"><KeyIcon :size="11" />Fields<span class="card-n">{{ columns.length }}</span></div>
          <div class="fields-grid">
            <div class="f-row f-head"><span>Field</span><span>Type</span><span>Sample Value</span></div>
            <div v-for="col in columns" :key="col.key" class="f-row">
              <code class="f-name">{{ col.key }}</code>
              <span class="f-type" :class="typeColors[col.type] || 't-string'">{{ col.type }}</span>
              <span class="f-sample">{{ getFullText(store.docs[0], col.key).slice(0, 100) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Content -->
      <div v-show="activeTab === 'documents'" class="pv-body">
        <div v-if="store.docs.length" class="docs-scroll">
          <table class="d-table">
            <thead>
              <tr>
                <th class="th-cb">
                  <button class="cb-btn" @click="toggleAll">
                    <CheckSquareIcon v-if="allSelected" :size="14" />
                    <MinusSquareIcon v-else-if="someSelected" :size="14" />
                    <SquareIcon v-else :size="14" />
                  </button>
                </th>
                <th v-for="col in columns" :key="col.key">
                  <span class="th-label">{{ col.key }}</span><span class="th-type">{{ col.type }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in store.docs" :key="doc.id" :class="{ sel: selectedIds.has(doc.id) }">
                <td class="td-cb" @click.stop="toggleSelect(doc.id)">
                  <button class="cb-btn">
                    <CheckSquareIcon v-if="selectedIds.has(doc.id)" :size="14" class="cb-on" />
                    <SquareIcon v-else :size="14" />
                  </button>
                </td>
                <td v-for="col in columns" :key="col.key" :title="getFullText(doc, col.key)">
                  <code v-if="col.key === 'id'" class="cell-id">{{ doc.id }}</code>
                  <span v-else class="cell-txt">{{ getFullText(doc, col.key) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-inner"><NText depth="3">No documents</NText></div>

        <div v-if="store.totalPages > 1" class="paginator">
          <button class="pg-btn" :disabled="store.page <= 1" @click="goPage(store.page - 1)"><ChevronLeftIcon :size="14" /></button>
          <span class="pg-info">{{ store.page }} / {{ store.totalPages }}</span>
          <button class="pg-btn" :disabled="store.page >= store.totalPages" @click="goPage(store.page + 1)"><ChevronRightIcon :size="14" /></button>
        </div>
      </div>

    <!-- View Drawer -->
    <Teleport to="body" v-if="viewDoc">
      <div class="drw-overlay" @click="viewDoc = null" />
      <aside class="drw">
        <header class="drw-hd">
          <div class="drw-hd-left">
            <span class="drw-hd-dot">&#9670;</span>
            <span class="drw-hd-id">{{ viewDoc.id }}</span>
          </div>
          <button class="drw-hd-close" @click="viewDoc = null"><XIcon :size="15" /></button>
        </header>

        <div class="drw-bd">
          <section class="drw-sec">
            <div class="drw-sec-label">
              <span class="drw-sec-line"></span>
              Document
            </div>
            <p class="drw-doc">{{ viewDoc.document }}</p>
          </section>

          <section class="drw-sec">
            <div class="drw-sec-label">
              <span class="drw-sec-line"></span>
              Metadata
              <span class="drw-sec-n">{{ Object.keys(viewDoc.metadata).length }}</span>
            </div>
            <div v-if="Object.keys(viewDoc.metadata).length" class="drw-meta-grid">
              <div v-for="(v, k) in viewDoc.metadata" :key="k" class="drw-meta-chip">
                <span class="chip-key">{{ k }}</span>
                <span class="chip-val">{{ v }}</span>
              </div>
            </div>
            <p v-else class="drw-empty">No metadata fields</p>
          </section>
        </div>
      </aside>
    </Teleport>
    </template>

    <template v-else>
      <div class="empty-state"><FileTextIcon :size="24" class="empty-icon" /><NText depth="3">Select a collection to inspect</NText></div>
    </template>
  </div>
</template>

<style scoped>
.preview { height: 100%; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-root); }
.loading-state { display: flex; justify-content: center; padding: 40px; }

/* Header */
.pv-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 10px; flex-shrink: 0; }
.pv-head-left { display: flex; align-items: center; gap: 10px; }
.pv-head-right { display: flex; align-items: center; gap: 14px; }
.pv-dot { color: var(--accent); font-size: 11px; }
.pv-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.sel-count { font-size: 12px; color: var(--accent); font-family: var(--font-mono); }
.pv-count { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }

/* Bar: tabs + actions */
.pv-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; flex-shrink: 0; border-bottom: 1px solid var(--border-subtle);
}
.pv-tabs { display: flex; gap: 0; }
.pv-tab {
  padding: 8px 18px; border: none; background: none; cursor: pointer;
  font-size: 13px; color: var(--text-muted); font-family: var(--font-ui);
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: .15s;
}
.pv-tab:hover { color: var(--text-primary); }
.pv-tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

/* Action buttons */
.pv-actions { display: flex; gap: 6px; }
.act-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border: 1px solid var(--border-default); border-radius: 4px;
  background: transparent; color: var(--text-muted); font-size: 12px;
  font-family: var(--font-ui); cursor: pointer; transition: .15s;
}
.act-btn.on { border-color: var(--accent-dim); color: var(--accent); }
.act-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.act-btn.danger.on { border-color: var(--danger); color: var(--danger); opacity: .7; }
.act-btn.danger:hover:not(:disabled) { opacity: 1; }
.act-btn:disabled { opacity: .3; cursor: not-allowed; }

/* Body */
.pv-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 16px 24px; }

/* Cards */
.card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden; }
.card-hd { padding: 7px 12px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border-subtle); }
.card-n { margin-left: auto; font-size: 10px; font-weight: 400; color: var(--text-muted); background: var(--bg-hover); padding: 0 7px; border-radius: 10px; }
.card-bd { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.card-meta { gap: 4px; }
.empty-meta { color: var(--text-muted); font-size: 12px; padding: 10px 12px; }
.schema-top { display: flex; gap: 12px; margin-bottom: 12px; }
.schema-top > .card { flex: 1; min-width: 0; }
.ov-item { display: flex; flex-direction: column; gap: 1px; }
.ov-label { font-size: 10px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: .3px; }
.ov-value { font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); word-break: break-all; }
.m-row { display: flex; align-items: baseline; gap: 5px; font-size: 11px; }
.m-key { font-family: var(--font-mono); color: var(--accent-dim); }
.m-eq { color: var(--text-muted); }
.m-val { font-family: var(--font-mono); color: var(--text-secondary); }

/* Fields */
.fields-grid { font-size: 12px; }
.f-row { display: grid; grid-template-columns: 1fr 90px 2fr; gap: 12px; padding: 7px 12px; align-items: center; border-top: 1px solid var(--border-subtle); }
.f-row:first-child { border-top: none; }
.f-head { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .3px; padding: 6px 12px; background: var(--bg-root); }
.f-name { font-family: var(--font-mono); font-size: 12px; color: var(--accent); overflow: hidden; text-overflow: ellipsis; }
.f-type { font-family: var(--font-mono); font-size: 11px; padding: 1px 7px; border-radius: 3px; font-weight: 500; display: inline-block; width: fit-content; }
.t-string  { background: #1e3a3a; color: #2dd4bf; } .t-number  { background: #2a2250; color: #a78bfa; }
.t-boolean { background: #3a2a1e; color: #f59e0b; } .t-array   { background: #1e2e3a; color: #60a5fa; }
.t-object  { background: #2a1e3a; color: #c084fc; } .t-null    { background: var(--bg-hover); color: var(--text-muted); }
.f-sample { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Table */
.docs-scroll { flex: 1; overflow: auto; }
.d-table { border-collapse: collapse; min-width: 100%; }
thead { position: sticky; top: 0; z-index: 1; }
th { background: var(--bg-surface); padding: 7px 10px; text-align: left; font-size: 11px; border-bottom: 1px solid var(--border-default); white-space: nowrap; font-weight: 500; }
.th-label { color: var(--text-secondary); }
.th-type { color: var(--text-muted); font-size: 10px; margin-left: 5px; }
.th-cb { width: 36px; padding: 4px !important; text-align: center; }
td { padding: 6px 10px; border-bottom: 1px solid var(--border-subtle); vertical-align: top; font-size: 12px; color: var(--text-secondary); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-cb { width: 36px; padding: 4px !important; text-align: center; vertical-align: middle !important; }
tr:hover td { background: var(--bg-hover); }
tr.sel td { background: var(--bg-raised); box-shadow: inset 2px 0 0 var(--accent); }
.cell-id { font-family: var(--font-mono); font-size: 11px; color: var(--accent); }
.cell-txt { font-family: var(--font-mono); font-size: 11px; }
.cb-btn { display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: var(--text-muted); padding: 2px; }
.cb-btn:hover { color: var(--accent); }
.cb-on { color: var(--accent); }

/* Paginator */
.paginator { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 8px 0 0; flex-shrink: 0; }
.pg-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1px solid var(--border-default); border-radius: 3px; background: transparent; cursor: pointer; color: var(--text-secondary); }
.pg-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.pg-btn:disabled { opacity: .25; cursor: default; }
.pg-info { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); min-width: 50px; text-align: center; }

/* Drawer */
.drw-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 999;
  backdrop-filter: blur(2px);
}
.drw {
  position: fixed; top: 0; right: 0; bottom: 0; width: 520px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-default);
  box-shadow: -8px 0 24px rgba(0,0,0,.3);
  z-index: 1000; display: flex; flex-direction: column;
  animation: drwIn .2s cubic-bezier(.16,1,.3,1);
}
@keyframes drwIn { from { transform: translateX(60%); opacity: .8; } to { transform: translateX(0); opacity: 1; } }

.drw-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-raised);
}
.drw-hd-left { display: flex; align-items: center; gap: 10px; }
.drw-hd-dot { color: var(--accent); font-size: 12px; }
.drw-hd-id { font-family: var(--font-mono); font-size: 13px; color: var(--accent); font-weight: 500; }
.drw-hd-close {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid var(--border-default); border-radius: 4px;
  background: transparent; cursor: pointer; color: var(--text-muted);
}
.drw-hd-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.drw-bd { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 24px; }

/* Sections */
.drw-sec { display: flex; flex-direction: column; }
.drw-sec-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .6px; color: var(--text-muted); margin-bottom: 10px;
}
.drw-sec-line {
  display: block; width: 12px; height: 1px;
  background: var(--accent); opacity: .5;
}
.drw-sec-n {
  font-size: 10px; font-weight: 400; color: var(--text-muted);
  background: var(--bg-hover); padding: 0 6px; border-radius: 3px;
}

/* Document content */
.drw-doc {
  font-size: 13px; line-height: 1.7; color: var(--text-primary);
  padding: 14px 16px; margin: 0;
  background: var(--bg-root); border: 1px solid var(--border-subtle);
  border-radius: 4px; border-left: 2px solid var(--accent-dim);
}

/* Metadata chips */
.drw-meta-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
.drw-meta-chip {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 10px; background: var(--bg-root);
  border: 1px solid var(--border-subtle); border-radius: 4px;
  min-width: 0;
}
.chip-key {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: .3px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.chip-val {
  font-family: var(--font-mono); font-size: 12px; color: var(--text-primary);
  word-break: break-all; line-height: 1.4;
}

.drw-empty { font-size: 12px; color: var(--text-muted); margin: 0; }

/* Empty */
.empty-inner { padding: 40px; text-align: center; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; color: var(--text-muted); }
.empty-icon { opacity: .25; }
</style>
