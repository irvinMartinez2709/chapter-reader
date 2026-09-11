import { useState, useCallback, useRef } from 'react'
import type { SupportedFormat } from '../../types/flipbook'

interface FileUploaderProps {
  onFileSelected: (file: File) => void
  isConverting?: boolean
}

const ACCEPTED_FORMATS: Record<SupportedFormat, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  epub: ['application/epub+zip'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  gif: ['image/gif'],
}

const ALL_ACCEPT = Object.values(ACCEPTED_FORMATS).flat().join(',')

export function FileUploader({ onFileSelected, isConverting = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isConverting) setIsDragging(true)
  }, [isConverting])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (isConverting) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelected(files[0])
    }
  }, [isConverting, onFileSelected])

  const handleClick = () => {
    if (!isConverting) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelected(files[0])
    }
    e.target.value = ''
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-12
        transition-all duration-200 text-center
        ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
        ${isConverting ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALL_ACCEPT}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          ${isDragging ? 'bg-blue-100 dark:bg-blue-800/30' : 'bg-gray-100 dark:bg-gray-700'}
        `}>
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6v12m6-6H6" />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            Arrastra tu archivo aquí
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            o haz clic para seleccionar
          </p>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Soporta: PDF, DOCX, PPTX, EPUB, JPG, PNG, WebP
        </p>
      </div>
    </div>
  )
}
