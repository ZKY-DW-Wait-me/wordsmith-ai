import { execFile } from 'node:child_process'
import { accessSync, constants as fsConstants } from 'node:fs'
import { access, constants } from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OcrResult {
  success: boolean
  markdown: string
  error?: string
}

export interface OcrEngineStatus {
  installed: boolean
  enginePath: string | null
  missingModels: string[]
}

export interface OcrProvider {
  readonly name: string
  recognize(imagePath: string, signal?: AbortSignal): Promise<OcrResult>
  checkAvailability(): Promise<string | null>
}

// ---------------------------------------------------------------------------
// Required model directories
// ---------------------------------------------------------------------------

const REQUIRED_MODELS = [
  'PP-DocBlockLayout',
  'PP-DocLayout_plus-L',
  'PP-FormulaNet_plus-L',
  'PP-LCNet_x1_0_table_cls',
  'PP-OCRv5_server_det',
  'PP-OCRv5_server_rec',
  'RT-DETR-L_wired_table_cell_det',
  'RT-DETR-L_wireless_table_cell_det',
  'SLANet_plus',
  'SLANeXt_wired',
]

// ---------------------------------------------------------------------------
// CpuOcrProvider — PPStructure via embedded Python sidecar
// ---------------------------------------------------------------------------

export class CpuOcrProvider implements OcrProvider {
  readonly name = 'cpu-ppstructure'

  /** Root of the OCR engine (contains python/, site-packages/, paddlex_home/, ocr_cli.py) */
  private enginePath: string | null

  constructor() {
    // Dev mode: auto-detect local ocr_engine/
    const devEngine = path.join(app.getAppPath(), 'ocr_engine')
    try {
      accessSync(path.join(devEngine, 'python', 'python.exe'), fsConstants.R_OK)
      accessSync(path.join(devEngine, 'paddlex_home', 'official_models'), fsConstants.R_OK)
      this.enginePath = devEngine
    } catch {
      this.enginePath = null
    }
  }

  /**
   * Set the OCR engine root path. Called on app startup (from persisted settings)
   * and after user imports the engine zip.
   */
  setEnginePath(enginePath: string | null): void {
    this.enginePath = enginePath
  }

  private get pythonPath(): string {
    return path.join(this.enginePath!, 'python', 'python.exe')
  }

  private get scriptPath(): string {
    return path.join(this.enginePath!, 'ocr_cli.py')
  }

  private get sitePackagesPath(): string {
    return path.join(this.enginePath!, 'site-packages')
  }

  private get paddlexHome(): string {
    return path.join(this.enginePath!, 'paddlex_home')
  }

  /**
   * Validate that a directory is a valid OCR engine root.
   * Checks for python/python.exe, site-packages/, ocr_cli.py, and all required models.
   * Returns list of missing model names (empty = fully valid).
   */
  static async validateEngineDir(dir: string): Promise<string[]> {
    const officialModelsDir = path.join(dir, 'paddlex_home', 'official_models')

    const missing: string[] = []
    for (const model of REQUIRED_MODELS) {
      const paramsFile = path.join(officialModelsDir, model, 'inference.pdiparams')
      try {
        await access(paramsFile, constants.R_OK)
      } catch {
        missing.push(model)
      }
    }
    return missing
  }

  /**
   * Check if a directory has the basic OCR engine runtime files.
   */
  static async hasRuntime(dir: string): Promise<boolean> {
    try {
      await access(path.join(dir, 'python', 'python.exe'), constants.R_OK)
      await access(path.join(dir, 'site-packages'), constants.R_OK)
      await access(path.join(dir, 'ocr_cli.py'), constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current OCR engine installation status.
   */
  async getEngineStatus(): Promise<OcrEngineStatus> {
    if (!this.enginePath) {
      return { installed: false, enginePath: null, missingModels: REQUIRED_MODELS }
    }
    const missing = await CpuOcrProvider.validateEngineDir(this.enginePath)
    return {
      installed: missing.length === 0,
      enginePath: this.enginePath,
      missingModels: missing,
    }
  }

  recognize(imagePath: string, signal?: AbortSignal): Promise<OcrResult> {
    return new Promise((resolve) => {
      if (!this.enginePath) {
        resolve({ success: false, markdown: '', error: 'OCR_ENGINE_NOT_INSTALLED' })
        return
      }

      if (signal?.aborted) {
        resolve({ success: false, markdown: '', error: 'Cancelled.' })
        return
      }

      const env = {
        ...process.env,
        PYTHONPATH: this.sitePackagesPath,
        PADDLEX_HOME: this.paddlexHome,
        PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: 'True',
      }

      const child = execFile(
        this.pythonPath,
        [this.scriptPath, imagePath],
        {
          timeout: 120_000,
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
          env,
        },
        (error, stdout) => {
          if (error) {
            if ((error as Error & { killed?: boolean }).killed) {
              const msg = error.message?.includes('TIMEOUT')
                ? 'OCR timed out (120s limit).'
                : 'OCR process was cancelled.'
              resolve({ success: false, markdown: '', error: msg })
              return
            }
            if (stdout) {
              try {
                const parsed = JSON.parse(stdout)
                resolve({
                  success: false,
                  markdown: '',
                  error: parsed.error || 'OCR process error.',
                })
                return
              } catch {
                // fall through
              }
            }
            resolve({
              success: false,
              markdown: '',
              error: `OCR process error: ${error.message}`,
            })
            return
          }

          try {
            const parsed = JSON.parse(stdout)
            resolve({
              success: !!parsed.success,
              markdown: parsed.markdown ?? '',
              error: parsed.error,
            })
          } catch {
            resolve({
              success: false,
              markdown: '',
              error: 'Failed to parse OCR output.',
            })
          }
        },
      )

      if (signal) {
        const onAbort = () => {
          child.kill()
        }
        signal.addEventListener('abort', onAbort, { once: true })
        child.on('exit', () => {
          signal.removeEventListener('abort', onAbort)
        })
      }
    })
  }

  async checkAvailability(): Promise<string | null> {
    if (!this.enginePath) {
      return 'OCR engine not installed.'
    }

    try {
      await access(this.pythonPath, constants.X_OK)
    } catch {
      return `Embedded Python not found at: ${this.pythonPath}`
    }

    try {
      await access(this.sitePackagesPath, constants.R_OK)
    } catch {
      return `Site-packages not found at: ${this.sitePackagesPath}`
    }

    return null
  }
}
