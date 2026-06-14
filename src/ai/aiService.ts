// Main thread AI interface — simple stub since analysis is local
// Health analysis and drug advice are handled in useAI.ts
// OCR is handled via tesseract.js workers in ocrService.ts

class AIService {
  isSupported(): boolean { return true }
  destroy() {}
}

export const aiService = new AIService()
