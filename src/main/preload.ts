import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('wordsmith', {
  clipboard: {
    write(payload: { html: string; text: string }) {
      return ipcRenderer.invoke('clipboard:write', payload)
    },
  },
  ocr: {
    recognize(imagePath: string) {
      return ipcRenderer.invoke('ocr:recognize', imagePath)
    },
    setEnginePath(enginePath: string | null) {
      return ipcRenderer.invoke('ocr:setEnginePath', enginePath)
    },
    getEngineStatus() {
      return ipcRenderer.invoke('ocr:getEngineStatus')
    },
    selectZipFile() {
      return ipcRenderer.invoke('ocr:selectZipFile')
    },
    importEngineZip(zipFilePath: string) {
      return ipcRenderer.invoke('ocr:importEngineZip', zipFilePath)
    },
  },
  window: {
    minimize() {
      ipcRenderer.send('window:minimize')
    },
    maximize() {
      ipcRenderer.send('window:maximize')
    },
    close() {
      ipcRenderer.send('window:close')
    },
    isMaximized() {
      return ipcRenderer.invoke('window:isMaximized')
    },
    onMaximizedChange(callback: (isMaximized: boolean) => void) {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on('window:maximized', handler)
      return () => ipcRenderer.removeListener('window:maximized', handler)
    },
  },
})
