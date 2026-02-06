import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('wordsmith', {
  clipboard: {
    write(payload: { html: string; text: string }) {
      return ipcRenderer.invoke('clipboard:write', payload)
    },
  },
})
