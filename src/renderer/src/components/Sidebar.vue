<script setup lang="ts">
import { NText } from 'naive-ui'
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-header">Collections</div>
      <div class="section-body">
        <NText depth="3" class="hint">Connect to browse collections</NText>
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
.sidebar {
  padding: 8px;
}
.sidebar-section {
  margin-bottom: 4px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  user-select: none;
}
.section-body {
  padding: 4px 8px;
}
.hint {
  font-size: 13px;
  padding: 4px 0;
}
</style>
