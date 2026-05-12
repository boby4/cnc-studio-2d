<script setup lang="ts">
import CadCanvas from '../modules/cad/components/CadCanvas.vue'
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-neutral-950">
    <div class="flex-1 flex">
      <div class="flex-1 relative">
        <CadCanvas />
      </div>
    </div>
  </div>
</template>
