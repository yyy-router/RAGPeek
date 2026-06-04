<script setup lang="ts">
import { CircleIcon } from 'lucide-vue-next'
</script>

<template>
  <div class="statusbar">
    <div class="status-left">
      <CircleIcon :size="9" class="status-icon" />
      <span>Disconnected</span>
    </div>
    <div class="status-right">
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
.status-icon {
  color: var(--text-muted);
}
</style>
