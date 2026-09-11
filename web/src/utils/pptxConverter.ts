import JSZip from 'jszip'
import type { PageData, ConversionProgress } from '../types/flipbook'

export async function convertPptxToImages(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<PageData[]> {
  onProgress?.({
    phase: 'reading',
    current: 0,
    total: 1,
    percent: 0,
  })

  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  onProgress?.({
    phase: 'converting',
    current: 0,
    total: 1,
    percent: 20,
  })

  const mediaFiles: { name: string; blob: Blob }[] = []

  zip.forEach((path, entry) => {
    if (path.startsWith('ppt/media/') && /\.(png|jpe?g|gif|webp)$/i.test(path)) {
      mediaFiles.push({ name: path, blob: entry.async('blob') as unknown as Blob })
    }
  })

  const resolvedMedia = await Promise.all(
    mediaFiles.map(async (m) => ({
      name: m.name,
      blob: await m.blob,
    }))
  )

  resolvedMedia.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  const pages: PageData[] = resolvedMedia.map((media, index) => ({
    pageNum: index + 1,
    blob: media.blob,
    url: URL.createObjectURL(media.blob),
  }))

  if (pages.length === 0) {
    const fallbackBlob = new Blob(['No images found in PPTX'], { type: 'text/plain' })
    pages.push({
      pageNum: 1,
      blob: fallbackBlob,
    })
  }

  onProgress?.({
    phase: 'done',
    current: pages.length,
    total: pages.length,
    percent: 100,
  })

  return pages
}
