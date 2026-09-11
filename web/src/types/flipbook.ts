export interface PageData {
  pageNum: number
  blob: Blob
  url?: string
  width?: number
  height?: number
}

export interface FlipBook {
  id: string
  title: string
  format: 'pdf' | 'docx' | 'pptx' | 'epub' | 'image'
  createdAt: string
  updatedAt: string
  pageCount: number
  coverUrl?: string
  thumbnailUrl?: string
  customCover?: boolean
  pages: PageData[]
  elements?: FlipBookElement[]
}

export interface FlipBookElement {
  id: string
  type: 'video' | 'audio' | 'link' | 'image'
  page: number
  x: number
  y: number
  width: number
  height: number
  src?: string
  url?: string
  label?: string
}

export interface ConversionProgress {
  phase: 'idle' | 'reading' | 'converting' | 'done' | 'error'
  current: number
  total: number
  percent: number
  error?: string
}

export type SupportedFormat = 'pdf' | 'docx' | 'pptx' | 'epub' | 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif'
