import imageCompression from 'browser-image-compression'

export async function compressImage(file: File, maxSizeKB = 300): Promise<{ dataUrl: string; compressedFile: File }> {
  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.9,
  }

  const compressedFile = await imageCompression(file, options)
  const dataUrl = await fileToDataUrl(compressedFile)
  return { dataUrl, compressedFile }
}

export async function generateThumbnail(file: File, maxSizeKB = 30): Promise<string> {
  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 300,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.8,
  }

  const thumbnail = await imageCompression(file, options)
  return fileToDataUrl(thumbnail)
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
