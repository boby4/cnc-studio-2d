import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { CamParams } from '../modules/cad/types'

export const useCamStore = defineStore('cam', () => {
  const params = reactive<CamParams>({
    feedRate: 800,
    spindleSpeed: 12000,
    cutDepth: 1,
    safeHeight: 5,
    stepDown: 0.5,
    cutDirection: 'climb',
    toolDiameter: 3,
    material: 'wood',
    units: 'mm',
  })

  const targetShapeIds = ref<string[]>([])
  const gcodeOutput = ref('')

  function setParams(p: Partial<CamParams>) {
    Object.assign(params, p)
  }

  function setTargetShapes(ids: string[]) {
    targetShapeIds.value = ids
  }

  function setGcodeOutput(gcode: string) {
    gcodeOutput.value = gcode
  }

  function clearGcode() {
    gcodeOutput.value = ''
  }

  return { params, targetShapeIds, gcodeOutput, setParams, setTargetShapes, setGcodeOutput, clearGcode }
})
