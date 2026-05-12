# CNC Studio 2D - AI 开发边界 Skill 文件

## 目标

该 Skill 文件用于：

```txt
限制 AI 开发范围
减少无意义代码生成
减少 token 消耗
提高生成稳定性
避免项目跑偏
```

---

# 核心原则

AI 必须：

```txt
先保证 MVP 可运行
再逐步增加功能
```

禁止：

```txt
一次性生成完整工业 CAD/CAM
```

---

# 当前阶段范围

当前项目：

```txt
仅实现 2D CAD MVP
```

当前只允许：

```txt
绘图
编辑
图层
基础 CAM
G-code 导出
```

---

# 明确禁止开发内容

以下功能禁止生成：

```txt
3D 建模
Three.js 复杂场景
OpenGL Native
WebGPU
真实 CNC 控制
PLC
运动控制卡
高级 DXF 解析
STEP 文件
工业通信协议
复杂仿真
插件市场
用户系统
登录系统
支付系统
云同步
微服务
Redis
Docker 集群
复杂权限
```

---

# 技术边界

## 必须使用

```txt
Vue3
Vite
TypeScript
Electron
Pinia
Konva.js
TailwindCSS
```

---

# 禁止使用

```txt
React
Angular
Vue2
Vuex
Webpack
jQuery
Options API
```

---

# Electron 边界

## Renderer 禁止

```txt
直接使用 fs
直接使用 path
直接使用 node 原生模块
```

必须：

```txt
通过 preload + IPC
```

---

# 状态管理规则

## 必须

```txt
按模块拆 store
```

例如：

```txt
cad.store.ts
cam.store.ts
machine.store.ts
```

---

# 组件规则

## 单组件限制

```txt
不超过 300 行
```

超过必须拆分。

---

# Composition API 规则

必须：

```vue
<script setup lang="ts">
```

禁止：

```txt
export default {}
```

---

# Canvas 规则

当前阶段：

```txt
只允许使用 Konva.js
```

禁止：

```txt
自研 WebGL 引擎
PixiJS 重构
WebGPU
```

---

# G-code 边界

当前阶段：

```txt
只生成简单二维轮廓
```

禁止：

```txt
多轴
刀具库
复杂补偿
高级 CAM
工业后处理器
```

---

# AI 输出规则

## AI 输出代码时：

必须：

```txt
完整文件
完整 import
完整类型
```

禁止：

```txt
伪代码
省略代码
“这里自行实现”
```

---

# 开发顺序（必须遵守）

## 第一步

```txt
Electron + Vue 项目初始化
```

## 第二步

```txt
CAD 画布
```

## 第三步

```txt
绘图工具
```

## 第四步

```txt
选择/移动/缩放
```

## 第五步

```txt
图层系统
```

## 第六步

```txt
项目保存
```

## 第七步

```txt
CAM 参数
```

## 第八步

```txt
G-code 导出
```

---

# Token 节省规则

AI 必须：

```txt
优先修改现有文件
不要重复生成整个项目
```

---

# Debug 规则

发生错误时：

必须：

```txt
先定位问题
最小范围修复
```

禁止：

```txt
大规模重构
随意升级依赖
替换整个架构
```

---

# UI 规则

当前阶段：

```txt
优先功能
其次美观
```

禁止：

```txt
复杂动画
大型视觉特效
过度 UI 设计
```

---

# 性能规则

必须：

```txt
节流鼠标事件
避免频繁响应式深监听
图形数据与 UI 分离
```

---

# 文件系统规则

项目文件：

```txt
统一 JSON 存储
```

当前禁止：

```txt
SQLite
IndexedDB
云数据库
```

---

# AI 工作模式

AI 必须：

```txt
每次只完成一个明确功能
```

例如：

```txt
只完成图层系统
只完成选择工具
只完成 G-code 导出
```

禁止：

```txt
一次生成多个大型系统
```

---

# 当前最终目标

当前版本目标：

```txt
做一个稳定、可运行、结构清晰的 2D CAD MVP
```

不是：

```txt
工业级完整版 CAD/CAM
```
