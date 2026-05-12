<script setup lang="ts">
import { computed } from 'vue'
import { useCadStore } from '../../../stores/cad.store'

const store = useCadStore()
const shape = computed(() => store.selectedShape)

function updateX(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { x: v })
}

function updateY(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { y: v })
}

function updateWidth(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { width: v })
}

function updateHeight(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { height: v })
}

function updateRadius(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { radius: v })
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}
</script>

<template>
  <div class="border-t border-neutral-700 px-2 py-1.5">
    <div class="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-1">属性</div>
    <template v-if="shape">
      <div class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">X</span>
        <input :value="fmt(shape.x)" @input="updateX"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">Y</span>
        <input :value="fmt(shape.y)" @input="updateY"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'rect'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">W</span>
        <input :value="fmt(shape.width ?? 0)" @input="updateWidth"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'rect'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">H</span>
        <input :value="fmt(shape.height ?? 0)" @input="updateHeight"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'circle'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">R</span>
        <input :value="fmt(shape.radius ?? 0)" @input="updateRadius"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
    </template>
    <p v-else class="text-xs text-neutral-600">选择一个图形</p>
  </div>
</template>
