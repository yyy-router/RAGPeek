<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NLayoutFooter } from 'naive-ui'
import ConnectionBar from './components/ConnectionBar.vue'
import Sidebar from './components/Sidebar.vue'
import StatusBar from './components/StatusBar.vue'
</script>

<template>
  <NLayout class="app-layout">
    <NLayoutHeader class="app-header" bordered>
      <ConnectionBar />
    </NLayoutHeader>
    <NLayout class="app-body" has-sider>
      <NLayoutSider width="240" bordered>
        <Sidebar />
      </NLayoutSider>
      <NLayoutContent class="app-main">
        <div class="placeholder">
          <p>Connect to a ChromaDB instance to begin</p>
        </div>
      </NLayoutContent>
    </NLayout>
    <NLayoutFooter class="app-footer" bordered>
      <StatusBar />
    </NLayoutFooter>
  </NLayout>
</template>

<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.app-layout { height: 100vh; }
.app-header { padding: 0 16px; height: 48px; display: flex; align-items: center; }
.app-body { flex: 1; }
.app-main { padding: 24px; }
.app-footer { padding: 0 16px; height: 28px; display: flex; align-items: center; font-size: 12px; }
.placeholder { color: var(--n-text-color-3); font-size: 14px; display: flex; align-items: center; justify-content: center; height: 100%; }
</style>
