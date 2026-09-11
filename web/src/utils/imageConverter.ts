import type { PageData, ConversionProgress } from '../types/flipbook'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.includes(file.type)
}

export async function convertImagesToBook(
  files: File[],
  onProgress?: (progress: ConversionProgress) => void
): Promise<PageData[]> {
  const imageFiles = files.filter(isImageFile)

  onProgress?.({
    phase: 'converting',
    current: 0,
    total: imageFiles.length,
    percent: 0,
  })

  const pages: PageData[] = []

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const blob = await convertToWebP(file)

    pages.push({
      pageNum: i + 1,
      blob,
      url: URL.createObjectURL(blob),
    })

    onProgress?.({
      phase: 'converting',
      current: i + 1,
      total: imageFiles.length,
      percent: Math.round(((i + 1) / imageFiles.length) * 100),
    })
  }

  onProgress?.({
    phase: 'done',
    current: imageFiles.length,
    total: imageFiles.length,
    percent: 100,
  })

  return pages
}

async function convertToWebP(file: File): Promise<Blob> {
  const MAX_WIDTH = 1200
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width
      let h = img.height
      if (w > MAX_WIDTH) {
        const ratio = MAX_WIDTH / w
        w = MAX_WIDTH
        h = Math.round(h * ratio)
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.75)
    }
    img.src = URL.createObjectURL(file)
  })
}
