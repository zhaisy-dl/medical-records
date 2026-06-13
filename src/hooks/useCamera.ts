import { useRef, useState } from 'react'
import { compressImage, generateThumbnail } from '@/services/imageService'

interface CaptureResult {
  dataUrl: string
  thumbnail: string
  fileName: string
  fileSize: number
  mimeType: string
}

export function useCamera() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCamera = (): Promise<CaptureResult | null> => {
    return new Promise(resolve => {
      setError(null)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        setCapturing(true)
        try {
          const { dataUrl, compressedFile } = await compressImage(file)
          const thumbnail = await generateThumbnail(file)
          setCapturing(false)
          resolve({
            dataUrl,
            thumbnail,
            fileName: file.name || `IMG_${Date.now()}.jpg`,
            fileSize: compressedFile.size,
            mimeType: 'image/jpeg',
          })
        } catch (e) {
          setCapturing(false)
          setError(String(e))
          resolve(null)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  }

  const openGallery = (): Promise<CaptureResult | null> => {
    return new Promise(resolve => {
      setError(null)
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        setCapturing(true)
        try {
          const { dataUrl, compressedFile } = await compressImage(file)
          const thumbnail = await generateThumbnail(file)
          setCapturing(false)
          resolve({
            dataUrl,
            thumbnail,
            fileName: file.name || `IMG_${Date.now()}.jpg`,
            fileSize: compressedFile.size,
            mimeType: 'image/jpeg',
          })
        } catch (e) {
          setCapturing(false)
          setError(String(e))
          resolve(null)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  }

  return { inputRef, capturing, error, openCamera, openGallery }
}
