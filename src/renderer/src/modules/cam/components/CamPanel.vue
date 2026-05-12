<script setup lang="ts">
import { computed } from 'vue'
import { useCadStore } from '../../../stores/cad.store'
import { useCamStore } from '../../../stores/cam.store'
import { useGcodeGen } from '../composables/useGcodeGen'

const cadStore = useCadStore()
const camStore = useCamStore()
const { generate } = useGcodeGen()

const allShapes = computed(() =>
  cadStore.shapes.map(s => s.id)
)

const isValid = computed(() =>
  camStore.targetShapeIds.length > 0
  && camStore.params.feedRate > 0
  && camStore.params.spindleSpeed > 0
  && camStore.params.cutDepth > 0
)

function toggleShape(id: string) {
  const idx = camStore.targetShapeIds.indexOf(id)
  if (idx === -1) {
    camStore.setTargetShapes([...camStore.targetShapeIds, id])
  } else {
    camStore.setTargetShapes(camStore.targetShapeIds.filter(i => i !== id))
  }
}

function selectAll() {
  camStore.setTargetShapes(
    camStore.targetShapeIds.length === allShapes.value.length
      ? [] : [...allShapes.value]
  )
}

function doGenerate() {
  camStore.setGcodeOutput(generate(camStore.targetShapeIds, camStore.params))
}

async function doExport() {
  try {
    await window.electronAPI.file.exportGcode(camStore.gcodeOutput)
  } catch (e: unknown) {
    console.error((e as Error).message)
  }
}

function updateParam(key: string, e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (!isNaN(v)) camStore.setParams({ [key]: v })
}
</script>

<template>
  <div class="border-t border-neutral-700 p-2 flex flex-col max-h-80 overflow-y-auto">
    <div class="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-1">CAM 参数</div>

    <div class="grid grid-cols-2 gap-1 mb-1">
      <div>
        <label class="text-[10px] text-neutral-500">进给速度</label>
        <input :value="camStore.params.feedRate" @input="updateParam('feedRate', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
      <div>
        <label class="text-[10px] text-neutral-500">主轴转速</label>
        <input :value="camStore.params.spindleSpeed" @input="updateParam('spindleSpeed', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
      <div>
        <label class="text-[10px] text-neutral-500">切割深度</label>
        <input :value="camStore.params.cutDepth" @input="updateParam('cutDepth', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
      <div>
        <label class="text-[10px] text-neutral-500">安全高度</label>
        <input :value="camStore.params.safeHeight" @input="updateParam('safeHeight', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
      <div>
        <label class="text-[10px] text-neutral-500">步进距离</label>
        <input :value="camStore.params.stepDown" @input="updateParam('stepDown', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
      <div>
        <label class="text-[10px] text-neutral-500">刀具直径</label>
        <input :value="camStore.params.toolDiameter" @input="updateParam('toolDiameter', $event)"
          class="w-full bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none" />
      </div>
    </div>

    <div class="flex gap-2 mb-1">
      <select @change="camStore.setParams({ cutDirection: ($event.target as HTMLSelectElement).value as 'climb' | 'conventional' })"
        class="bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600">
        <option value="climb">顺铣</option>
        <option value="conventional">逆铣</option>
      </select>
      <select @change="camStore.setParams({ units: ($event.target as HTMLSelectElement).value as 'mm' | 'inch' })"
        class="bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600">
        <option value="mm">mm</option>
        <option value="inch">inch</option>
      </select>
    </div>

    <div class="mb-1">
      <div class="flex items-center justify-between">
        <span class="text-[10px] text-neutral-500">目标图形</span>
        <button @click="selectAll" class="text-[10px] text-emerald-400 hover:text-emerald-300">
          {{ camStore.targetShapeIds.length === allShapes.length ? '取消全选' : '全选' }}
        </button>
      </div>
      <div class="max-h-16 overflow-y-auto text-xs text-neutral-400">
        <div v-for="id in allShapes" :key="id" class="flex items-center gap-1">
          <input type="checkbox" :checked="camStore.targetShapeIds.includes(id)"
            @change="toggleShape(id)" class="w-3 h-3" />
          <span class="truncate">{{ id.slice(-8) }}</span>
        </div>
      </div>
    </div>

    <button :disabled="!isValid" @click="doGenerate"
      class="w-full py-1 rounded text-xs font-semibold mb-1"
      :class="isValid ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'">
      生成 G-code
    </button>

    <textarea v-if="camStore.gcodeOutput"
      readonly
      class="w-full h-20 bg-neutral-800 text-emerald-400 text-[10px] p-1 rounded border border-neutral-600 mb-1 resize-none font-mono"
      :value="camStore.gcodeOutput" />

    <button v-if="camStore.gcodeOutput"
      @click="doExport"
      class="w-full py-1 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500">
      导出 G-code
    </button>
  </div>
</template>
