# CNC Studio 2D — 设计文档

**日期：** 2026-05-11
**状态：** 已确认
**目标：** 实现 CNC Studio 2D MVP — 一个基于 Electron + Vue3 的桌面 2D CAD/CAM 平台

---

## 技术栈

- Electron + electron-vite
- Vue 3 (Composition API, `<script setup>`)
- TypeScript (完整类型)
- Pinia (状态管理)
- Vue Router (路由)
- Konva.js (2D Canvas)
- TailwindCSS (样式)
- Vitest (单元/组件测试)
- Playwright (E2E)

---

## 1. 项目结构

```
cnc-studio-2d/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 窗口创建、菜单、IPC 注册
│   ├── preload.ts               # contextBridge 暴露安全 API
│   └── ipc/
│       ├── index.ts             # IPC handler 注册入口
│       ├── file.handler.ts      # 文件读写（打开/保存 JSON）
│       └── export.handler.ts    # G-code 导出写入
├── src/                         # Vue Renderer
│   ├── main.ts                  # Vue 应用入口
│   ├── App.vue                  # 根组件（布局壳）
│   ├── router/
│   │   └── index.ts             # 路由（MVP 仅 /workspace）
│   ├── views/
│   │   └── Workspace.vue        # 主工作区页面
│   ├── modules/
│   │   ├── cad/
│   │   │   ├── composables/     # useCanvas / useDrawing / useSelection / useHistory
│   │   │   ├── components/      # CadCanvas / ToolBar / LayerPanel / PropertyPanel
│   │   │   └── types.ts         # ShapeEntity, LayerEntity, ToolType
│   │   └── cam/
│   │       ├── composables/     # useCamParams / useGcodeGen
│   │       ├── components/      # CamPanel
│   │       └── types.ts         # CamParams, GcodeLine
│   ├── stores/
│   │   ├── cad.store.ts         # 图形列表、图层、选中、撤销栈
│   │   └── cam.store.ts         # CAM 参数、G-code 输出
│   └── shared/
│       ├── constants.ts         # 默认参数、快捷键
│       └── ipc.api.ts           # 对 preload API 的类型封装
├── resources/                   # 应用图标
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
└── tailwind.config.ts
```

## 2. Electron 层

### Main Process

- 创建单个 BrowserWindow，加载 renderer
- 注册系统菜单：文件 (打开/保存/导出)、编辑 (撤销/重做)
- 注册所有 IPC handlers
- 窗口关闭时清理

### Preload

通过 `contextBridge.exposeInMainWorld` 暴露 `window.electronAPI`：

```ts
{
  file: {
    open:        () => Promise<ProjectData | null>,
    save:        (data: ProjectData) => Promise<void>,
    exportGcode: (gcode: string) => Promise<void>,
  }
}
```

### IPC Handlers

| Handler | 方向 | 职责 |
|---------|------|------|
| `file:open` | Renderer → Main | 弹出打开对话框，读 JSON 返回 |
| `file:save` | Renderer → Main | 弹出保存对话框，写 JSON |
| `file:export-gcode` | Renderer → Main | 弹出保存对话框，写 .nc 文件 |

安全规则：Renderer 永远不直接 `import fs` 或 `import path`，所有文件操作走 preload → IPC → main。

## 3. CAD 画布 — Composable 层

架构选择：**薄封装 Konva + Composable 模式**。直接使用 Konva.js，通过 composables 封装可复用逻辑。

### useCanvas — 画布生命周期

- Konva.Stage 创建/销毁
- 响应式宽高
- 缩放/平移控制
- 输入：容器 ref
- 输出：stage 实例、viewport 状态 (scale, offset)

### useDrawing — 绘图工具

- 根据当前 ToolType (line/rect/circle) 处理 mousedown/mousemove/mouseup
- 创建 Konva.Shape → 生成 ShapeEntity → 写入 cadStore.shapes
- 依赖：useCanvas、cadStore

### useSelection — 选择与编辑

- 点击选择 → Konva.Transformer 绑定
- 拖拽移动 → 更新 ShapeEntity.x/y
- Delete 键删除
- 选中后通知属性面板
- 依赖：useCanvas、cadStore

### useHistory — 撤销/重做

- 监听 cadStore.shapes 变化 → 压入历史栈
- Ctrl+Z / Ctrl+Y 触发
- 栈深限制 50 步
- 依赖：cadStore

### ShapeEntity 类型

```ts
type LayerEntity = {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

type ShapeEntity = {
  id: string
  type: 'line' | 'rect' | 'circle'
  x: number; y: number
  points?: number[]       // line 专有
  width?: number; height?: number  // rect 专有
  radius?: number         // circle 专有
  layerId: string
  visible: boolean
}

type ToolType = 'select' | 'line' | 'rect' | 'circle'
```

## 4. 状态管理（Pinia）

### cadStore

| 字段 | 类型 | 说明 |
|------|------|------|
| shapes | ShapeEntity[] | 所有图形 |
| layers | LayerEntity[] | 图层列表 |
| currentLayerId | string | 当前绘制图层 |
| currentTool | ToolType | 当前工具 |
| selectedShapeId | string\|null | 选中图形 |
| history | ShapeEntity[][] | 撤销快照栈 |
| historyIndex | number | 当前位置指针 |

Actions: addShape / updateShape / removeShape / addLayer / removeLayer / toggleLayerVisible / toggleLayerLocked / setTool / setSelectedShape / setCurrentLayer / undo / redo

Getters: currentLayer / selectedShape / visibleShapes / canUndo / canRedo

### camStore

| 字段 | 类型 | 说明 |
|------|------|------|
| params | CamParams | CAM 参数集 |
| targetShapeIds | string[] | 刀路目标图形 |
| gcodeOutput | string | 生成的 G-code |

Actions: setParams / setTargetShapes / generateGcode / clearGcode

### CamParams 类型

```ts
type CamParams = {
  feedRate: number         // 进给速度 mm/min
  spindleSpeed: number     // 主轴转速 RPM
  cutDepth: number         // 切割深度 mm
  safeHeight: number       // 安全高度 mm
  stepDown: number         // 步进距离 mm
  cutDirection: 'climb' | 'conventional'
  toolDiameter: number     // 刀具直径 mm
  material: string         // 材料类型
  units: 'mm' | 'inch'
}
```

Store 之间单向依赖：CAM store 读取 CAD store 数据，不反向引用。

## 5. 组件树与布局

### 布局

```
┌─────────────────────────────────────────────────┐
│  菜单栏 (系统原生 Menu)                           │
├──────┬──────────────────────────┬───────────────┤
│ 工具 │       CAD 画布            │  属性/图层    │
│ 栏   │    (CadCanvas.vue)       │  面板         │
│ 48px │                          │  260px        │
├──────┴──────────────────────────┴───────────────┤
│  状态栏                                          │
└─────────────────────────────────────────────────┘
```

### 组件清单

| 组件 | 预估行数 | 职责 |
|------|---------|------|
| Workspace.vue | ~80 | 布局组合，无业务逻辑 |
| ToolBar.vue | ~60 | 工具按钮渲染、切换工具 |
| CadCanvas.vue | ~250 | Konva Stage，调用 composables，键盘事件 |
| PropertyPanel.vue | ~80 | 选中图形 X/Y/宽/高 |
| LayerPanel.vue | ~100 | 图层列表，增删/显隐/锁定 |
| CamPanel.vue | ~200 | CAM 参数表单，生成/导出按钮 |
| StatusBar.vue | ~40 | 鼠标坐标、当前工具、缩放比 |

每个组件在 300 行限制内。

### 组件树

```
App.vue
└── Workspace.vue
    ├── ToolBar.vue
    ├── CadCanvas.vue
    ├── PropertyPanel.vue
    ├── LayerPanel.vue
    ├── CamPanel.vue
    └── StatusBar.vue
```

## 6. CAM & G-code 生成

### useCamParams composable

管理 CAM 参数表单状态、参数校验（负数/零值拦截）。

### useGcodeGen composable

```
输入：选中图形 (ShapeEntity[]) + CamParams
输出：G-code 字符串

生成规则：
  1. 头部：G21/G20(单位), G90(绝对坐标), G0 Z(安全高度), M3 S(转速)
  2. 每个图形：
     矩形 → 计算4个顶点 → 沿外周走一圈 (G1)
     圆   → 近似多段线走轮廓 (G2/G3)
     直线 → 直接沿线走刀
  3. 下刀 → 走轮廓 → 提升
  4. 尾部：M5, M30
```

### 导出流程

```
CamPanel "生成 G-code"
  → camStore.generateGcode()
  → useGcodeGen 读取目标图形 + 参数 → 生成字符串
  → camStore.gcodeOutput 更新
  → 面板显示预览（只读 textarea）
  → 用户点击 "导出"
  → window.electronAPI.file.exportGcode(gcode)
  → Main process 保存对话框 → .nc 文件
```

明确不做：
- 刀具半径补偿 (G41/G42)
- 螺旋下刀
- 多轴刀路
- 仿真预览

## 7. 项目文件格式

### ProjectData JSON

```json
{
  "version": "1.0",
  "shapes": [
    {
      "id": "shape-1",
      "type": "rect",
      "x": 100, "y": 100,
      "width": 200, "height": 150,
      "layerId": "layer-1",
      "visible": true
    }
  ],
  "layers": [
    {
      "id": "layer-1",
      "name": "默认图层",
      "visible": true,
      "locked": false
    }
  ],
  "camParams": {
    "feedRate": 800,
    "spindleSpeed": 12000,
    "cutDepth": 1,
    "safeHeight": 5,
    "stepDown": 0.5,
    "cutDirection": "climb",
    "toolDiameter": 3,
    "material": "wood",
    "units": "mm"
  }
}
```

### 文件操作流程

- 打开：菜单 → Main 弹窗选 .json → IPC 返回字符串 → cadStore.loadProject(JSON.parse)
- 保存：Ctrl+S → 合并 stores → JSON.stringify → IPC → Main 弹窗 → 写文件
- MVP 阶段不加"未保存更改提示"，后续再加

## 8. 错误处理 & 测试策略

### 错误处理

| 边界 | 处理方式 |
|------|---------|
| 文件打开取消 | 静默返回 null |
| 文件读取失败 | toast 提示 |
| JSON 解析失败 | 提示"项目文件格式错误" |
| G-code 导出失败 | 提示"导出失败" |
| 无效 CAM 参数 | 表单校验拦截，禁用按钮 |

内部代码不滥用 try-catch，只在外层（IPC handler、用户操作入口）做错误处理。

### 测试策略

| 层 | 测什么 | 工具 |
|----|-------|------|
| 类型层 | 编译即检查 | TypeScript |
| 逻辑层 | useGcodeGen 生成逻辑、useHistory 撤销栈 | Vitest |
| 组件层 | 工具切换、图形选择、表单校验 | Vitest + @vue/test-utils |
| E2E | 打开/保存/绘制/导出流程 | Playwright |

MVP 测试优先级：useGcodeGen > useHistory > 组件关键交互。

## 9. 开发顺序

1. Electron + Vue 项目初始化（electron-vite 脚手架）
2. CAD 画布（Konva Stage + useCanvas）
3. 绘图工具（useDrawing：直线、矩形、圆）
4. 选择/移动/删除/缩放/平移（useSelection）
5. 撤销/重做（useHistory）
6. 图层系统（LayerPanel + cadStore 图层相关）
7. 属性面板 + 文件保存/打开（PropertyPanel + IPC）
8. CAM 参数面板 + G-code 生成与导出（CamPanel + useGcodeGen）
