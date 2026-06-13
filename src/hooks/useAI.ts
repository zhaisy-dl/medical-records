// Hook for using AI features in React components
import { useState, useCallback, useRef } from 'react'
import { aiService } from '@/ai/aiService'
import { recognizeImage, extractMedicalFields } from '@/ai/ocrService'
import type { Visit, Indicator } from '@/db/schema'

interface AIState {
  loading: boolean
  progress: string
  progressPct: number
  error: string | null
  supported: boolean
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    loading: false,
    progress: '',
    progressPct: 0,
    error: null,
    supported: aiService.isSupported(),
  })
  const stateRef = useRef(state)
  stateRef.current = state

  const updateState = useCallback((partial: Partial<AIState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  // OCR report image
  const ocrReport = useCallback(async (imageData: string): Promise<Record<string, string>> => {
    updateState({ loading: true, progress: '正在识别...', progressPct: 0, error: null })

    try {
      const text = await recognizeImage(imageData, (msg, pct) => {
        updateState({ progress: msg, progressPct: pct })
      })

      const fields = extractMedicalFields(text)

      // If OCR found no structured fields, return raw text as diagnosis
      if (Object.keys(fields).length === 0 && text.trim()) {
        fields.diagnosis = text.trim().substring(0, 200)
      }

      updateState({ loading: false, progress: '识别完成', progressPct: 100 })
      return fields
    } catch (e: any) {
      updateState({ loading: false, error: e.message || 'OCR识别失败' })
      return {}
    }
  }, [updateState])

  // Health analysis
  const analyzeHealth = useCallback(async (
    visits: Visit[],
    indicators: Indicator[],
    profile: Record<string, string>,
  ): Promise<string> => {
    updateState({ loading: true, progress: '正在加载AI模型...', progressPct: 0, error: null })

    try {
      const result = await aiService.analyzeHealth(visits, indicators, profile, (msg, pct) => {
        updateState({ progress: msg, progressPct: pct })
      })
      updateState({ loading: false, progress: '', progressPct: 100 })
      return result
    } catch (e: any) {
      updateState({ loading: false, error: e.message || '分析失败' })
      return ''
    }
  }, [updateState])

  // Drug advice
  const getDrugAdvice = useCallback(async (diagnosis: string, medication: string): Promise<string[]> => {
    updateState({ loading: true, progress: '正在查询...', progressPct: 0, error: null })
    try {
      const advice = await aiService.getDrugAdvice(diagnosis, medication)
      updateState({ loading: false, progress: '', progressPct: 100 })
      return advice
    } catch (e: any) {
      updateState({ loading: false, error: e.message || '查询失败' })
      return []
    }
  }, [updateState])

  const resetAI = useCallback(() => {
    updateState({ loading: false, progress: '', progressPct: 0, error: null })
  }, [updateState])

  return {
    ...state,
    ocrReport,
    analyzeHealth,
    getDrugAdvice,
    resetAI,
  }
}
