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
