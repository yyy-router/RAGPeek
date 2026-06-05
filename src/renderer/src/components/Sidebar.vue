<script setup lang="ts">
import { watch } from 'vue'
import { NText, NSpin } from 'naive-ui'
import { DatabaseIcon } from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useCollectionsStore } from '../stores/collections'

const connStore = useConnectionStore()
const colStore = useCollectionsStore()

watch(() => connStore.connected, (val) => {
  if (val) {
    colStore.fetchCollections(connStore.currentUrl)
  } else {
    colStore.clear()
  }
})
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-header">Collections</div>
      <div class="section-body">
        <NText v-if="!connStore.connected" depth="3" class="hint">
          Connect to browse collections
        </NText>
        <NSpin v-else-if="colStore.loading" :size="16" class="spinner" />
        <div v-else-if="colStore.collections.length === 0" class="hint-row">
          <NText depth="3" class="hint">No collections found</NText>
        </div>
        <div
          v-for="col in colStore.collections"
          :key="col.id"
          class="collection-item"
          :class="{ selected: colStore.selectedId === col.id }"
          @click="colStore.selectCollection(connStore.currentUrl, col.id)"
        >
          <div class="col-left">
            <DatabaseIcon :size="13" class="col-icon" />
            <span class="col-name">{{ col.name }}</span>
          </div>
          <span class="col-count">{{ colStore.counts[col.id] ?? '-' }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-header">Test Sets</div>
      <div class="section-body">
        <NText depth="3" class="hint">No test sets yet</NText>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar { padding: 8px; }
.sidebar-section { margin-bottom: 4px; }
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px;
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .6px; color: var(--text-muted); user-select: none;
}
.section-body { padding: 2px 4px; }
.hint { font-size: 13px; padding: 4px; display: block; }
.hint-row { padding: 4px; }
.spinner { display: flex; justify-content: center; padding: 12px; }

.collection-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 4px; cursor: pointer;
  transition: background .1s;
}
.collection-item:hover { background: var(--bg-hover); }
.collection-item.selected { background: var(--bg-raised); border-left: 2px solid var(--accent); padding-left: 6px; }
.col-left { display: flex; align-items: center; gap: 6px; }
.col-icon { color: var(--text-muted); flex-shrink: 0; }
.col-name {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-primary); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap;
}
.col-count {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--text-muted); flex-shrink: 0;
}
</style>
