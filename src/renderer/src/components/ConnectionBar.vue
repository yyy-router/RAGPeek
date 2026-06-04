<script setup lang="ts">
import { ref } from 'vue'
import { PlugIcon, UnplugIcon, SunIcon, MoonIcon } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { theme, toggle: toggleTheme } = useTheme()
const urlInput = ref('http://localhost:8000')
const connected = ref(false)

function handleConnect(): void {
  connected.value = true
}

function handleDisconnect(): void {
  connected.value = false
}
</script>

<template>
  <div class="connection-bar">
    <div class="brand">
      <span class="brand-mark">&#9670;</span>
      <span class="brand-name">RAGPeek</span>
    </div>

    <div class="url-group">
      <span class="proto-tag">HTTP</span>
      <input
        v-model="urlInput"
        class="url-input"
        placeholder="localhost:8000"
        spellcheck="false"
      />
      <button
        v-if="!connected"
        class="btn btn-connect"
        @click="handleConnect"
      >
        <PlugIcon :size="13" />
        <span>Connect</span>
      </button>
      <button
        v-else
        class="btn btn-disconnect"
        @click="handleDisconnect"
      >
        <UnplugIcon :size="13" />
        <span>Disconnect</span>
      </button>
    </div>

    <div class="spacer" />

    <div v-if="connected" class="status">
      <span class="status-dot" />
      <span class="status-text">{{ urlInput }}</span>
    </div>

    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'">
      <SunIcon v-if="theme === 'dark'" :size="15" />
      <MoonIcon v-else :size="15" />
    </button>
  </div>
</template>

<style scoped>
.connection-bar {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 14px;
  -webkit-app-region: no-drag;
}

.brand { display: flex; align-items: center; gap: 8px; }
.brand-mark { color: var(--accent); font-size: 14px; }
.brand-name {
  font-weight: 600; font-size: 15px;
  color: var(--text-primary); letter-spacing: -0.3px;
}

.url-group {
  display: flex; align-items: center;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 4px; overflow: hidden;
  transition: border-color .15s;
}
.url-group:focus-within { border-color: var(--accent-dim); }
.proto-tag {
  padding: 0 8px; font-size: 12px; font-weight: 600;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px;
}
.url-input {
  width: 180px; padding: 5px 8px; border: none; outline: none;
  background: transparent; color: var(--text-primary);
  font-family: var(--font-mono); font-size: 13px;
}
.url-input::placeholder { color: var(--text-muted); }

.btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border: none; font-size: 13px;
  font-weight: 500; cursor: pointer; font-family: var(--font-ui);
}
.btn-connect { background: var(--accent); color: #fff; border: none; }
.btn-connect:hover { filter: brightness(1.1); }
.btn-disconnect {
  background: transparent; color: var(--text-secondary);
  border-left: 1px solid var(--border-default);
}
.btn-disconnect:hover { color: var(--danger); }

.spacer { flex: 1; }

.status { display: flex; align-items: center; gap: 6px; }
.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}
.status-text {
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-muted);
}

.theme-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid var(--border-default);
  border-radius: 4px; background: transparent; cursor: pointer;
  color: var(--text-secondary);
}
.theme-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
