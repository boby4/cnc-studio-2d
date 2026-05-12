<script setup lang="ts">
import { useCadStore } from '../../../stores/cad.store'

const store = useCadStore()
</script>

<template>
  <div class="h-6 bg-neutral-900 border-t border-neutral-700 flex items-center px-3 text-xs text-neutral-500 gap-4 select-none">
    <span>工具: {{ store.currentTool }}</span>
    <span v-if="store.selectedShape">选中: {{ store.selectedShape.type }} ({{ store.selectedShape.id.slice(-6) }})</span>
    <span class="ml-auto">图层: {{ store.currentLayer?.name }}</span>
  </div>
</template>
