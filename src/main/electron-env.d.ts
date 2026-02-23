/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`

interface OcrEngineStatus {
  installed: boolean
  enginePath: string | null
  missingModels: string[]
}

interface Window {
  wordsmith?: {
    clipboard: {
      write: (payload: { html: string; text: string }) => Promise<void>
    }
    ocr: {
      recognize: (imagePath: string) => Promise<{
        success: boolean
        markdown: string
        error?: string
      }>
      setEnginePath: (enginePath: string | null) => Promise<void>
      getEngineStatus: () => Promise<OcrEngineStatus>
      selectZipFile: () => Promise<string | null>
      importEngineZip: (zipFilePath: string) => Promise<{
        success: boolean
        enginePath?: string
        error?: string
      }>
    }
    window: {
      minimize: () => void
      maximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
    }
  }
}
