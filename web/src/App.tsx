import { useState, useCallback, useEffect } from 'react'
import { SplashScreen } from './components/SplashScreen/SplashScreen'
import { ColorPalette } from './components/ColorPalette/ColorPalette'
import { Library } from './components/Library/Library'
import { FileUploader } from './components/FileUploader/FileUploader'
import { useConverter } from './components/Converter/useConverter'
import { ProgressBar } from './components/Converter/ProgressBar'
import { FlipBookViewer } from './components/FlipBookViewer/FlipBookViewer'
import { Editor } from './components/Editor/Editor'
import { Settings } from './pages/Settings'
import { saveBook, generateId } from './utils/storage'
import type { FlipBook } from './types/flipbook'

type Page = 'library' | 'upload' | 'editor' | 'reader' | 'settings'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [page, setPage] = useState<Page>('library')
  const [currentBook, setCurrentBook] = useState<FlipBook | null>(null)
  const { progress, convert, reset } = useConverter()

  const TAGLINES = [
    'Tu próxima obsesión comienza aquí',
    'Lee. Siente. Repite.',
    'Historias que no sueltan',
    'Donde las historias te atrapan',
  ]
  const [taglineIdx, setTaglineIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIdx(i => (i + 1) % TAGLINES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleNewBook = useCallback(() => {
    reset()
    setPage('upload')
  }, [reset])

  const handleFileSelected = useCallback(async (file: File) => {
    try {
      const pages = await convert(file)

      const book: FlipBook = {
        id: generateId(),
        title: file.name.replace(/\.[^.]+$/, ''),
        format: file.type === 'application/pdf' ? 'pdf'
          : file.type.includes('word') ? 'docx'
          : file.type.includes('presentation') ? 'pptx'
          : file.type === 'application/epub+zip' || file.name.endsWith('.epub') ? 'epub'
          : 'image',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pageCount: pages.length,
        pages,
      }

      await saveBook(book)
      setCurrentBook(book)
      setPage('editor')
    } catch {
      // Error is handled by useConverter
    }
  }, [convert])

  const handleOpenBook = useCallback((book: FlipBook) => {
    setCurrentBook(book)
    setPage('editor')
  }, [])

  const handleReadBook = useCallback((book: FlipBook) => {
    setCurrentBook(book)
    setPage('reader')
  }, [])

  const handleSaveBook = useCallback((book: FlipBook) => {
    setCurrentBook(book)
    setPage('library')
  }, [])

  const handleBackToLibrary = useCallback(() => {
    setCurrentBook(null)
    setPage('library')
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (page === 'reader' && currentBook) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
        <header className="flex items-center justify-between px-4 py-2 shrink-0 border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
          <button
            onClick={handleBackToLibrary}
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-medium truncate max-w-[200px] text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {currentBook.title}
          </h1>
          <div className="w-6" />
        </header>
        <main className="flex-1 min-h-0 overflow-hidden">
          <FlipBookViewer pages={currentBook.pages} bookId={currentBook.id} />
        </main>
      </div>
    )
  }

  if (page === 'editor' && currentBook) {
    return (
      <Editor
        book={currentBook}
        onSave={handleSaveBook}
        onRead={handleReadBook}
        onBack={handleBackToLibrary}
      />
    )
  }

  if (page === 'settings') {
    return <Settings onBack={handleBackToLibrary} />
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              Chapter
            </h1>
            <p className="mt-1 opacity-60 transition-all duration-500" key={taglineIdx}>
              {TAGLINES[taglineIdx]}
            </p>
          </div>
          <div className="absolute right-4">
            <ColorPalette />
          </div>
        </header>

        {page === 'library' ? (
          <Library onReadBook={handleReadBook} onEditBook={handleOpenBook} onNewBook={handleNewBook} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBackToLibrary}
                className="hover:opacity-70 transition-opacity"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold font-display">
                Nuevo Flipbook
              </h2>
            </div>

            <FileUploader
              onFileSelected={handleFileSelected}
              isConverting={progress.phase === 'converting' || progress.phase === 'reading'}
            />

            {(progress.phase === 'converting' || progress.phase === 'reading') && (
              <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card)' }}>
                <ProgressBar
                  percent={progress.percent}
                  label={`Convirtiendo página ${progress.current} de ${progress.total}...`}
                />
              </div>
            )}

            {progress.phase === 'error' && (
              <div className="border rounded-xl p-4" style={{ borderColor: '#ef5350', backgroundColor: 'rgba(239,83,80,0.1)' }}>
                <p className="text-sm" style={{ color: '#ef5350' }}>
                  Error: {progress.error}
                </p>
              </div>
            )}
          </div>
        )}

        <footer className="text-center mt-12 text-xs opacity-40">
          Chapter v0.1.0
        </footer>
      </div>
    </div>
  )
}

export default App
