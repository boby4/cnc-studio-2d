import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    save: (data: unknown) => ipcRenderer.invoke('file:save', data),
    exportGcode: (gcode: string) => ipcRenderer.invoke('file:export-gcode', gcode),
  }
})
