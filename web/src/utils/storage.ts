import localforage from 'localforage'
import type { FlipBook } from '../types/flipbook'

const DB_PREFIX = 'flippdf'
const DB_VERSION = 'v1'
const BOOKS_STORE = `${DB_PREFIX}.books.${DB_VERSION}`
const SETTINGS_STORE = `${DB_PREFIX}.settings.${DB_VERSION}`

const booksDb = localforage.createInstance({
  name: BOOKS_STORE,
  storeName: 'books',
})

const settingsDb = localforage.createInstance({
  name: SETTINGS_STORE,
  storeName: 'settings',
})

export async function saveBook(book: FlipBook): Promise<void> {
  await booksDb.setItem(book.id, book)
}

export async function getBook(id: string): Promise<FlipBook | null> {
  return await booksDb.getItem<FlipBook>(id)
}

export async function listBooks(): Promise<FlipBook[]> {
  const books: FlipBook[] = []
  await booksDb.iterate<FlipBook, void>((value) => {
    books.push(value)
  })
  return books.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function deleteBook(id: string): Promise<void> {
  await booksDb.removeItem(id)
}

export async function updateBook(id: string, updates: Partial<FlipBook>): Promise<void> {
  const book = await getBook(id)
  if (book) {
    await saveBook({ ...book, ...updates, updatedAt: new Date().toISOString() })
  }
}

export async function getSetting<T>(key: string): Promise<T | null> {
  return await settingsDb.getItem<T>(key)
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await settingsDb.setItem(key, value)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
