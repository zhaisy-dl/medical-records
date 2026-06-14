// Hook for using AI features in React components
import { useState, useCallback } from 'react'
import { recognizeImage, extractMedicalFields } from '@/ai/ocrService'
import type { Visit, Indicator } from '@/db/schema'

interface AIState {
  loading: boolean
  progress: string
  progressPct: number
  error: string | null
  supported: boolean
}

// Drug knowledge base
const drugKB: Record<string, string[]> = {
  '阿司匹林': ['避免与布洛芬同服', '胃溃疡患者慎用', '服用期间避免饮酒'],
  '华法林': ['定期检查INR值', '避免大量摄入维生素K食物（如菠菜）', '避免与阿司匹林同服'],
  '二甲双胍': ['肾功能不全者慎用', '造影检查前需停药', '可能引起胃肠道不适'],
  '他汀类': ['定期检查肝功能', '避免与葡萄柚同食', '可能引起肌肉酸痛'],
  '硝苯地平': ['避免与葡萄柚同食', '可能引起下肢水肿', '停药需逐步减量'],
  '氯吡格雷': ['避免与奥美拉唑同服', '出血风险增加', '手术前需停药'],
  '胰岛素': ['注意低血糖风险', '注射部位需轮换', '保存需冷藏'],
}

// Simple health analysis function (no model download needed)
function localHealthAnalysis(visits: Visit[], indicators: Indicator[], profile: Record<string, string>): string {
  const parts: string[] = []

  // Summary stats
  const totalVisits = visits.length
  const recentVisits = visits.slice(0, 5)
  const abnormalIndicators = indicators.filter(i => i.isAbnormal)
  const hospitals = new Set(visits.map(v => v.hospitalName))
  const departments = new Set(visits.map(v => v.department))

  parts.push(`📊 总体情况：共记录 ${totalVisits} 次就诊，覆盖 ${hospitals.size} 家医院、${departments.size} 个科室`)

  // Profile analysis
  if (profile.height && profile.weight) {
    const h = Number(profile.height) / 100
    const w = Number(profile.weight)
    const bmi = w / (h * h)
    parts.push(`\n📏 BMI: ${bmi.toFixed(1)}（${bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖'}）`)
  }
  if (profile.medicalHistory) {
    parts.push(`\n🏥 基础疾病: ${profile.medicalHistory}`)
  }

  // Diagnosis trends
  const diagnoses = visits.filter(v => v.diagnosis).map(v => v.diagnosis)
  if (diagnoses.length > 0) {
    parts.push(`\n🩺 主要诊断:`)
    diagnoses.slice(0, 5).forEach((d, i) => {
      parts.push(`  ${i + 1}. ${d}`)
    })
  }

  // Abnormal indicators alert
  if (abnormalIndicators.length > 0) {
    parts.push(`\n⚠️ 异常指标提醒 (共${abnormalIndicators.length}项):`)
    const latest = abnormalIndicators.slice(-5)
    latest.forEach(ind => {
      const arrow = ind.value > (ind.referenceMax || 0) ? '↑偏高' : '↓偏低'
      parts.push(`  · ${ind.name}: ${ind.value} ${ind.unit} ${arrow}（参考: ${ind.referenceMin || '?'}-${ind.referenceMax || '?'}）`)
    })
  }

  // Recommendations
  parts.push(`\n💡 建议:`)
  if (totalVisits === 0) {
    parts.push(`  · 开始记录您的就诊信息和检查指标`)
  } else {
    if (abnormalIndicators.length > 0) {
      parts.push(`  · 关注异常指标变化趋势，建议定期复查`)
    }
    if (profile.medicalHistory?.includes('高血压') || profile.medicalHistory?.includes('血压')) {
      parts.push(`  · 坚持低盐饮食，每日监测血压`)
    }
    if (profile.medicalHistory?.includes('糖尿病') || profile.medicalHistory?.includes('血糖')) {
      parts.push(`  · 控制碳水化合物摄入，定期监测血糖`)
    }
    if (profile.medicalHistory?.includes('冠心病') || profile.medicalHistory?.includes('心梗') || profile.medicalHistory?.includes('支架')) {
      parts.push(`  · 坚持服用抗血小板药物，避免漏服`)
      parts.push(`  · 定期复查心电图和心脏超声`)
    }
    parts.push(`  · 保持规律作息，适度运动`)
    parts.push(`  · 建议每年进行一次全面体检`)
  }

  return parts.join('\n')
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    loading: false,
    progress: '',
    progressPct: 0,
    error: null,
    supported: true, // Always supported — no Web Worker needed
  })

  const updateState = useCallback((partial: Partial<AIState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  // OCR report image
  const ocrReport = useCallback(async (imageData: string): Promise<Record<string, string>> => {
    updateState({ loading: true, progress: '正在加载OCR引擎...', progressPct: 0, error: null })

    try {
      const text = await recognizeImage(imageData, (msg, pct) => {
        updateState({ progress: msg, progressPct: pct })
      })

      const fields = extractMedicalFields(text)
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

  // Health analysis — local computation, no model download
  const analyzeHealth = useCallback(async (
    visits: Visit[],
    indicators: Indicator[],
    profile: Record<string, string>,
  ): Promise<string> => {
    updateState({ loading: true, progress: '正在分析健康数据...', progressPct: 30, error: null })

    try {
      // Simulate async work with small delay for UX
      await new Promise(r => setTimeout(r, 500))
      updateState({ progress: '正在生成分析报告...', progressPct: 70 })

      const analysis = localHealthAnalysis(visits, indicators, profile)

      await new Promise(r => setTimeout(r, 300))
      updateState({ loading: false, progress: '', progressPct: 100 })

      return analysis
    } catch (e: any) {
      updateState({ loading: false, error: e.message || '分析失败' })
      return ''
    }
  }, [updateState])

  // Drug advice using local knowledge base
  const getDrugAdvice = useCallback(async (diagnosis: string, medication: string): Promise<string[]> => {
    updateState({ loading: true, progress: '正在查询用药知识库...', progressPct: 50, error: null })

    try {
      await new Promise(r => setTimeout(r, 300))

      let advice: string[] = []

      // Check medication knowledge base
      for (const [drug, tips] of Object.entries(drugKB)) {
        if (medication.includes(drug)) {
          advice.push(...tips.map(t => `【${drug}】${t}`))
        }
      }

      // Generic advice based on diagnosis
      if (diagnosis.includes('高血压') || diagnosis.includes('血压')) {
        advice.push('【通用】低盐饮食，每日盐摄入<6g')
        advice.push('【通用】定期监测血压，早晚各一次')
      }
      if (diagnosis.includes('糖尿病') || diagnosis.includes('血糖')) {
        advice.push('【通用】控制碳水化合物摄入')
        advice.push('【通用】定期监测血糖，记录饮食')
      }
      if (diagnosis.includes('冠心病') || diagnosis.includes('心梗') || diagnosis.includes('支架')) {
        advice.push('【通用】坚持服用抗血小板药物')
        advice.push('【通用】避免剧烈运动和情绪激动')
        advice.push('【通用】定期复查心电图和心脏超声')
      }

      if (advice.length === 0) {
        advice.push('暂无特定禁忌提醒，请遵医嘱用药')
      }

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
