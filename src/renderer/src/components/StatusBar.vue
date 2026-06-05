<script setup lang="ts">
import { CircleIcon } from 'lucide-vue-next'
import { useConnectionStore } from '../stores/connection'
import { useZoom } from '../composables/useZoom'

const conn = useConnectionStore()
const { zoom } = useZoom()
</script>

<template>
  <div class="statusbar">
    <div class="status-left">
      <CircleIcon :size="9" :class="conn.connected ? 'connected' : 'disconnected'" />
      <span>{{ conn.connected ? `Connected to ${conn.currentUrl}` : 'Disconnected' }}</span>
    </div>
    <div class="status-right">
      <span>Zoom {{ zoom }}%</span>
      <span class="sep">|</span>
      <span>RAGPeek v0.1</span>
    </div>
  </div>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}
.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.disconnected { color: var(--text-muted); }
.connected { color: var(--success); }
.sep { opacity: .3; margin: 0 2px; }
</style>
