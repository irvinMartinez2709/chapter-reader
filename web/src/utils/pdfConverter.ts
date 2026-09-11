import type { PageData, ConversionProgress } from '../types/flipbook'

export async function convertPdfToImages(
  file: File,
  onProgress?: (progress: ConversionProgress) => void,
  scale: number = 1.0
): Promise<PageData[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, rangeChunkSize: 65536 }).promise
  const totalPages = pdf.numPages
  const pages: PageData[] = []

  const MAX_WIDTH = 1200

  onProgress?.({
    phase: 'converting',
    current: 0,
    total: totalPages,
    percent: 0,
  })

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    let w = viewport.width
    let h = viewport.height
    if (w > MAX_WIDTH) {
      const ratio = MAX_WIDTH / w
      w = MAX_WIDTH
      h = Math.round(h * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!

    const scaledViewport = page.getViewport({ scale: scale * (w / viewport.width) })
    await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b: Blob | null) => {
        if (b) resolve(b)
        else resolve(new Blob([]))
      }, 'image/webp', 0.75)
    })

    canvas.width = 0
    canvas.height = 0

    pages.push({
      pageNum: i,
      blob,
      width: w,
      height: h,
    })

    onProgress?.({
      phase: 'converting',
      current: i,
      total: totalPages,
      percent: Math.round((i / totalPages) * 100),
    })
  }

  onProgress?.({
    phase: 'done',
    current: totalPages,
    total: totalPages,
    percent: 100,
  })

  return pages
}
