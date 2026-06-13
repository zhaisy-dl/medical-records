// Web Worker for AI inference — runs off the main thread to keep UI responsive
import { pipeline, env } from '@xenova/transformers'

// Configure transformers.js
env.allowLocalModels = false
env.backends.onnx.wasm.numThreads = 1 // Mobile-friendly

// Message types
type WorkerMessage =
  | { type: 'ocr'; id: number; imageData: string }
  | { type: 'analyze'; id: number; visits: any[]; indicators: any[]; profile: any }
  | { type: 'drug_advice'; id: number; diagnosis: string; medication: string }

// OCR pipeline
let ocrPipeline: any = null
async function getOCRPipeline() {
  if (!ocrPipeline) {
    self.postMessage({ type: 'progress', id: -1, message: '正在加载OCR模型...', percent: 0 })
    ocrPipeline = await pipeline('image-to-text', 'Xenova/trocr-base-handwritten', {
      quantized: true,
    })
    self.postMessage({ type: 'progress', id: -1, message: 'OCR模型加载完成', percent: 100 })
  }
  return ocrPipeline
}

// Text generation pipeline for health analysis
let analysisPipeline: any = null
async function getAnalysisPipeline() {
  if (!analysisPipeline) {
    self.postMessage({ type: 'progress', id: -1, message: '正在加载AI分析模型...', percent: 10 })
    analysisPipeline = await pipeline('text-generation', 'Xenova/Qwen2.5-0.5B-Instruct', {
      quantized: true,
    })
    self.postMessage({ type: 'progress', id: -1, message: 'AI模型加载完成', percent: 100 })
  }
  return analysisPipeline
}

// Run OCR on image
async function runOCR(id: number, imageData: string) {
  try {
    const p = await getOCRPipeline()
    const result = await p(imageData)
    self.postMessage({ type: 'ocr_result', id, text: result[0]?.generated_text || '' })
  } catch (e: any) {
    self.postMessage({ type: 'error', id, message: e.message || 'OCR失败' })
  }
}

// Run health analysis
async function runAnalysis(id: number, visits: any[], indicators: any[], profile: any) {
  try {
    self.postMessage({ type: 'progress', id, message: '正在分析您的健康数据...', percent: 30 })

    // Build context from user data
    const visitSummary = visits.slice(0, 10).map((v: any) =>
      `${v.visitDate || ''}: ${v.hospitalName || ''} ${v.department || ''} - 诊断:${v.diagnosis || '无'}`
    ).join('\n')

    const indicatorSummary = indicators.slice(0, 20).map((i: any) =>
      `${i.name}: ${i.value} ${i.unit} (参考:${i.referenceMin || '?'}-${i.referenceMax || '?'}) [${i.testDate || ''}]`
    ).join('\n')

    const prompt = `你是一位专业的健康管理顾问。根据以下用户的健康数据，请给出简洁的健康分析和建议（200字以内）。

个人信息：${profile.medicalHistory || '未知'} 过敏史：${profile.allergies || '未知'}
近期就诊：
${visitSummary || '无记录'}
检查指标：
${indicatorSummary || '无记录'}

请分析：1.整体健康状况 2.需要注意的指标 3.建议。回复请用中文：`

    const p = await getAnalysisPipeline()
    self.postMessage({ type: 'progress', id, message: '正在生成分析报告...', percent: 60 })

    const result = await p(prompt, {
      max_new_tokens: 300,
      temperature: 0.7,
      do_sample: true,
    })

    const text = result[0]?.generated_text || ''
    // Remove the prompt from response
    const analysis = text.substring(text.lastIndexOf('回复请用中文：') + 8).trim()

    self.postMessage({ type: 'analysis_result', id, text: analysis || text })
  } catch (e: any) {
    self.postMessage({ type: 'error', id, message: e.message || '分析失败' })
  }
}

// Drug advice using local knowledge base (no model needed for basic checks)
async function runDrugAdvice(id: number, diagnosis: string, medication: string) {
  try {
    // Local knowledge base for common drug interactions
    const knowledgeBase: Record<string, string[]> = {
      '阿司匹林': ['避免与布洛芬同服', '胃溃疡患者慎用', '服用期间避免饮酒'],
      '华法林': ['定期检查INR值', '避免大量摄入维生素K食物（如菠菜）', '避免与阿司匹林同服'],
      '二甲双胍': ['肾功能不全者慎用', '造影检查前需停药', '可能引起胃肠道不适'],
      '他汀类': ['定期检查肝功能', '避免与葡萄柚同食', '可能引起肌肉酸痛'],
      '硝苯地平': ['避免与葡萄柚同食', '可能引起下肢水肿', '停药需逐步减量'],
      '氯吡格雷': ['避免与奥美拉唑同服', '出血风险增加', '手术前需停药'],
      '胰岛素': ['注意低血糖风险', '注射部位需轮换', '保存需冷藏'],
    }

    let advice: string[] = []

    // Check medication knowledge base
    for (const [drug, tips] of Object.entries(knowledgeBase)) {
      if (medication.includes(drug)) {
        advice.push(...tips.map(t => `【${drug}】${t}`))
      }
    }

    // Generic advice based on diagnosis keywords
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

    self.postMessage({
      type: 'drug_advice_result',
      id,
      advice: advice,
    })
  } catch (e: any) {
    self.postMessage({ type: 'error', id, message: e.message || '查询失败' })
  }
}

// Main message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data
  switch (msg.type) {
    case 'ocr':
      runOCR(msg.id, msg.imageData)
      break
    case 'analyze':
      runAnalysis(msg.id, msg.visits, msg.indicators, msg.profile)
      break
    case 'drug_advice':
      runDrugAdvice(msg.id, msg.diagnosis, msg.medication)
      break
  }
}
