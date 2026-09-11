import type { PageData, ConversionProgress } from '../types/flipbook'

export async function convertPdfToImages(
  file: File,
  onProgress?: (progress: ConversionProgress) => void,
  scale: number = 1.5
): Promise<PageData[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const pages: PageData[] = []

  onProgress?.({
    phase: 'converting',
    current: 0,
    total: totalPages,
    percent: 0,
  })

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b: Blob | null) => {
        if (b) resolve(b)
        else resolve(new Blob([]))
      }, 'image/webp', 0.85)
    })

    pages.push({
      pageNum: i,
      blob,
      width: viewport.width,
      height: viewport.height,
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
