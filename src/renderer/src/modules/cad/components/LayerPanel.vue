<script setup lang="ts">
import { ref } from 'vue'
import { useCadStore } from '../../../stores/cad.store'

const store = useCadStore()
const newLayerName = ref('')
const showNewInput = ref(false)

function add() {
  const name = newLayerName.value.trim() || `图层 ${store.layers.length + 1}`
  store.addLayer(name)
  newLayerName.value = ''
  showNewInput.value = false
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-2 py-1.5 border-b border-neutral-700">
      <span class="text-xs font-semibold text-neutral-300 uppercase tracking-wide">图层</span>
      <button @click="showNewInput = !showNewInput"
        class="text-neutral-400 hover:text-white text-sm leading-none w-5 h-5 flex items-center justify-center">
        +
      </button>
    </div>

    <div v-if="showNewInput" class="flex gap-1 px-2 py-1">
      <input v-model="newLayerName" @keyup.enter="add()"
        class="flex-1 bg-neutral-800 text-white text-xs px-1.5 py-0.5 rounded border border-neutral-600 outline-none"
        placeholder="图层名称" />
      <button @click="add()" class="text-emerald-400 text-xs hover:text-emerald-300">确定</button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-for="layer in store.layers"
        :key="layer.id"
        :class="[
          'flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs border-b border-neutral-800',
          store.currentLayerId === layer.id ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'
        ]"
        @click="store.setCurrentLayer(layer.id)"
      >
        <button
          @click.stop="store.toggleLayerVisible(layer.id)"
          :class="layer.visible ? 'text-neutral-300' : 'text-neutral-600'"
          class="text-xs w-4 text-left"
        >
          {{ layer.visible ? '◉' : '○' }}
        </button>
        <span :class="store.currentLayerId === layer.id ? 'text-white' : 'text-neutral-400'"
          class="flex-1 truncate">
          {{ layer.name }}
        </span>
        <button
          v-if="store.layers.length > 1"
          @click.stop="store.removeLayer(layer.id)"
          class="text-neutral-600 hover:text-red-400 text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
