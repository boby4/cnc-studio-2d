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
