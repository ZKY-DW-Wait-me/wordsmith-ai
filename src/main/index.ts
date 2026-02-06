import { app, BrowserWindow, clipboard, ipcMain, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function normalizeDevServerUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'localhost') u.hostname = '127.0.0.1'
    return u.toString()
  } catch {
    return url
  }
}

async function loadUrlWithRetry(win: BrowserWindow, url: string, retries = 20, delay = 1000) {
  let attempt = 0
  while (attempt < retries) {
    try {
      const normalized = normalizeDevServerUrl(url)
      console.log(`[Main] Attempting to load URL: ${normalized} (Attempt ${attempt + 1}/${retries})`)
      await win.loadURL(normalized)
      console.log(`[Main] Successfully loaded URL: ${normalized}`)
      return
    } catch (error) {
      const err = error as Error
      console.error(`[Main] Failed to load URL: ${url}. Error: ${err.message}`)
      attempt++
      if (attempt < retries) {
        console.log(`[Main] Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  console.error(`[Main] Failed to load URL after ${retries} attempts.`)
  // Fallback to local file if remote load fails completely
  try {
    console.log('[Main] Falling back to local file...')
    await win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  } catch (e) {
    console.error('[Main] Failed to fallback to local file.', e)
  }
}

// Clipboard IPC
ipcMain.handle('clipboard:write', async (_event, payload: { html: string; text: string }) => {
  clipboard.write({
    html: payload.html,
    text: payload.text,
  })
})

// Window control IPC handlers
ipcMain.on('window:minimize', () => {
  win?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window:close', () => {
  win?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return win?.isMaximized() ?? false
})

async function createWindow() {
  // Remove the application menu completely
  Menu.setApplicationMenu(null)

  // Platform-specific window configuration
  const isWindows = process.platform === 'win32'

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden', // Hide title bar but keep window controls
    titleBarOverlay: isWindows ? {
      color: '#f4f4f5', // zinc-100
      symbolColor: '#71717a', // zinc-500
      height: 36,
    } : undefined,
    backgroundColor: '#fafafa', // zinc-50 to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Send maximize state changes to renderer
  win.on('maximize', () => {
    win?.webContents.send('window:maximized', true)
  })

  win.on('unmaximize', () => {
    win?.webContents.send('window:maximized', false)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    await loadUrlWithRetry(win, VITE_DEV_SERVER_URL)
  } else {
    await win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

process.on('unhandledRejection', (err) => {
  // Avoid noisy crash in dev if dev server has not started yet
  console.error('[unhandledRejection]', err)
})
