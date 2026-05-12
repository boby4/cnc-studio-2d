<script setup lang="ts">
import { useHistory } from '../modules/cad/composables/useHistory'
import CadCanvas from '../modules/cad/components/CadCanvas.vue'
import ToolBar from '../modules/cad/components/ToolBar.vue'
import LayerPanel from '../modules/cad/components/LayerPanel.vue'
import StatusBar from '../modules/cad/components/StatusBar.vue'

useHistory()
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-neutral-950 text-white">
    <div class="flex-1 flex overflow-hidden">
      <ToolBar />
      <div class="flex-1 relative">
        <CadCanvas />
      </div>
      <div class="w-52 border-l border-neutral-700 bg-neutral-900">
        <LayerPanel />
      </div>
    </div>
    <StatusBar />
  </div>
</template>
