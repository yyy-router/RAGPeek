<script setup lang="ts">
import { NSpace, NInput, NButton } from 'naive-ui'
import { PlugIcon } from 'lucide-vue-next'
</script>

<template>
  <NSpace align="center">
    <PlugIcon :size="18" />
    <span class="brand">RAGPeek</span>
    <NInput size="small" placeholder="http://localhost:8000" style="width: 240px" />
    <NButton size="small" type="primary">Connect</NButton>
  </NSpace>
</template>

<style scoped>
.brand { font-weight: 600; font-size: 15px; }
</style>
