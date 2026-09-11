import { useState } from 'react'
import type { FlipBook } from '../../types/flipbook'
import { updateBook } from '../../utils/storage'

interface EditorProps {
  book: FlipBook
  onSave: (book: FlipBook) => void
  onRead: (book: FlipBook) => void
  onBack: () => void
}

export function Editor({ book, onSave, onRead, onBack }: EditorProps) {
  const [title, setTitle] = useState(book.title)
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomCoverUrl(url)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const updatedBook: FlipBook = {
      ...book,
      title,
      customCover: !!customCoverUrl,
      coverUrl: customCoverUrl || undefined,
      updatedAt: new Date().toISOString(),
    }
    await updateBook(book.id, updatedBook)
    onSave(updatedBook)
    setSaving(false)
  }

  const handleRead = () => {
    const bookToRead = customCoverUrl
      ? { ...book, coverUrl: customCoverUrl, customCover: true }
      : book
    onRead(bookToRead)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
            Editor
          </h1>
          <button
            onClick={handleRead}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Leer
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título del libro
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Portada
          </h3>

          <div className="flex gap-4">
            <div
              className={`
                flex-1 aspect-[3/4] rounded-lg border-2 overflow-hidden cursor-pointer
                ${!customCoverUrl ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
              `}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {book.pages[0] && (
                  <img
                    src={book.pages[0].url || URL.createObjectURL(book.pages[0].blob)}
                    alt="Primera página"
                    className="w-full h-full object-cover rounded"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">Primera página</p>
              </div>
            </div>

            <div
              className={`
                flex-1 aspect-[3/4] rounded-lg border-2 overflow-hidden cursor-pointer
                ${customCoverUrl ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}
              `}
              onClick={() => document.getElementById('cover-input')?.click()}
            >
              {customCoverUrl ? (
                <img src={customCoverUrl} alt="Portada personalizada" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-xs text-gray-500 text-center">Portada personalizada</p>
                </div>
              )}
            </div>
          </div>

          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />

          {customCoverUrl && (
            <button
              onClick={() => setCustomCoverUrl(null)}
              className="mt-3 text-sm text-red-500 hover:text-red-700"
            >
              Quitar portada personalizada
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Información
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Formato: {book.format.toUpperCase()}</p>
            <p>Páginas: {book.pageCount}</p>
            <p>Creado: {new Date(book.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </main>
    </div>
  )
}
