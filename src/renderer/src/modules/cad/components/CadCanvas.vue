<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../composables/useCanvas'
import { useDrawing } from '../composables/useDrawing'
import { useSelection } from '../composables/useSelection'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage } = useCanvas(containerRef)
const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing()
useSelection(stage)

watch(stage, (s) => {
  if (!s) return
  console.log('[CadCanvas] binding events to stage, layers:', s.getLayers().length)
  s.on('mousedown', handleMouseDown)
  s.on('mousemove', handleMouseMove)
  s.on('mouseup', handleMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-neutral-900" />
</template>
