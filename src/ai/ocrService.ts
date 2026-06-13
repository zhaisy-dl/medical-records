// OCR service — Tesseract.js with Chinese language support
import { createWorker } from 'tesseract.js'

let worker: any = null
let initPromise: Promise<any> | null = null

export async function initOCR(onProgress?: (msg: string, pct: number) => void): Promise<any> {
  if (worker) return worker
  if (initPromise) return initPromise

  initPromise = (async () => {
    onProgress?.('正在加载OCR引擎...', 10)
    worker = await createWorker('chi_sim', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          onProgress?.(`识别中... ${Math.round(m.progress * 100)}%`, 10 + m.progress * 80)
        } else if (m.status === 'loading tesseract core') {
          onProgress?.('加载OCR核心...', Math.round(m.progress * 10))
        } else if (m.status === 'loading language traineddata') {
          onProgress?.('加载中文语言包...', Math.round(m.progress * 10))
        }
      },
    })
    onProgress?.('OCR引擎就绪', 100)
    return worker
  })()

  return initPromise
}

export async function recognizeImage(
  imageData: string,
  onProgress?: (msg: string, pct: number) => void,
): Promise<string> {
  const w = await initOCR(onProgress)
  const result = await w.recognize(imageData)
  return result.data.text
}

// Extract medical fields from OCR text
export function extractMedicalFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}

  // Common patterns in Chinese medical reports
  const patterns: Record<string, RegExp[]> = {
    hospitalName: [
      /(?:医院[：:]\s*)([^\n]+)/,
      /([^\s]+医院)/,
    ],
    date: [
      /(?:日期[：:]\s*)(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/,
      /(\d{4}-\d{2}-\d{2})/,
    ],
    diagnosis: [
      /(?:诊断[：:]\s*)([^\n]+)/,
      /(?:临床诊断[：:]\s*)([^\n]+)/,
    ],
    doctorName: [
      /(?:医生[：:]\s*)([^\n]+)/,
      /(?:医师[：:]\s*)([^\n]+)/,
    ],
  }

  for (const [field, regexps] of Object.entries(patterns)) {
    for (const regex of regexps) {
      const match = text.match(regex)
      if (match) {
        fields[field] = match[1].trim()
        break
      }
    }
  }

  return fields
}

export function destroyOCR() {
  if (worker) {
    worker.terminate()
    worker = null
    initPromise = null
  }
}
