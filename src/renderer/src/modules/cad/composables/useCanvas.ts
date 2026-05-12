import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import Konva from 'konva'

export function useCanvas(containerRef: Ref<HTMLDivElement | null>) {
  const stage = ref<Konva.Stage | null>(null)
  const scale = ref(1)
  const offsetX = ref(0)
  const offsetY = ref(0)

  onMounted(() => {
    if (!containerRef.value) return
    stage.value = new Konva.Stage({
      container: containerRef.value,
      width: containerRef.value.clientWidth,
      height: containerRef.value.clientHeight,
      draggable: false,
    })

    const storeLayer = new Konva.Layer()
    const tempLayer = new Konva.Layer()
    stage.value.add(storeLayer)
    stage.value.add(tempLayer)

    stage.value.on('wheel', (e) => {
      e.evt.preventDefault()
      const oldScale = scale.value
      const pointer = stage.value!.getPointerPosition()!
      const mousePointTo = {
        x: (pointer.x - offsetX.value) / oldScale,
        y: (pointer.y - offsetY.value) / oldScale,
      }
      const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1
      scale.value = Math.max(0.1, Math.min(10, newScale))
      offsetX.value = pointer.x - mousePointTo.x * scale.value
      offsetY.value = pointer.y - mousePointTo.y * scale.value
      storeLayer.scale({ x: scale.value, y: scale.value })
      storeLayer.position({ x: offsetX.value, y: offsetY.value })
      tempLayer.scale({ x: scale.value, y: scale.value })
      tempLayer.position({ x: offsetX.value, y: offsetY.value })
      storeLayer.batchDraw()
      tempLayer.batchDraw()
    })

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.value || !stage.value) return
      stage.value.width(containerRef.value.clientWidth)
      stage.value.height(containerRef.value.clientHeight)
    })
    resizeObserver.observe(containerRef.value)

    onUnmounted(() => {
      resizeObserver.disconnect()
      stage.value?.destroy()
    })
  })

  function getStoreLayer(): Konva.Layer | null {
    return stage.value?.getLayers()[0] as Konva.Layer ?? null
  }

  function getTempLayer(): Konva.Layer | null {
    return stage.value?.getLayers()[1] as Konva.Layer ?? null
  }

  return { stage, scale, offsetX, offsetY, getStoreLayer, getTempLayer }
}
