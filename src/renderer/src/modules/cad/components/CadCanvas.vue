<script setup lang="ts">
import { ref } from 'vue'
import { useCanvas } from '../composables/useCanvas'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage } = useCanvas(containerRef)
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-neutral-900" />
</template>
