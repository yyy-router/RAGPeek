<script setup lang="ts">
import ConnectionBar from './components/ConnectionBar.vue'
import Sidebar from './components/Sidebar.vue'
import StatusBar from './components/StatusBar.vue'
import CollectionPreview from './components/CollectionPreview.vue'
import { useConnectionStore } from './stores/connection'
import { useZoom } from './composables/useZoom'
import { useSidebar } from './composables/useSidebar'
import { PanelLeftCloseIcon, PanelLeftIcon } from 'lucide-vue-next'

const conn = useConnectionStore()
useZoom()
const { collapsed, toggle } = useSidebar()
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <ConnectionBar />
    </header>
    <div class="app-body">
      <aside class="app-sidebar" :class="{ collapsed }">
        <div v-show="!collapsed" class="sidebar-inner">
          <Sidebar />
        </div>
        <button class="sidebar-toggle" @click="toggle" :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <PanelLeftIcon v-if="collapsed" :size="16" />
          <PanelLeftCloseIcon v-else :size="16" />
        </button>
      </aside>
      <main class="app-main">
        <CollectionPreview v-if="conn.connected" />
        <div v-else class="empty-state">
          <svg class="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <p class="empty-text">Connect a ChromaDB instance to start debugging retrieval quality</p>
        </div>
      </main>
    </div>
    <footer class="app-footer">
      <StatusBar />
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-root);
}
.app-header {
  height: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  -webkit-app-region: drag;
}
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.app-sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width .15s, min-width .15s;
  position: relative;
}
.app-sidebar.collapsed {
  width: 36px;
  min-width: 36px;
}
.sidebar-inner {
  flex: 1;
  overflow-y: auto;
}
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  border: none;
  border-top: 1px solid var(--border-subtle);
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.sidebar-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
.app-sidebar.collapsed .sidebar-toggle { border-top: none; }

.app-main {
  flex: 1;
  overflow: auto;
  background: var(--bg-root);
}
.app-footer {
  height: 26px;
  min-height: 26px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}
.empty-icon { color: var(--text-muted); opacity: 0.4; }
.empty-text { color: var(--text-muted); font-size: 14px; }
</style>
