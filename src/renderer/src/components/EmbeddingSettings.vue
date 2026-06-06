<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NInput, NButton } from 'naive-ui'
import { XIcon, PlusIcon, Trash2Icon } from 'lucide-vue-next'

const emit = defineEmits<{ close: [] }>()

interface Provider {
  id: string
  name: string
  endpoint: string
  apiKey: string
  model: string
  dimensions: string
}

const providers = ref<Provider[]>([])
const selectedId = ref<string | null>(null)
const saved = ref(false)

onMounted(async () => {
  const raw = await window.settings.get('embedding_providers')
  if (raw) {
    try { providers.value = JSON.parse(raw) } catch {}
  }
  if (providers.value.length) selectedId.value = providers.value[0].id
  // decrypt keys
  for (const p of providers.value) {
    const key = await window.settings.getSecure(`embedding_key_${p.id}`)
    if (key) p.apiKey = key
  }
})

const selected = computed(() => providers.value.find((p) => p.id === selectedId.value))

function add(): void {
  const p: Provider = { id: crypto.randomUUID(), name: 'New Provider', endpoint: '', apiKey: '', model: '', dimensions: '' }
  providers.value.push(p)
  selectedId.value = p.id
}

async function persist(silent = false): Promise<void> {
  for (const p of providers.value) {
    if (p.apiKey) await window.settings.setSecure(`embedding_key_${p.id}`, p.apiKey)
  }
  const clean = providers.value.map(({ apiKey: _, ...rest }) => rest)
  await window.settings.set('embedding_providers', JSON.stringify(clean))
  if (!silent) {
    saved.value = true
    setTimeout(() => (saved.value = false), 1500)
  }
}

async function remove(id: string): Promise<void> {
  await window.settings.setSecure(`embedding_key_${id}`, '')
  providers.value = providers.value.filter((p) => p.id !== id)
  if (selectedId.value === id) selectedId.value = providers.value[0]?.id ?? null
  await persist(true)
}

async function saveAll(): Promise<void> {
  await persist()
}
</script>

<template>
  <div class="es-overlay" @click.self="emit('close')">
    <div class="es-modal">
      <div class="es-head">
        <span>Embedding Providers</span>
        <button class="es-close" @click="emit('close')"><XIcon :size="14" /></button>
      </div>

      <div class="es-list">
        <div v-for="p in providers" :key="p.id" class="es-provider" :class="{ sel: selectedId === p.id }" @click="selectedId = p.id">
          <span class="es-pname">{{ p.name }}</span>
          <button class="es-pdel" @click.stop="remove(p.id)"><Trash2Icon :size="12" /></button>
        </div>
      </div>

      <div v-if="selected" class="es-body">
        <NInput v-model:value="selected.name" size="small" placeholder="Provider name (e.g. OpenAI, Zhipu)" />
        <NInput v-model:value="selected.endpoint" size="small" placeholder="https://api.openai.com/v1/embeddings" />
        <NInput v-model:value="selected.apiKey" size="small" type="password" placeholder="API Key" show-password-on="click" />
        <NInput v-model:value="selected.model" size="small" placeholder="text-embedding-3-small" />
        <NInput v-model:value="selected.dimensions" size="small" placeholder="Dimensions (optional)" />
      </div>

      <div class="es-actions">
        <NButton size="small" @click="add"><template #icon><PlusIcon :size="13" /></template>Add</NButton>
        <NButton size="small" type="primary" @click="saveAll">{{ saved ? 'Saved' : 'Save All' }}</NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.es-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  -webkit-app-region: no-drag;
}
.es-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 8px; width: 440px; max-height: 560px; display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}
.es-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; font-size: 14px; font-weight: 600; color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle); flex-shrink: 0;
}
.es-close { display: flex; border: none; background: none; cursor: pointer; color: var(--text-muted); }
.es-close:hover { color: var(--text-primary); }

.es-list { padding: 8px; border-bottom: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; gap: 4px; }
.es-provider {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 4px; cursor: pointer;
  font-size: 12px; color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}
.es-provider:hover { border-color: var(--border-default); }
.es-provider.sel { border-color: var(--accent); color: var(--accent); background: var(--bg-hover); }
.es-pdel { display: flex; border: none; background: none; cursor: pointer; color: var(--text-muted); opacity: 0; }
.es-provider:hover .es-pdel { opacity: 1; }
.es-pdel:hover { color: var(--danger); }

.es-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; }
.es-actions { padding: 12px 16px; border-top: 1px solid var(--border-subtle); display: flex; gap: 8px; justify-content: space-between; }
</style>
