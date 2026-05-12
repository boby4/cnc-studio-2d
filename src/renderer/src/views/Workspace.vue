<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useCadStore } from '../stores/cad.store'
import { useCamStore } from '../stores/cam.store'
import { useHistory } from '../modules/cad/composables/useHistory'
import CadCanvas from '../modules/cad/components/CadCanvas.vue'
import ToolBar from '../modules/cad/components/ToolBar.vue'
import LayerPanel from '../modules/cad/components/LayerPanel.vue'
import PropertyPanel from '../modules/cad/components/PropertyPanel.vue'
import StatusBar from '../modules/cad/components/StatusBar.vue'
import type { ProjectData } from '../modules/cad/types'

const cadStore = useCadStore()
const camStore = useCamStore()
useHistory()

async function handleSave() {
  const data: ProjectData = {
    version: '1.0',
    shapes: cadStore.shapes,
    layers: cadStore.layers,
    camParams: camStore.params,
  }
  try {
    await window.electronAPI.file.save(data)
  } catch (e: unknown) {
    console.error((e as Error).message)
  }
}

async function handleOpen() {
  try {
    const data = await window.electronAPI.file.open()
    if (data) {
      cadStore.loadFromProject(data.shapes, data.layers)
      if (data.camParams) camStore.setParams(data.camParams)
    }
  } catch (e: unknown) {
    console.error((e as Error).message)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
    e.preventDefault()
    handleOpen()
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-neutral-950 text-white">
    <div class="flex-1 flex overflow-hidden">
      <ToolBar />
      <div class="flex-1 relative">
        <CadCanvas />
      </div>
      <div class="w-52 border-l border-neutral-700 bg-neutral-900 flex flex-col">
        <div class="flex-1 overflow-y-auto">
          <LayerPanel />
        </div>
        <PropertyPanel />
      </div>
    </div>
    <StatusBar />
  </div>
</template>
