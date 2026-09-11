import { useState, useCallback } from 'react'
import type { ConversionProgress, PageData } from '../../types/flipbook'
import { convertPdfToImages } from '../../utils/pdfConverter'
import { convertDocxToImages } from '../../utils/docxConverter'
import { convertPptxToImages } from '../../utils/pptxConverter'
import { convertEpubToImages } from '../../utils/epubConverter'
import { convertImagesToBook, isImageFile } from '../../utils/imageConverter'

interface UseConverterReturn {
  progress: ConversionProgress
  pages: PageData[]
  convert: (file: File) => Promise<PageData[]>
  reset: () => void
}

export function useConverter(): UseConverterReturn {
  const [progress, setProgress] = useState<ConversionProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    percent: 0,
  })
  const [pages, setPages] = useState<PageData[]>([])

  const reset = useCallback(() => {
    setProgress({ phase: 'idle', current: 0, total: 0, percent: 0 })
    setPages([])
  }, [])

  const convert = useCallback(async (file: File): Promise<PageData[]> => {
    setProgress({ phase: 'reading', current: 0, total: 1, percent: 0 })

    try {
      let result: PageData[] = []

      const format = getFormat(file)

      switch (format) {
        case 'pdf':
          result = await convertPdfToImages(file, setProgress)
          break
        case 'docx':
          result = await convertDocxToImages(file, setProgress)
          break
        case 'pptx':
          result = await convertPptxToImages(file, setProgress)
          break
        case 'epub':
          result = await convertEpubToImages(file, setProgress)
          break
        case 'image':
          result = await convertImagesToBook([file], setProgress)
          break
        default:
          throw new Error(`Formato no soportado: ${file.type}`)
      }

      setPages(result)
      setProgress({ phase: 'done', current: result.length, total: result.length, percent: 100 })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setProgress({ phase: 'error', current: 0, total: 0, percent: 0, error: message })
      throw error
    }
  }, [])

  return { progress, pages, convert, reset }
}

function getFormat(file: File): 'pdf' | 'docx' | 'pptx' | 'epub' | 'image' {
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) return 'docx'
  if (file.type.includes('presentationml') || file.name.endsWith('.pptx')) return 'pptx'
  if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) return 'epub'
  if (isImageFile(file)) return 'image'
  throw new Error(`Formato no soportado: ${file.type || file.name}`)
}
