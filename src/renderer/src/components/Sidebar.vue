<script setup lang="ts">
import { NCollapse, NCollapseItem, NText } from 'naive-ui'
</script>

<template>
  <NCollapse :default-expanded-names="['collections', 'testsets']">
    <NCollapseItem name="collections" title="Collections">
      <NText depth="3">Connect to browse collections</NText>
    </NCollapseItem>
    <NCollapseItem name="testsets" title="Test Sets">
      <NText depth="3">No test sets yet</NText>
    </NCollapseItem>
  </NCollapse>
</template>
