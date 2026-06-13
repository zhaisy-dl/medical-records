import { useRef, useState } from 'react'
import { generateThumbnail, fileToDataUrl } from '@/services/imageService'

interface CaptureResult {
  dataUrl: string
  thumbnail: string
  fileName: string
  fileSize: number
  mimeType: string
}

export function useCamera() {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFile = (opts?: { capture?: 'environment' | 'user' }): Promise<CaptureResult | null> => {
    return new Promise(resolve => {
      setError(null)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      if (opts?.capture) {
        input.setAttribute('capture', opts.capture)
      }

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) { resolve(null); return }

        setCapturing(true)
        try {
          // Store original as base64 (full quality), not compressed
          const originalDataUrl = await fileToDataUrl(file)
          const thumbnail = await generateThumbnail(file)
          setCapturing(false)
          resolve({
            dataUrl: originalDataUrl,
            thumbnail,
            fileName: file.name || `IMG_${Date.now()}.jpg`,
            fileSize: file.size,
            mimeType: file.type || 'image/jpeg',
          })
        } catch (e) {
          setCapturing(false)
          setError(String(e))
          resolve(null)
        }
      }

      input.oncancel = () => resolve(null)
      // MUST append to body for iOS Safari to fire events
      input.style.display = 'none'
      document.body.appendChild(input)
      input.click()
      setTimeout(() => { document.body.removeChild(input) }, 5000)
    })
  }

  const openCamera = (): Promise<CaptureResult | null> => {
    return pickFile({ capture: 'environment' })
  }

  const openGallery = (): Promise<CaptureResult | null> => {
    return pickFile()
  }

  return { capturing, error, openCamera, openGallery }
}
