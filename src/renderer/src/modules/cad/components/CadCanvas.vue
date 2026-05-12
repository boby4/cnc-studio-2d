<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../composables/useCanvas'
import { useDrawing } from '../composables/useDrawing'
import Konva from 'konva'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage, getLayer } = useCanvas(containerRef)
const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(
  () => stage.value
)

watch(stage, (s) => {
  if (!s) return
  s.on('mousedown', handleMouseDown)
  s.on('mousemove', handleMouseMove)
  s.on('mouseup', handleMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-neutral-900" />
</template>
