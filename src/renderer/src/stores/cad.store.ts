import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ShapeEntity, LayerEntity, ToolType } from '../modules/cad/types'

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useCadStore = defineStore('cad', () => {
  const shapes = ref<ShapeEntity[]>([])
  const layers = ref<LayerEntity[]>([
    { id: 'layer-default', name: '默认图层', visible: true, locked: false }
  ])
  const currentLayerId = ref('layer-default')
  const currentTool = ref<ToolType>('select')
  const selectedShapeId = ref<string | null>(null)
  const history = ref<ShapeEntity[][]>([])
  const historyIndex = ref(-1)

  const currentLayer = computed(() =>
    layers.value.find(l => l.id === currentLayerId.value) ?? layers.value[0]
  )

  const selectedShape = computed(() =>
    shapes.value.find(s => s.id === selectedShapeId.value) ?? null
  )

  const visibleShapes = computed(() =>
    shapes.value.filter(s => {
      const layer = layers.value.find(l => l.id === s.layerId)
      return s.visible && (layer?.visible ?? true)
    })
  )

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function snapshot() {
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(JSON.parse(JSON.stringify(shapes.value)))
    if (history.value.length > 50) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function addShape(shape: ShapeEntity) {
    snapshot()
    shapes.value.push(shape)
  }

  function updateShape(id: string, patch: Partial<ShapeEntity>) {
    snapshot()
    const idx = shapes.value.findIndex(s => s.id === id)
    if (idx !== -1) Object.assign(shapes.value[idx], patch)
  }

  function removeShape(id: string) {
    snapshot()
    shapes.value = shapes.value.filter(s => s.id !== id)
    if (selectedShapeId.value === id) selectedShapeId.value = null
  }

  function setTool(tool: ToolType) {
    currentTool.value = tool
    if (tool !== 'select') selectedShapeId.value = null
  }

  function setSelectedShape(id: string | null) {
    selectedShapeId.value = id
  }

  function setCurrentLayer(id: string) {
    currentLayerId.value = id
  }

  function addLayer(name: string) {
    layers.value.push({ id: createId(), name, visible: true, locked: false })
  }

  function removeLayer(id: string) {
    if (layers.value.length <= 1) return
    layers.value = layers.value.filter(l => l.id !== id)
    shapes.value = shapes.value.filter(s => s.layerId !== id)
    if (currentLayerId.value === id) currentLayerId.value = layers.value[0].id
  }

  function toggleLayerVisible(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) layer.visible = !layer.visible
  }

  function toggleLayerLocked(id: string) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) layer.locked = !layer.locked
  }

  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    shapes.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
  }

  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    shapes.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
  }

  function loadFromProject(shapesData: ShapeEntity[], layersData: LayerEntity[]) {
    shapes.value = shapesData
    layers.value = layersData
    history.value = []
    historyIndex.value = -1
    selectedShapeId.value = null
  }

  return {
    shapes, layers, currentLayerId, currentTool, selectedShapeId,
    history, historyIndex,
    currentLayer, selectedShape, visibleShapes, canUndo, canRedo,
    addShape, updateShape, removeShape, setTool, setSelectedShape,
    setCurrentLayer, addLayer, removeLayer, toggleLayerVisible,
    toggleLayerLocked, undo, redo, loadFromProject
  }
})
