import { useState, useEffect } from 'react'
import { listBooks, deleteBook } from '../../utils/storage'
import type { FlipBook } from '../../types/flipbook'

interface LibraryProps {
  onReadBook: (book: FlipBook) => void
  onEditBook: (book: FlipBook) => void
  onNewBook: () => void
}

export function Library({ onReadBook, onEditBook, onNewBook }: LibraryProps) {
  const [books, setBooks] = useState<FlipBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    setLoading(true)
    const loaded = await listBooks()
    setBooks(loaded)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este libro?')) {
      await deleteBook(id)
      await loadBooks()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold font-display">
          Mi Biblioteca
        </h2>
        <div className="flex gap-2">
          {books.length > 0 && (
            <button
              onClick={() => onEditBook(books[books.length - 1])}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors opacity-70 hover:opacity-100"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          <button
            onClick={onNewBook}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--card)' }}>
            <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="mb-2 opacity-60">No hay libros aún</p>
          <p className="text-sm opacity-40">
            Toca "Nuevo" para crear tu primer flipbook
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
              style={{ backgroundColor: 'var(--card)' }}
              onClick={() => onReadBook(book)}
            >
              <div className="aspect-[3/4] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                {book.pages[0] ? (
                  <img
                    src={book.pages[0].url || URL.createObjectURL(book.pages[0].blob)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium font-display truncate" style={{ color: 'var(--text)' }}>
                  {book.title}
                </p>
                <p className="text-xs mt-1 opacity-50">
                  {book.pageCount} págs · {book.format.toUpperCase()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(book.id)
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
