// Web Worker stub — real AI model loading is heavy for mobile.
// Health analysis and drug advice are handled in the main thread via useAI.ts.
// OCR goes through tesseract.js which runs in its own worker.

self.onmessage = (_e: MessageEvent) => {
  self.postMessage({ type: 'error', id: -1, message: 'AI Worker not used — analysis runs locally' })
}
