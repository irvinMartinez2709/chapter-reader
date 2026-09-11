import JSZip from 'jszip'
import type { PageData, ConversionProgress } from '../types/flipbook'

export async function convertEpubToImages(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<PageData[]> {
  onProgress?.({ phase: 'reading', current: 0, total: 1, percent: 0 })

  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Find the OPF container file
  const containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('Archivo EPUB inválido: falta container.xml')

  const containerXml = await containerFile.async('text')
  const opfPathMatch = containerXml.match(/full-path="([^"]+\.opf)"/)
  if (!opfPathMatch) throw new Error('Archivo EPUB inválido: no se encontró OPF')

  const opfPath = opfPathMatch[1]
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1)
  const opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error('Archivo EPUB inválido: OPF no encontrado')

  const opfXml = await opfFile.async('text')
  const parser = new DOMParser()
  const opfDoc = parser.parseFromString(opfXml, 'application/xml')

  // Get reading order from spine
  const spineItems = opfDoc.querySelectorAll('spine itemref')
  const manifestItems = opfDoc.querySelectorAll('manifest item')

  // Build manifest map: id -> href
  const manifestMap = new Map<string, string>()
  manifestItems.forEach(item => {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id && href) manifestMap.set(id, href)
  })

  // Get reading order
  const readingOrder: string[] = []
  spineItems.forEach(item => {
    const idref = item.getAttribute('idref')
    if (idref && manifestMap.has(idref)) {
      readingOrder.push(manifestMap.get(idref)!)
    }
  })

  if (readingOrder.length === 0) throw new Error('Archivo EPUB vacío')

  onProgress?.({ phase: 'converting', current: 0, total: readingOrder.length, percent: 0 })

  const pages: PageData[] = []
  const pageWidth = 794
  const pageHeight = 1123

  for (let i = 0; i < readingOrder.length; i++) {
    const href = readingOrder[i]
    const filePath = opfDir + href
    const htmlFile = zip.file(filePath)

    if (!htmlFile) continue

    let htmlContent = await htmlFile.async('text')

    // Basic cleanup: remove scripts, fix relative paths
    htmlContent = htmlContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '')

    // Create a container for rendering
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${pageWidth}px;
      padding: 40px;
      background: white;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 16px;
      line-height: 1.8;
      color: #1a1a1a;
      box-sizing: border-box;
    `
    container.innerHTML = htmlContent
    document.body.appendChild(container)

    // Wait for images to load
    const images = container.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>(resolve => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      })
    )

    const contentHeight = container.scrollHeight
    const totalPagesForChapter = Math.max(1, Math.ceil(contentHeight / pageHeight))

    for (let p = 0; p < totalPagesForChapter; p++) {
      const canvas = document.createElement('canvas')
      canvas.width = pageWidth
      canvas.height = pageHeight
      const ctx = canvas.getContext('2d')!

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const fragment = container.cloneNode(true) as HTMLElement
      fragment.style.position = 'absolute'
      fragment.style.left = '-9999px'
      fragment.style.top = `-${p * pageHeight}px`
      fragment.style.width = `${pageWidth}px`
      fragment.style.height = `${contentHeight}px`
      fragment.style.overflow = 'hidden'
      document.body.appendChild(fragment)

      const { default: html2canvas } = await import('html2canvas')
      const rendered = await html2canvas(fragment, {
        width: pageWidth,
        height: pageHeight,
        useCORS: true,
      })

      const blob = await new Promise<Blob>(resolve => {
        rendered.toBlob(b => {
          resolve(b || new Blob([]))
        }, 'image/webp', 0.75)
      })

      pages.push({
        pageNum: pages.length + 1,
        blob,
        width: pageWidth,
        height: pageHeight,
      })

      document.body.removeChild(fragment)

      onProgress?.({
        phase: 'converting',
        current: pages.length,
        total: readingOrder.length * totalPagesForChapter,
        percent: Math.round((pages.length / (readingOrder.length * totalPagesForChapter)) * 100),
      })
    }

    document.body.removeChild(container)
  }

  onProgress?.({ phase: 'done', current: pages.length, total: pages.length, percent: 100 })
  return pages
}
