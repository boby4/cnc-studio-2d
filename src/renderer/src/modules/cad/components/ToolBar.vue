<script setup lang="ts">
import { useCadStore } from '../../../stores/cad.store'
import type { ToolType } from '../types'

const store = useCadStore()

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: '选择', icon: '↖' },
  { type: 'line', label: '直线', icon: '╲' },
  { type: 'rect', label: '矩形', icon: '□' },
  { type: 'circle', label: '圆', icon: '○' },
]
</script>

<template>
  <div class="w-12 bg-neutral-900 border-r border-neutral-700 flex flex-col items-center py-2 gap-1">
    <button
      v-for="tool in tools"
      :key="tool.type"
      :class="[
        'w-9 h-9 flex items-center justify-center rounded text-lg',
        store.currentTool === tool.type
          ? 'bg-emerald-600 text-white'
          : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
      ]"
      :title="tool.label"
      @click="store.setTool(tool.type)"
    >
      {{ tool.icon }}
    </button>
  </div>
</template>
