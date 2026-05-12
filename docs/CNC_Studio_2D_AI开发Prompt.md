# CNC Studio 2D - AI 开发 Prompt

## 项目目标

请生成一个基于 Electron + Vue3 + Vite + TypeScript 的高性能 2D CAD/CAM 设计与加工控制平台。

项目名称：

```txt
cnc-studio-2d
```

目标：

```txt
实现一个桌面级 2D CAD/CAM 软件。
支持图形绘制、图层管理、G-code 生成、加工控制。
```

---

# 第一阶段 MVP（只做这些）

必须严格控制范围。

当前阶段只实现：

1. Electron 桌面应用基础框架
2. Vue3 工作区
3. 2D CAD 画布
4. 绘制：
   - 直线
   - 矩形
   - 圆
5. 支持：
   - 选择
   - 拖拽
   - 删除
   - 缩放
6. 图层管理
7. 属性面板
8. 撤销 / 重做
9. 本地 JSON 项目保存
10. 本地 JSON 项目打开
11. 基础 CAM 参数面板
12. 基础 G-code 导出

---

# 技术栈

```txt
Electron
Vue3
Vite
TypeScript
Pinia
Vue Router
TailwindCSS
Konva.js
electron-vite
```

---

# 架构要求

## Electron Main

负责：

```txt
文件系统
IPC
导出文件
系统菜单
窗口管理
```

## Electron Preload

负责：

```txt
安全暴露 API
```

## Vue Renderer

负责：

```txt
UI
CAD 画布
CAM 面板
状态管理
```

---

# 项目目录结构

```bash
cnc-studio-2d
├─ electron
│  ├─ main.ts
│  ├─ preload.ts
│  └─ ipc
├─ src
│  ├─ modules
│  │  ├─ cad
│  │  ├─ cam
│  │  └─ machine
│  ├─ views
│  ├─ stores
│  ├─ router
│  └─ shared
├─ package.json
├─ vite.config.ts
└─ electron.vite.config.ts
```

---

# CAD 功能

## 必须实现

### 绘图

```txt
line
rect
circle
```

### 编辑

```txt
select
move
delete
zoom
pan
```

### 图层

```txt
新增图层
删除图层
隐藏图层
锁定图层
```

---

# CAM 功能

当前只做：

```txt
基础轮廓 G-code 生成
```

不做：

```txt
高级刀路
3D 刀路
多轴加工
仿真
```

---

# G-code 示例

```gcode
G21
G90
G0 Z5
G0 X0 Y0
M3 S12000
G1 Z-1 F300
G1 X100 Y0 F800
G1 X100 Y100
G1 X0 Y100
G1 X0 Y0
G0 Z5
M5
M30
```

---

# UI 要求

布局：

```txt
左侧：工具栏
中间：CAD 画布
右侧：属性/图层面板
底部：状态栏
顶部：菜单栏
```

风格：

```txt
工业风
暗色主题
简洁
专业 CAD 风格
```

---

# 开发要求

## 必须

```txt
模块化
类型完整
Composition API
script setup
Pinia
```

## 禁止

```txt
Options API
大型单文件
全局变量污染
直接在 renderer 使用 fs
```

---

# 输出要求

请输出：

```txt
package.json
vite.config.ts
electron.vite.config.ts
electron/main.ts
electron/preload.ts
src/main.ts
src/App.vue
src/views/Workspace.vue
src/modules/cad/*
src/modules/cam/*
src/stores/*
```

代码必须：

```txt
npm install 可运行
npm run dev 可运行
npm run build 可运行
```

优先保证：

```txt
能跑
结构清晰
低耦合
后续可扩展
```
