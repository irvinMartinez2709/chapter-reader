import mammoth from 'mammoth'
import type { PageData, ConversionProgress } from '../types/flipbook'

export async function convertDocxToImages(
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
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const html = result.value

  onProgress?.({
    phase: 'converting',
    current: 0,
    total: 1,
    percent: 30,
  })

  const container = document.createElement('div')
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  `
  container.innerHTML = html
  document.body.appendChild(container)

  const pages: PageData[] = []
  const pageHeight = 1123
  const contentHeight = container.scrollHeight
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight))

  for (let i = 0; i < totalPages; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 794
    canvas.height = pageHeight
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const fragment = container.cloneNode(true) as HTMLElement
    fragment.style.position = 'absolute'
    fragment.style.left = '-9999px'
    fragment.style.top = `-${i * pageHeight}px`
    fragment.style.width = '794px'
    fragment.style.height = `${contentHeight}px`
    fragment.style.overflow = 'hidden'
    document.body.appendChild(fragment)

    const { default: html2canvas } = await import('html2canvas')
    const rendered = await html2canvas(fragment, {
      width: 794,
      height: pageHeight,
    })

    const blob = await new Promise<Blob>((resolve) => {
      rendered.toBlob((b: Blob | null) => {
        if (b) resolve(b)
        else resolve(new Blob([]))
      }, 'image/webp', 0.85)
    })

    pages.push({
      pageNum: i + 1,
      blob,
      width: 794,
      height: pageHeight,
    })

    document.body.removeChild(fragment)

    onProgress?.({
      phase: 'converting',
      current: i + 1,
      total: totalPages,
      percent: Math.round(((i + 1) / totalPages) * 100),
    })
  }

  document.body.removeChild(container)

  onProgress?.({
    phase: 'done',
    current: totalPages,
    total: totalPages,
    percent: 100,
  })

  return pages
}
