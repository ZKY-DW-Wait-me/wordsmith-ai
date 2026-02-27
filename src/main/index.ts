import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, rm, rename, readdir } from 'node:fs/promises'
import extract from 'extract-zip'
import { CpuOcrProvider, type OcrResult, type OcrEngineStatus } from './ocr-provider'
import { VlmProvider, type VlmOcrConfig } from './vlm-provider'

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

// Models fetch IPC — 在主进程发起 HTTP 请求，绕过渲染进程 CORS 限制
ipcMain.handle('models:fetch', async (_event, url: string, apiKey: string): Promise<{ ok: boolean; status?: number; body?: string; error?: string }> => {
  try {
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    })
    const body = await response.text()
    console.log(`[Models] GET ${url} → ${response.status} (${body.length} bytes)`)
    return { ok: response.ok, status: response.status, body }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Models] GET ${url} FAILED: ${msg}`)
    return { ok: false, error: msg }
  }
})

// OCR IPC
const ocrProvider = new CpuOcrProvider()
const vlmProvider = new VlmProvider()

ipcMain.handle('ocr:recognize', async (_event, imagePath: string, vlmConfig?: VlmOcrConfig | null): Promise<OcrResult> => {
  try {
    if (!imagePath || typeof imagePath !== 'string') {
      return { success: false, markdown: '', error: 'Invalid image path.' }
    }
    // VLM 优先：配置有效时使用 VLM API
    if (vlmConfig && vlmConfig.apiKey && vlmConfig.baseUrl && vlmConfig.model) {
      return await vlmProvider.recognize(imagePath, vlmConfig)
    }
    // 兜底：使用本地 OCR 引擎
    return await ocrProvider.recognize(imagePath)
  } catch (err) {
    return { success: false, markdown: '', error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('ocr:setEnginePath', async (_event, enginePath: string | null): Promise<void> => {
  ocrProvider.setEnginePath(enginePath)
})

ipcMain.handle('ocr:getEngineStatus', async (): Promise<OcrEngineStatus> => {
  return ocrProvider.getEngineStatus()
})

ipcMain.handle('ocr:selectZipFile', async (): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    title: '选择 OCR 引擎压缩包',
    filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('ocr:importEngineZip', async (_event, zipPath: string): Promise<{ success: boolean; enginePath?: string; error?: string }> => {
  // OCR 引擎存放在安装目录下，而不是 C 盘 AppData
  const appDir = VITE_DEV_SERVER_URL
    ? process.env.APP_ROOT               // 开发模式：项目根目录
    : path.dirname(app.getPath('exe'))    // 生产模式：exe 所在目录
  const tempDir = path.join(appDir, 'ocr_engine_temp')
  const finalDir = path.join(appDir, 'ocr_engine')

  try {
    // 1. Clean up any previous temp directory
    await rm(tempDir, { recursive: true, force: true })

    // 2. Create temp directory
    await mkdir(tempDir, { recursive: true })

    // 3. Extract zip to temp
    await extract(zipPath, { dir: tempDir })

    // 4. Resolve the actual engine root (find python/ + paddlex_home/)
    const engineRoot = await resolveEngineRoot(tempDir)
    if (!engineRoot) {
      await rm(tempDir, { recursive: true, force: true })
      return { success: false, error: '压缩包结构不正确：未找到 OCR 引擎文件。请确认压缩包包含 python/、site-packages/ 和 paddlex_home/ 目录。' }
    }

    // 5. Validate models
    const missing = await CpuOcrProvider.validateEngineDir(engineRoot)
    if (missing.length > 0) {
      await rm(tempDir, { recursive: true, force: true })
      return { success: false, error: `模型文件不完整，缺少以下模型：${missing.join(', ')}` }
    }

    // 6. Remove old engine
    await rm(finalDir, { recursive: true, force: true })

    // 7. Move resolved engine root to final location
    await rename(engineRoot, finalDir)

    // 8. Ensure func_ret directory exists (paddlex needs it)
    await mkdir(path.join(finalDir, 'paddlex_home', 'func_ret'), { recursive: true })

    // 9. Clean up temp
    await rm(tempDir, { recursive: true, force: true })

    // 10. Update provider
    ocrProvider.setEnginePath(finalDir)

    return { success: true, enginePath: finalDir }
  } catch (err) {
    // Clean up temp on any failure
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `导入失败：${message}` }
  }
})

/**
 * Find the OCR engine root within the extracted temp dir.
 * The engine root is a directory containing python/, site-packages/, and paddlex_home/.
 * Tries:
 *   - temp/ directly (ocr_engine contents at top level)
 *   - temp/ocr_engine/
 *   - temp/<single-wrapper>/ (any single subdirectory)
 */
async function resolveEngineRoot(tempDir: string): Promise<string | null> {
  // Check if a directory is a valid engine root
  if (await CpuOcrProvider.hasRuntime(tempDir)) return tempDir

  // Try temp/ocr_engine/
  const ocrEngineSub = path.join(tempDir, 'ocr_engine')
  if (await CpuOcrProvider.hasRuntime(ocrEngineSub)) return ocrEngineSub

  // Try single-level wrapper
  try {
    const entries = await readdir(tempDir, { withFileTypes: true })
    const dirs = entries.filter(e => e.isDirectory())
    if (dirs.length === 1) {
      const wrapperDir = path.join(tempDir, dirs[0].name)
      if (await CpuOcrProvider.hasRuntime(wrapperDir)) return wrapperDir
    }
  } catch {
    // ignore readdir errors
  }

  return null
}

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
    icon: path.join(process.env.APP_ROOT, 'build', 'icon.ico'),
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
