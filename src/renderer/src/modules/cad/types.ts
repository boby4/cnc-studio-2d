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
