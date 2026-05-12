# CNC Studio 2D — MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 CNC Studio 2D MVP — 一个基于 Electron + Vue3 + Konva.js 的桌面 2D CAD/CAM 平台，支持图形绘制、图层管理、G-code 导出。

**Architecture:** electron-vite 脚手架 → Electron 主进程（IPC + 文件系统） + Vue3 渲染进程（Konva Canvas + Pinia Stores）。CAD 画布采用薄封装 Konva + Composable 模式，CAM 通过独立 composable 生成 G-code。

**Tech Stack:** Electron + electron-vite, Vue 3 (script setup + Composition API), TypeScript, Pinia, Vue Router, Konva.js, TailwindCSS, Vitest

---

### Task 1: 项目初始化（electron-vite 脚手架）

**Files:**
- 创建: `cnc-studio-2d/` 下所有脚手架文件

- [ ] **Step 1: 通过 electron-vite 脚手架创建项目**

```bash
cd "D:\副业方案\项目三"
npm create @quick-start/electron@latest cnc-studio-2d -- --template vue-ts
```

Expected: 在 cnc-studio-2d 目录下生成 Electron + Vue3 + TypeScript 项目骨架。

- [ ] **Step 2: 安装依赖 + 额外包**

```bash
cd "D:\副业方案\项目三\cnc-studio-2d"
npm install
npm install konva vue-konva pinia vue-router
npm install -D tailwindcss @tailwindcss/vite vitest @vue/test-utils
```

- [ ] **Step 3: 验证项目可运行**

```bash
npm run dev
```

Expected: Electron 窗口打开，显示默认 Vue 页面。

- [ ] **Step 4: 清理脚手架默认文件**

删除默认的 `src/App.vue` 内容、`src/components/` 下默认组件，移除不需要的示例代码。

- [ ] **Step 5: 创建目录结构**

```bash
mkdir -p "src/router"
mkdir -p "src/views"
mkdir -p "src/stores"
mkdir -p "src/shared"
mkdir -p "src/modules/cad/composables"
mkdir -p "src/modules/cad/components"
mkdir -p "src/modules/cam/composables"
mkdir -p "src/modules/cam/components"
mkdir -p "electron/ipc"
```

- [ ] **Step 6: 提交**

```bash
cd "D:\副业方案\项目三\cnc-studio-2d"
git add -A
git commit -m "chore: scaffold electron-vite project with dependencies"
```

---

### Task 2: 基础类型定义

**Files:**
- 创建: `src/modules/cad/types.ts`

- [ ] **Step 1: 创建 CAD 类型文件**

```ts
// src/modules/cad/types.ts

export type ToolType = 'select' | 'line' | 'rect' | 'circle'

export interface LayerEntity {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

export interface ShapeEntity {
  id: string
  type: 'line' | 'rect' | 'circle'
  x: number
  y: number
  points?: number[]          // line: [x1, y1, x2, y2]
  width?: number             // rect
  height?: number            // rect
  radius?: number            // circle
  layerId: string
  visible: boolean
}

export interface ProjectData {
  version: string
  shapes: ShapeEntity[]
  layers: LayerEntity[]
  camParams: CamParams | null
}

export interface CamParams {
  feedRate: number
  spindleSpeed: number
  cutDepth: number
  safeHeight: number
  stepDown: number
  cutDirection: 'climb' | 'conventional'
  toolDiameter: number
  material: string
  units: 'mm' | 'inch'
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx vue-tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/modules/cad/types.ts
git commit -m "feat: add CAD type definitions (ShapeEntity, LayerEntity, ToolType)"
```

---

### Task 3: Pinia cadStore

**Files:**
- 创建: `src/stores/cad.store.ts`
- 修改: `src/main.ts` (注册 Pinia)

- [ ] **Step 1: 创建 cadStore**

```ts
// src/stores/cad.store.ts
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
```

- [ ] **Step 2: 注册 Pinia 到 Vue 应用**

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

- [ ] **Step 3: 验证编译**

```bash
npx vue-tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/stores/cad.store.ts src/main.ts
git commit -m "feat: add cadStore with shapes, layers, undo/redo, and snapshot history"
```

---

### Task 4: useCanvas composable + CadCanvas 组件

**Files:**
- 创建: `src/modules/cad/composables/useCanvas.ts`
- 创建: `src/modules/cad/components/CadCanvas.vue`
- 创建: `src/views/Workspace.vue`
- 创建: `src/router/index.ts`
- 修改: `src/App.vue`

- [ ] **Step 1: 创建 useCanvas composable**

```ts
// src/modules/cad/composables/useCanvas.ts
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

    const layer = new Konva.Layer()
    stage.value.add(layer)

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
      layer.scale({ x: scale.value, y: scale.value })
      layer.position({ x: offsetX.value, y: offsetY.value })
      layer.batchDraw()
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

  function getLayer(): Konva.Layer | null {
    return stage.value?.getLayers()[0] as Konva.Layer ?? null
  }

  return { stage, scale, offsetX, offsetY, getLayer }
}
```

- [ ] **Step 2: 创建 CadCanvas 组件**

```vue
<script setup lang="ts">
// src/modules/cad/components/CadCanvas.vue
import { ref } from 'vue'
import { useCanvas } from '../composables/useCanvas'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage } = useCanvas(containerRef)
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-neutral-900" />
</template>
```

- [ ] **Step 3: 创建路由**

```ts
// src/router/index.ts
import { createRouter, createMemoryHistory } from 'vue-router'
import Workspace from '../views/Workspace.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'workspace', component: Workspace }
  ]
})

export default router
```

- [ ] **Step 4: 创建 Workspace 页面**

```vue
<script setup lang="ts">
// src/views/Workspace.vue
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
```

- [ ] **Step 5: 更新 App.vue（注册路由）**

```vue
<script setup lang="ts">
// src/App.vue
</script>

<template>
  <router-view />
</template>
```

- [ ] **Step 6: 更新 main.ts（注册路由）**

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 7: 验证运行**

```bash
npm run dev
```

Expected: Electron 窗口打开，显示黑色的全屏 Canvas 区域，鼠标滚轮可缩放。

- [ ] **Step 8: 提交**

```bash
git add src/modules/cad/composables/useCanvas.ts src/modules/cad/components/CadCanvas.vue src/views/Workspace.vue src/router/index.ts src/App.vue src/main.ts
git commit -m "feat: add Konva canvas with zoom/pan via useCanvas composable"
```

---

### Task 5: 绘图工具（useDrawing + ToolBar）

**Files:**
- 创建: `src/modules/cad/composables/useDrawing.ts`
- 创建: `src/modules/cad/components/ToolBar.vue`
- 修改: `src/modules/cad/components/CadCanvas.vue`
- 修改: `src/views/Workspace.vue`

- [ ] **Step 1: 创建 useDrawing composable**

```ts
// src/modules/cad/composables/useDrawing.ts
import { ref } from 'vue'
import type Konva from 'konva'
import { useCadStore } from '../../../stores/cad.store'
import type { ToolType } from '../types'

export function useDrawing(getStage: () => Konva.Stage | null) {
  const store = useCadStore()
  const isDrawing = ref(false)
  const startPos = ref({ x: 0, y: 0 })
  const tempShape = ref<Konva.Shape | null>(null)

  function getRelativePos(stage: Konva.Stage): { x: number; y: number } {
    const pointer = stage.getPointerPosition()!
    const transform = stage.getLayers()[0].getAbsoluteTransform().copy().invert()
    return transform.point(pointer)
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
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
    const layer = stage.getLayers()[0]

    tempShape.value?.destroy()

    if (store.currentTool === 'line') {
      tempShape.value = new Konva.Line({
        points: [startPos.value.x, startPos.value.y, pos.x, pos.y],
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
        lineCap: 'round',
      }) as unknown as Konva.Shape
    } else if (store.currentTool === 'rect') {
      const x = Math.min(startPos.value.x, pos.x)
      const y = Math.min(startPos.value.y, pos.y)
      const w = Math.abs(pos.x - startPos.value.x)
      const h = Math.abs(pos.y - startPos.value.y)
      tempShape.value = new Konva.Rect({
        x, y, width: w, height: h,
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
      }) as unknown as Konva.Shape
    } else if (store.currentTool === 'circle') {
      const r = Math.sqrt(
        (pos.x - startPos.value.x) ** 2 + (pos.y - startPos.value.y) ** 2
      )
      tempShape.value = new Konva.Circle({
        x: startPos.value.x, y: startPos.value.y, radius: r,
        stroke: '#00ff88',
        strokeWidth: 2 / (layer.scaleX() || 1),
      }) as unknown as Konva.Shape
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
      tempShape.value.destroy()
      tempShape.value = null
    }
  }

  return { isDrawing, handleMouseDown, handleMouseMove, handleMouseUp }
}
```

- [ ] **Step 2: 创建 ToolBar 组件**

```vue
<script setup lang="ts">
// src/modules/cad/components/ToolBar.vue
import { useCadStore } from '../../../stores/cad.store'
import type { ToolType } from '../types'

const store = useCadStore()

const tools: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: '选择', icon: '↖' },
  { type: 'line', label: '直线', icon: '╲' },
  { type: 'rect', label: '矩形', icon: '□' },
  { type: 'circle', label: '圆', icon: '○' },
]
</script>

<template>
  <div class="w-12 bg-neutral-900 border-r border-neutral-700 flex flex-col items-center py-2 gap-1">
    <button
      v-for="tool in tools"
      :key="tool.type"
      :class="[
        'w-9 h-9 flex items-center justify-center rounded text-lg',
        store.currentTool === tool.type
          ? 'bg-emerald-600 text-white'
          : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
      ]"
      :title="tool.label"
      @click="store.setTool(tool.type)"
    >
      {{ tool.icon }}
    </button>
  </div>
</template>
```

- [ ] **Step 3: 更新 CadCanvas 接入 useDrawing**

```vue
<script setup lang="ts">
// src/modules/cad/components/CadCanvas.vue
import { ref, watch } from 'vue'
import { useCanvas } from '../composables/useCanvas'
import { useDrawing } from '../composables/useDrawing'
import Konva from 'konva'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage, getLayer } = useCanvas(containerRef)
const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(
  () => stage.value
)

watch(stage, (s) => {
  if (!s) return
  s.on('mousedown', handleMouseDown)
  s.on('mousemove', handleMouseMove)
  s.on('mouseup', handleMouseUp)
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full bg-neutral-900" />
</template>
```

- [ ] **Step 4: 更新 Workspace 加入 ToolBar**

在 Workspace.vue 中导入 ToolBar 并放到左侧：
```vue
<script setup lang="ts">
import CadCanvas from '../modules/cad/components/CadCanvas.vue'
import ToolBar from '../modules/cad/components/ToolBar.vue'
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-neutral-950">
    <div class="flex-1 flex">
      <ToolBar />
      <div class="flex-1 relative">
        <CadCanvas />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 验证绘图功能**

```bash
npm run dev
```

手动测试：点击直线/矩形/圆按钮，在画布上拖动绘制，确认图形出现。

- [ ] **Step 6: 提交**

```bash
git add src/modules/cad/composables/useDrawing.ts src/modules/cad/components/ToolBar.vue src/modules/cad/components/CadCanvas.vue src/views/Workspace.vue
git commit -m "feat: add drawing tools (line, rect, circle) with useDrawing composable"
```

---

### Task 6: 选择/移动/删除（useSelection）

**Files:**
- 创建: `src/modules/cad/composables/useSelection.ts`
- 修改: `src/modules/cad/components/CadCanvas.vue`

- [ ] **Step 1: 创建 useSelection composable**

```ts
// src/modules/cad/composables/useSelection.ts
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

    // 先重新渲染所有 shape from store
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

    // 选中态
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

  // 监听 store 变化，重新渲染
  watch(
    () => [store.shapes, store.selectedShapeId, store.layers],
    () => render(),
    { deep: true }
  )

  // 初始渲染
  watch(stage, (s) => {
    if (s) {
      render()
      // 点击选择
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
      // 拖拽更新坐标
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
      // Delete 键删除
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
```

- [ ] **Step 2: 更新 CadCanvas 使用 useSelection**

在 CadCanvas.vue 中导入 useSelection，传入 `stage` ref：
```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCanvas } from '../composables/useCanvas'
import { useDrawing } from '../composables/useDrawing'
import { useSelection } from '../composables/useSelection'

const containerRef = ref<HTMLDivElement | null>(null)
const { stage, getLayer } = useCanvas(containerRef)
const { handleMouseDown, handleMouseMove, handleMouseUp } = useDrawing(() => stage.value)
const { render } = useSelection(stage)

watch(stage, (s) => {
  if (!s) return
  s.on('mousedown', handleMouseDown)
  s.on('mousemove', handleMouseMove)
  s.on('mouseup', handleMouseUp)
})
</script>
```

- [ ] **Step 3: 验证选择/移动/删除**

```bash
npm run dev
```

手动测试：切换到选择工具，点击图形 → 出现变形框；拖拽移动；按 Delete 删除。

- [ ] **Step 4: 提交**

```bash
git add src/modules/cad/composables/useSelection.ts src/modules/cad/components/CadCanvas.vue
git commit -m "feat: add selection, drag-move, and delete with Transformer"
```

---

### Task 7: 撤销/重做 + 图层面板 + 状态栏

**Files:**
- 创建: `src/modules/cad/composables/useHistory.ts`
- 创建: `src/modules/cad/components/LayerPanel.vue`
- 创建: `src/modules/cad/components/StatusBar.vue`
- 修改: `src/views/Workspace.vue`

- [ ] **Step 1: 创建 useHistory composable**

```ts
// src/modules/cad/composables/useHistory.ts
import { onMounted, onUnmounted } from 'vue'
import { useCadStore } from '../../../stores/cad.store'

export function useHistory() {
  const store = useCadStore()

  function onKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      store.undo()
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      store.redo()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
```

- [ ] **Step 2: 创建 LayerPanel 组件**

```vue
<script setup lang="ts">
// src/modules/cad/components/LayerPanel.vue
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
```

- [ ] **Step 3: 创建 StatusBar 组件**

```vue
<script setup lang="ts">
// src/modules/cad/components/StatusBar.vue
import { useCadStore } from '../../../stores/cad.store'

const store = useCadStore()
</script>

<template>
  <div class="h-6 bg-neutral-900 border-t border-neutral-700 flex items-center px-3 text-xs text-neutral-500 gap-4 select-none">
    <span>工具: {{ store.currentTool }}</span>
    <span v-if="store.selectedShape">选中: {{ store.selectedShape.type }} ({{ store.selectedShape.id.slice(-6) }})</span>
    <span class="ml-auto">图层: {{ store.currentLayer?.name }}</span>
  </div>
</template>
```

- [ ] **Step 4: 更新 Workspace 完整布局**

```vue
<script setup lang="ts">
// src/views/Workspace.vue
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
```

- [ ] **Step 5: 验证功能**

```bash
npm run dev
```

测试：Ctrl+Z/Ctrl+Y 撤销重做；图层面板增删/显隐；底部状态栏显示工具和图层信息。

- [ ] **Step 6: 提交**

```bash
git add src/modules/cad/composables/useHistory.ts src/modules/cad/components/LayerPanel.vue src/modules/cad/components/StatusBar.vue src/views/Workspace.vue
git commit -m "feat: add undo/redo, layer panel, and status bar"
```

---

### Task 8: 属性面板 + 文件打开/保存（IPC）

**Files:**
- 创建: `src/modules/cad/components/PropertyPanel.vue`
- 创建: `src/shared/ipc.api.ts`
- 创建: `electron/ipc/index.ts`
- 创建: `electron/ipc/file.handler.ts`
- 修改: `electron/main.ts`
- 修改: `electron/preload.ts`
- 修改: `src/views/Workspace.vue`

- [ ] **Step 1: 创建 camStore 基础 stub**

Task 9 会完善 camStore，这里先建最小版本以支持保存逻辑：

```ts
// src/stores/cam.store.ts
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { CamParams } from '../modules/cad/types'

export const useCamStore = defineStore('cam', () => {
  const params = reactive<CamParams>({
    feedRate: 800, spindleSpeed: 12000, cutDepth: 1,
    safeHeight: 5, stepDown: 0.5, cutDirection: 'climb',
    toolDiameter: 3, material: 'wood', units: 'mm',
  })
  function setParams(p: Partial<CamParams>) { Object.assign(params, p) }
  return { params, setParams }
})
```

- [ ] **Step 3: 创建 PropertyPanel 组件**

```vue
<script setup lang="ts">
// src/modules/cad/components/PropertyPanel.vue
import { computed } from 'vue'
import { useCadStore } from '../../../stores/cad.store'

const store = useCadStore()

const shape = computed(() => store.selectedShape)

function updateX(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { x: v })
}

function updateY(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { y: v })
}

function updateWidth(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { width: v })
}

function updateHeight(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { height: v })
}

function updateRadius(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (shape.value && !isNaN(v)) store.updateShape(shape.value.id, { radius: v })
}
</script>

<template>
  <div class="border-t border-neutral-700 px-2 py-1.5">
    <div class="text-xs font-semibold text-neutral-300 uppercase tracking-wide mb-1">属性</div>
    <template v-if="shape">
      <div class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">X</span>
        <input :value="Math.round(shape.x * 100) / 100" @input="updateX"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">Y</span>
        <input :value="Math.round(shape.y * 100) / 100" @input="updateY"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'rect'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">W</span>
        <input :value="Math.round((shape.width ?? 0) * 100) / 100" @input="updateWidth"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'rect'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">H</span>
        <input :value="Math.round((shape.height ?? 0) * 100) / 100" @input="updateHeight"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
      <div v-if="shape.type === 'circle'" class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-neutral-500 w-5">R</span>
        <input :value="Math.round((shape.radius ?? 0) * 100) / 100" @input="updateRadius"
          class="flex-1 bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600 outline-none w-0" />
      </div>
    </template>
    <p v-else class="text-xs text-neutral-600">选择一个图形</p>
  </div>
</template>
```

- [ ] **Step 4: 创建 IPC API 类型封装**

```ts
// src/shared/ipc.api.ts
import type { ProjectData } from '../modules/cad/types'

export interface ElectronAPI {
  file: {
    open: () => Promise<ProjectData | null>
    save: (data: ProjectData) => Promise<void>
    exportGcode: (gcode: string) => Promise<void>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

- [ ] **Step 5: 创建 Electron IPC handlers**

```ts
// electron/ipc/file.handler.ts
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'

export function registerFileHandlers() {
  ipcMain.handle('file:open', async () => {
    const win = BrowserWindow.getFocusedWindow()!
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'CNC Project', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    try {
      const content = await readFile(result.filePaths[0], 'utf-8')
      return JSON.parse(content)
    } catch {
      throw new Error('文件读取失败')
    }
  })

  ipcMain.handle('file:save', async (_event, data: unknown) => {
    const win = BrowserWindow.getFocusedWindow()!
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'CNC Project', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return
    try {
      await writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch {
      throw new Error('文件保存失败')
    }
  })

  ipcMain.handle('file:export-gcode', async (_event, gcode: string) => {
    const win = BrowserWindow.getFocusedWindow()!
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'G-code', extensions: ['nc', 'gcode', 'txt'] }],
    })
    if (result.canceled || !result.filePath) return
    await writeFile(result.filePath, gcode, 'utf-8')
  })
}
```

```ts
// electron/ipc/index.ts
export { registerFileHandlers } from './file.handler'
```

- [ ] **Step 6: 更新 electron/main.ts**

```ts
// electron/main.ts
import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { registerFileHandlers } from './ipc'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'CNC Studio 2D',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerFileHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 7: 更新 preload.ts**

```ts
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (data: unknown) => ipcRenderer.invoke('file:save', data),
    exportGcode: (gcode: string) => ipcRenderer.invoke('file:export-gcode', gcode),
  }
})
```

- [ ] **Step 8: 更新 Workspace 加入 PropertyPanel + 快捷键保存**

在 Workspace.vue 中：
```vue
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
```

- [ ] **Step 9: 验证文件打开/保存**

```bash
npm run dev
```

手动测试：Ctrl+O 打开 JSON 文件，Ctrl+S 保存。

- [ ] **Step 10: 提交**

```bash
git add src/stores/cam.store.ts src/modules/cad/components/PropertyPanel.vue src/shared/ipc.api.ts electron/ipc/index.ts electron/ipc/file.handler.ts electron/main.ts electron/preload.ts src/views/Workspace.vue
git commit -m "feat: add property panel and file open/save via IPC"
```

---

### Task 9: CAM Store + useGcodeGen + CamPanel

**Files:**
- 创建: `src/modules/cam/types.ts`
- 修改: `src/stores/cam.store.ts` (完善，基础 stub 已在 Task 8 创建)
- 创建: `src/modules/cam/composables/useGcodeGen.ts`
- 创建: `src/modules/cam/components/CamPanel.vue`
- 修改: `src/views/Workspace.vue`

- [ ] **Step 1: 创建 CAM 类型**

```ts
// src/modules/cam/types.ts
import type { CamParams } from '../cad/types'
export type { CamParams }
```

- [ ] **Step 2: 完善 camStore（添加 targetShapeIds、gcodeOutput、生成/导出 actions）**

```ts
// src/stores/cam.store.ts — 在现有 stub 基础上添加
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
```

- [ ] **Step 3: 创建 useGcodeGen composable**

```ts
// src/modules/cam/composables/useGcodeGen.ts
import { useCadStore } from '../../../stores/cad.store'
import type { CamParams, ShapeEntity } from '../../cad/types'

export function useGcodeGen() {
  const cadStore = useCadStore()

  function generate(shapeIds: string[], params: CamParams): string {
    const shapes = cadStore.shapes.filter(s => shapeIds.includes(s.id))
    if (shapes.length === 0) return ''

    const lines: string[] = []
    lines.push(params.units === 'inch' ? 'G20' : 'G21')
    lines.push('G90')
    lines.push(`G0 Z${params.safeHeight}`)
    lines.push(`M3 S${params.spindleSpeed}`)

    for (const shape of shapes) {
      const toolpath = getToolPath(shape)
      if (toolpath.length === 0) continue

      const first = toolpath[0]
      lines.push(`G0 X${fmt(first.x)} Y${fmt(first.y)}`)
      lines.push(`G1 Z-${params.cutDepth} F${params.feedRate}`)

      for (const pt of toolpath) {
        lines.push(`G1 X${fmt(pt.x)} Y${fmt(pt.y)} F${params.feedRate}`)
      }

      lines.push(`G0 Z${params.safeHeight}`)
    }

    lines.push('M5')
    lines.push('M30')
    return lines.join('\n')
  }

  function getToolPath(shape: ShapeEntity): { x: number; y: number }[] {
    if (shape.type === 'rect') {
      const x = shape.x, y = shape.y
      const w = shape.width ?? 0, h = shape.height ?? 0
      return [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
        { x, y },
      ]
    }
    if (shape.type === 'circle') {
      const cx = shape.x, cy = shape.y, r = shape.radius ?? 0
      const segs = 36
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i <= segs; i++) {
        const angle = (i / segs) * Math.PI * 2
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
      }
      return pts
    }
    if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
      return [
        { x: shape.points[0], y: shape.points[1] },
        { x: shape.points[2], y: shape.points[3] },
      ]
    }
    return []
  }

  function fmt(n: number): string {
    return (Math.round(n * 100) / 100).toString()
  }

  return { generate }
}
```

- [ ] **Step 4: 创建 CamPanel 组件**

```vue
<script setup lang="ts">
// src/modules/cam/components/CamPanel.vue
import { computed } from 'vue'
import { useCadStore } from '../../../stores/cad.store'
import { useCamStore } from '../../../stores/cam.store'
import { useGcodeGen } from '../composables/useGcodeGen'

const cadStore = useCadStore()
const camStore = useCamStore()
const { generate } = useGcodeGen()

const allSelected = computed(() =>
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
  camStore.setTargetShapes(camStore.targetShapeIds.length === allSelected.value.length
    ? [] : [...allSelected.value])
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
  <div class="border-t border-neutral-700 p-2 flex flex-col max-h-80">
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
      <label class="text-[10px] text-neutral-500 flex items-center gap-1">
        <select @change="camStore.setParams({ cutDirection: ($event.target as HTMLSelectElement).value as 'climb' | 'conventional' })"
          class="bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600">
          <option value="climb">顺铣</option>
          <option value="conventional">逆铣</option>
        </select>
      </label>
      <label class="text-[10px] text-neutral-500 flex items-center gap-1">
        <select @change="camStore.setParams({ units: ($event.target as HTMLSelectElement).value as 'mm' | 'inch' })"
          class="bg-neutral-800 text-white text-xs px-1 py-0.5 rounded border border-neutral-600">
          <option value="mm">mm</option>
          <option value="inch">inch</option>
        </select>
      </label>
    </div>

    <div class="mb-1">
      <div class="flex items-center justify-between">
        <span class="text-[10px] text-neutral-500">目标图形</span>
        <button @click="selectAll" class="text-[10px] text-emerald-400 hover:text-emerald-300">
          {{ camStore.targetShapeIds.length === allSelected.length ? '取消全选' : '全选' }}
        </button>
      </div>
      <div class="max-h-16 overflow-y-auto text-xs text-neutral-400">
        <div v-for="s in allSelected" :key="s" class="flex items-center gap-1">
          <input type="checkbox" :checked="camStore.targetShapeIds.includes(s)"
            @change="toggleShape(s)" class="w-3 h-3" />
          <span>{{ s }}</span>
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
```

- [ ] **Step 5: 更新 Workspace 加入 CamPanel**

在 Workspace.vue 的右侧面板 `<PropertyPanel />` 下方加入 `<CamPanel />`：

```vue
<div class="w-52 border-l border-neutral-700 bg-neutral-900 flex flex-col">
  <div class="flex-1 overflow-y-auto">
    <LayerPanel />
  </div>
  <PropertyPanel />
  <CamPanel />
</div>
```

- [ ] **Step 6: 验证 CAM 和 G-code 导出**

```bash
npm run dev
```

手动测试：选择目标图形 → 设置 CAM 参数 → 点击"生成 G-code" → 在 textarea 中预览 → 点击"导出 G-code" → 选择保存位置。

- [ ] **Step 7: 提交**

```bash
git add src/modules/cam/types.ts src/stores/cam.store.ts src/modules/cam/composables/useGcodeGen.ts src/modules/cam/components/CamPanel.vue src/views/Workspace.vue
git commit -m "feat: add CAM panel, G-code generation, and export"
```

---

### Task 10: 端到端集成验证 + 构建测试

**Files:**
- 无新文件

- [ ] **Step 1: 完整流程测试**

```bash
npm run dev
```

按以下流程走一遍：
1. 绘图：直线 → 矩形 → 圆
2. 选择：点击选择图形，拖拽移动
3. 编辑：在属性面板改 X/Y/W/H
4. 图层：新建图层、切换、隐藏
5. 撤销/重做：Ctrl+Z / Ctrl+Y
6. 保存：Ctrl+S → 关闭 → Ctrl+O 打开
7. CAM：选图形 → 设参数 → 生成 G-code → 导出

- [ ] **Step 2: 运行构建**

```bash
npm run build
```

Expected: 无错误，生成可打包的输出。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "chore: final integration verification and build test"
```
