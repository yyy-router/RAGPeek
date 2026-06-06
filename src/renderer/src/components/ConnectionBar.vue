<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlugIcon, UnplugIcon, SunIcon, MoonIcon, Settings2Icon } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'
import { useConnectionStore } from '../stores/connection'
import EmbeddingSettings from './EmbeddingSettings.vue'

const { theme, toggle: toggleTheme } = useTheme()
const store = useConnectionStore()
const showSettings = ref(false)

const urlInput = ref('http://localhost:8000')

onMounted(() => store.loadSaved())

const savedOptions = computed(() =>
  store.savedConnections.map((c) => ({ label: `${c.name} (${c.url})`, value: c.url }))
)

async function handleConnect(): Promise<void> {
  await store.connect(urlInput.value)
}

function handleDisconnect(): void {
  store.disconnect()
}
</script>

<template>
  <div class="connection-bar">
    <div class="brand">
      <span class="brand-mark">&#9670;</span>
      <span class="brand-name">RAGPeek</span>
    </div>

    <template v-if="!store.connected">
      <select
        v-if="savedOptions.length"
        class="saved-select"
        @change="store.connect(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled selected>Saved...</option>
        <option v-for="opt in savedOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <div class="url-group">
        <span class="proto-tag">HTTP</span>
        <input
          v-model="urlInput"
          class="url-input"
          placeholder="localhost:8000"
          spellcheck="false"
        />
        <button class="btn btn-connect" :disabled="store.connecting" @click="handleConnect">
          <PlugIcon :size="13" />
          <span>{{ store.connecting ? 'Connecting...' : 'Connect' }}</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="connected-bar">
        <span class="status-dot" />
        <span class="status-text">{{ store.currentUrl }}</span>
        <button class="btn btn-disconnect" @click="handleDisconnect">
          <UnplugIcon :size="13" />
          <span>Disconnect</span>
        </button>
      </div>
    </template>

    <div class="spacer" />

    <p v-if="store.error" class="error-msg">{{ store.error }}</p>

    <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'">
      <SunIcon v-if="theme === 'dark'" :size="15" />
      <MoonIcon v-else :size="15" />
    </button>
    <button class="theme-toggle" title="Embedding settings" @click="showSettings = true">
      <Settings2Icon :size="15" />
    </button>
    <EmbeddingSettings v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.connection-bar {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.brand { display: flex; align-items: center; gap: 8px; }
.brand-mark { color: var(--accent); font-size: 14px; }
.brand-name {
  font-weight: 600; font-size: 15px;
  color: var(--text-primary); letter-spacing: -0.3px;
}

.saved-select {
  background: var(--bg-root);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 13px;
  font-family: var(--font-mono);
  outline: none;
  cursor: pointer;
  max-width: 180px;
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
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-connect { background: var(--accent); color: #fff; }
.btn-connect:hover:not(:disabled) { filter: brightness(1.1); }

.connected-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 2px 10px;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 4px;
}
.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}
.status-text {
  font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);
}
.btn-disconnect {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border: none; border-left: 1px solid var(--border-default);
  background: transparent; color: var(--text-secondary);
  font-size: 12px; cursor: pointer; font-family: var(--font-ui);
}
.btn-disconnect:hover { color: var(--danger); }

.spacer { flex: 1; }
.error-msg {
  font-size: 12px; color: var(--danger);
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.theme-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 1px solid var(--border-default);
  border-radius: 4px; background: transparent; cursor: pointer;
  color: var(--text-secondary);
}
.theme-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
</style>
