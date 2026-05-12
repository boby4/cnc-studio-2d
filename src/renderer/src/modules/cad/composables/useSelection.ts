import { watch, type Ref } from 'vue'
import Konva from 'konva'
import { useCadStore } from '../../../stores/cad.store'
import type { ShapeEntity } from '../types'

export function useSelection(stage: Ref<Konva.Stage | null>) {
  const store = useCadStore()
  const transformer = new Konva.Transformer({
    keepRatio: true,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    borderStroke: '#00ff88',
    borderStrokeWidth: 1,
    anchorFill: '#00ff88',
    anchorSize: 8,
  })

  function render() {
    if (!stage.value) return
    const layer = stage.value.getLayers()[0]
    layer.destroyChildren()

    for (const s of store.visibleShapes) {
      let node: Konva.Shape | null = null
      if (s.type === 'rect') {
        node = new Konva.Rect({
          id: s.id, x: s.x, y: s.y,
          width: s.width, height: s.height,
          stroke: '#00ff88', strokeWidth: 1,
          draggable: true,
        })
      } else if (s.type === 'circle') {
        node = new Konva.Circle({
          id: s.id, x: s.x, y: s.y, radius: s.radius,
          stroke: '#00ff88', strokeWidth: 1,
          draggable: true,
        })
      } else if (s.type === 'line' && s.points) {
        node = new Konva.Line({
          id: s.id,
          points: s.points,
          stroke: '#00ff88', strokeWidth: 1,
          lineCap: 'round',
          draggable: true,
        })
      }
      if (node) layer.add(node)
    }

    if (store.selectedShapeId) {
      const node = layer.findOne(`#${store.selectedShapeId}`)
      if (node) {
        transformer.nodes([node])
        layer.add(transformer)
      }
    } else {
      transformer.nodes([])
    }

    layer.batchDraw()
  }

  watch(
    () => [store.shapes, store.selectedShapeId, store.layers],
    () => render(),
    { deep: true }
  )

  watch(stage, (s) => {
    if (s) {
      render()
      s.on('click', (e) => {
        if (store.currentTool !== 'select') return
        const node = e.target as Konva.Shape
        if (node === s.getLayers()[0]) {
          store.setSelectedShape(null)
          return
        }
        if (node.id()) {
          store.setSelectedShape(node.id())
        }
      })
      s.on('dragend', (e) => {
        const node = e.target as Konva.Shape
        const id = node.id()
        if (!id) return
        const patch: Partial<ShapeEntity> = {}
        if (node instanceof Konva.Line) {
          patch.points = node.points()
          patch.x = node.x()
          patch.y = node.y()
        } else if (node instanceof Konva.Rect) {
          patch.x = node.x()
          patch.y = node.y()
        } else if (node instanceof Konva.Circle) {
          patch.x = node.x()
          patch.y = node.y()
        }
        store.updateShape(id, patch)
      })
      window.addEventListener('keydown', onKeyDown)
    }
  }, { immediate: true })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Delete' && store.selectedShapeId) {
      store.removeShape(store.selectedShapeId)
    }
  }

  return { render }
}
