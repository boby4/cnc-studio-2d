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
