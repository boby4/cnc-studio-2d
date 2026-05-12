import { ref } from 'vue'
import Konva from 'konva'
import { useCadStore } from '../../../stores/cad.store'

export function useDrawing() {
  const store = useCadStore()
  const isDrawing = ref(false)
  const startPos = ref({ x: 0, y: 0 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tempShape = ref<any>(null)

  function getRelativePos(stage: Konva.Stage): { x: number; y: number } {
    const pointer = stage.getPointerPosition()!
    const transform = stage.getLayers()[0].getAbsoluteTransform().copy().invert()
    return transform.point(pointer)
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    console.log('[useDrawing] mousedown, tool:', store.currentTool, 'target:', e.target.getClassName())
    if (store.currentTool === 'select') return
    const stage = e.target.getStage()!
    const pos = getRelativePos(stage)
    isDrawing.value = true
    startPos.value = pos
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawing.value) return
    const stage = e.target.getStage()!
    const pos = getRelativePos(stage)
    const layer = stage.getLayers()[1]

    tempShape.value?.destroy()
    tempShape.value = null

    if (store.currentTool === 'line') {
      tempShape.value = new Konva.Line({
        points: [startPos.value.x, startPos.value.y, pos.x, pos.y],
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
        lineCap: 'round',
      })
    } else if (store.currentTool === 'rect') {
      const x = Math.min(startPos.value.x, pos.x)
      const y = Math.min(startPos.value.y, pos.y)
      const w = Math.abs(pos.x - startPos.value.x)
      const h = Math.abs(pos.y - startPos.value.y)
      tempShape.value = new Konva.Rect({
        x, y, width: w, height: h,
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
      })
    } else if (store.currentTool === 'circle') {
      const r = Math.sqrt(
        (pos.x - startPos.value.x) ** 2 + (pos.y - startPos.value.y) ** 2
      )
      tempShape.value = new Konva.Circle({
        x: startPos.value.x, y: startPos.value.y, radius: r,
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
      })
    }

    if (tempShape.value) layer.add(tempShape.value)
    layer.batchDraw()
  }

  function handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawing.value) return
    isDrawing.value = false
    const stage = e.target.getStage()!

    if (tempShape.value) {
      const pos = getRelativePos(stage)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      if (store.currentTool === 'line') {
        store.addShape({
          id, type: 'line',
          x: startPos.value.x, y: startPos.value.y,
          points: [startPos.value.x, startPos.value.y, pos.x, pos.y],
          layerId: store.currentLayerId, visible: true
        })
      } else if (store.currentTool === 'rect') {
        const x = Math.min(startPos.value.x, pos.x)
        const y = Math.min(startPos.value.y, pos.y)
        store.addShape({
          id, type: 'rect', x, y,
          width: Math.abs(pos.x - startPos.value.x),
          height: Math.abs(pos.y - startPos.value.y),
          layerId: store.currentLayerId, visible: true
        })
      } else if (store.currentTool === 'circle') {
        const r = Math.sqrt(
          (pos.x - startPos.value.x) ** 2 + (pos.y - startPos.value.y) ** 2
        )
        store.addShape({
          id, type: 'circle',
          x: startPos.value.x, y: startPos.value.y, radius: r,
          layerId: store.currentLayerId, visible: true
        })
      }

      // clear temp layer
      const tempLayer = stage.getLayers()[1]
      tempLayer.destroyChildren()
      tempLayer.batchDraw()
      tempShape.value = null
    }
  }

  return { isDrawing, handleMouseDown, handleMouseMove, handleMouseUp }
}
