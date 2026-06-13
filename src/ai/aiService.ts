// Main thread interface to AI Worker
type AIMessageHandler = (data: any) => void

class AIService {
  private worker: Worker | null = null
  private handlers: Map<string, AIMessageHandler> = new Map()
  private idCounter = 0
  private ready = false

  async init(): Promise<void> {
    if (this.ready) return
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
        this.worker.onmessage = (e) => {
          const { type, id } = e.data
          const handler = this.handlers.get(`${type}_${id}`)
          if (handler) {
            handler(e.data)
            if (type.endsWith('_result') || type === 'error') {
              this.handlers.delete(`${type}_${id}`)
              // Also clean up progress handlers
              this.handlers.delete(`progress_${id}`)
            }
          }
          // Global handlers
          const globalHandler = this.handlers.get(type)
          if (globalHandler) globalHandler(e.data)
        }
        this.worker.onerror = (err) => {
          console.error('AI Worker error:', err)
          reject(err)
        }
        this.ready = true
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  private send(type: string, data: Record<string, any> = {}): number {
    const id = ++this.idCounter
    this.worker?.postMessage({ type, id, ...data })
    return id
  }

  // OCR: image data URL → text
  async ocr(imageData: string, onProgress?: (msg: string, pct: number) => void): Promise<string> {
    await this.init()
    const id = this.send('ocr', { imageData })
    return new Promise((resolve, reject) => {
      this.handlers.set(`ocr_result_${id}`, (data) => resolve(data.text))
      this.handlers.set(`error_${id}`, (data) => reject(new Error(data.message)))
      if (onProgress) {
        this.handlers.set(`progress_${id}`, (data) => onProgress(data.message, data.percent))
      }
    })
  }

  // Health analysis
  async analyzeHealth(
    visits: any[],
    indicators: any[],
    profile: any,
    onProgress?: (msg: string, pct: number) => void,
  ): Promise<string> {
    await this.init()
    const id = this.send('analyze', { visits, indicators, profile })
    return new Promise((resolve, reject) => {
      this.handlers.set(`analysis_result_${id}`, (data) => resolve(data.text))
      this.handlers.set(`error_${id}`, (data) => reject(new Error(data.message)))
      if (onProgress) {
        this.handlers.set(`progress_${id}`, (data) => onProgress(data.message, data.percent))
      }
    })
  }

  // Drug advice
  async getDrugAdvice(diagnosis: string, medication: string): Promise<string[]> {
    await this.init()
    const id = this.send('drug_advice', { diagnosis, medication })
    return new Promise((resolve, reject) => {
      this.handlers.set(`drug_advice_result_${id}`, (data) => resolve(data.advice))
      this.handlers.set(`error_${id}`, (data) => reject(new Error(data.message)))
    })
  }

  // Check if AI is available
  isSupported(): boolean {
    try {
      return typeof Worker !== 'undefined'
    } catch {
      return false
    }
  }

  destroy() {
    this.worker?.terminate()
    this.worker = null
    this.ready = false
    this.handlers.clear()
  }
}

export const aiService = new AIService()
