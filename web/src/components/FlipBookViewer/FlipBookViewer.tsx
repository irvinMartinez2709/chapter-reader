import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { PageData } from '../../types/flipbook'

interface FlipBookViewerProps {
  pages: PageData[]
  bookId?: string
  initialPage?: number
  onPageChange?: (page: number) => void
}

const LAST_READ_KEY = 'flippdf_last_read'
const BOOKMARKS_PREFIX = 'flippdf_bookmarks_'
const PRELOAD_AHEAD = 2
const PRELOAD_BEHIND = 1

const PageImg = React.memo(({ src, alt }: { src: string; alt?: string }) => (
  <img
    src={src}
    alt={alt || ''}
    loading="lazy"
    decoding="async"
    draggable={false}
    className="block w-full h-full"
    style={{ objectFit: 'contain', backgroundColor: '#fff' }}
  />
))
PageImg.displayName = 'PageImg'

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function FlipBookViewer({ pages, bookId = 'default', initialPage = 0, onPageChange }: FlipBookViewerProps) {
  const lastReadKey = LAST_READ_KEY + '_' + bookId
  const bookmarksKey = BOOKMARKS_PREFIX + bookId

  const savedPage = useMemo(() => {
    try { return parseInt(localStorage.getItem(lastReadKey) || '0') || 0 } catch { return 0 }
  }, [lastReadKey])

  const [currentPage, setCurrentPage] = useState(savedPage < pages.length ? savedPage : initialPage)
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [zoom, setZoom] = useState(100)
  const [zoomInput, setZoomInput] = useState('100')
  const [showSingle, setShowSingle] = useState(false)
  const [pageInput, setPageInput] = useState(String((savedPage < pages.length ? savedPage : initialPage) + 1))
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(bookmarksKey) || '[]') } catch { return [] }
  })
  const [showBookmarks, setShowBookmarks] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = pages.length
  const touchDevice = useMemo(() => isTouchDevice(), [])

  const useSingle = touchDevice && orientation === 'portrait' || showSingle

  // Orientation detection
  useEffect(() => {
    let ticking = false
    const check = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
        ticking = false
      })
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Save position
  useEffect(() => {
    try { localStorage.setItem(lastReadKey, String(currentPage)) } catch {}
  }, [currentPage, lastReadKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (flipTimer.current) clearTimeout(flipTimer.current) }
  }, [])

  // Get image src (lazy - only create objectURL when needed)
  const getImgSrc = useCallback((page: PageData) => {
    if (page.url) return page.url
    return URL.createObjectURL(page.blob)
  }, [])

  // Preload: preload pages around current
  const preloadedPages = useMemo(() => {
    const start = Math.max(0, currentPage - PRELOAD_BEHIND)
    const end = Math.min(totalPages - 1, currentPage + (useSingle ? PRELOAD_AHEAD : PRELOAD_AHEAD + 1))
    const set = new Set<number>()
    for (let i = start; i <= end; i++) set.add(i)
    return set
  }, [currentPage, totalPages, useSingle])

  // Go to page
  const goToPage = useCallback((idx: number, direction: 'next' | 'prev' = 'next') => {
    if (idx < 0 || idx >= totalPages || idx === currentPage || isFlipping) return

    setFlipDir(direction)
    setIsFlipping(true)
    setCurrentPage(idx)
    setPageInput(String(idx + 1))
    onPageChange?.(idx)

    if (flipTimer.current) clearTimeout(flipTimer.current)
    flipTimer.current = setTimeout(() => {
      setIsFlipping(false)
      setFlipDir(null)
    }, 400)
  }, [totalPages, currentPage, isFlipping, onPageChange])

  const flipNext = useCallback(() => {
    const step = useSingle ? 1 : 2
    goToPage(Math.min(currentPage + step, totalPages - 1), 'next')
  }, [currentPage, totalPages, useSingle, goToPage])

  const flipPrev = useCallback(() => {
    const step = useSingle ? 1 : 2
    goToPage(Math.max(currentPage - step, 0), 'prev')
  }, [currentPage, useSingle, goToPage])

  const goToPageNum = useCallback((num: number) => {
    const idx = Math.max(0, Math.min(num - 1, totalPages - 1))
    const direction = idx > currentPage ? 'next' : 'prev'
    goToPage(idx, direction)
  }, [totalPages, currentPage, goToPage])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isFlipping) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [isFlipping])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isFlipping) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) flipNext()
      else flipPrev()
    }
  }, [isFlipping, flipNext, flipPrev])

  // Mouse drag
  const mouseStartX = useRef(0)
  const mouseDown = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFlipping) return
    mouseStartX.current = e.clientX
    mouseDown.current = true
  }, [isFlipping])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseDown.current || isFlipping) return
    mouseDown.current = false
    const dx = e.clientX - mouseStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) flipNext()
      else flipPrev()
    }
  }, [isFlipping, flipNext, flipPrev])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') flipNext()
      else if (e.key === 'ArrowLeft') flipPrev()
      else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(250, z + 15))
      else if (e.key === '-') setZoom(z => Math.max(40, z - 15))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipNext, flipPrev])

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // Zoom
  const applyZoom = useCallback((val: number) => {
    const clamped = Math.max(40, Math.min(250, val))
    setZoom(clamped)
    setZoomInput(String(clamped))
  }, [])

  // Bookmarks
  const isBookmarked = bookmarks.includes(currentPage)
  const toggleBookmark = useCallback(() => {
    setBookmarks(prev => {
      const next = isBookmarked
        ? prev.filter(p => p !== currentPage)
        : [...prev, currentPage].sort((a, b) => a - b)
      try { localStorage.setItem(bookmarksKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [currentPage, isBookmarked, bookmarksKey])

  const removeBookmark = useCallback((page: number) => {
    setBookmarks(prev => {
      const next = prev.filter(p => p !== page)
      try { localStorage.setItem(bookmarksKey, JSON.stringify(next)) } catch {}
      return next
    })
  }, [bookmarksKey])

  // Calculate dimensions
  const dims = useMemo(() => {
    const availH = window.innerHeight - 100
    const availW = window.innerWidth - 16
    const pageAspect = 3 / 4

    if (useSingle) {
      let h = Math.min(availH, 700)
      let w = h * pageAspect
      if (w > availW) { w = availW; h = w / pageAspect }
      return { w: Math.round(w), h: Math.round(h), single: true }
    } else {
      let h = Math.min(availH, 600)
      let w = h * pageAspect
      const totalW = w * 2 + 4
      if (totalW > availW) { w = (availW - 4) / 2; h = w / pageAspect }
      return { w: Math.round(w), h: Math.round(h), single: false }
    }
  }, [useSingle])

  // Pages to display
  const leftPage = useSingle ? null : (currentPage > 0 ? currentPage - 1 : null)
  const rightPage = currentPage

  const flipClass = isFlipping ? (flipDir === 'next' ? 'flip-exit-next' : 'flip-exit-prev') : ''

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="opacity-50" style={{ fontFamily: 'var(--font-display)' }}>No hay páginas</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Book area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden min-h-0 pb-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
          {/* Leather frame */}
          <div style={{
            padding: '14px 18px 18px 18px',
            borderRadius: '6px',
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
              linear-gradient(145deg, #2a1a10 0%, #1a0f08 25%, #120a04 50%, #1a0f08 75%, #2a1a10 100%)
            `,
            boxShadow: '0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,100,0.04), inset 0 -1px 0 rgba(0,0,0,0.5), inset 2px 0 8px rgba(0,0,0,0.3)',
            border: '1px solid rgba(60,35,15,0.6)',
            position: 'relative',
          }}>
            {/* Stitching */}
            <div style={{
              position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px',
              border: '1px dashed rgba(100,65,25,0.35)',
              borderRadius: '4px',
              pointerEvents: 'none',
            }} />
            {/* Spine shadow */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px', bottom: '10px', width: '14px',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)',
              borderRadius: '2px',
              pointerEvents: 'none',
            }} />

            {/* Pages container */}
            <div style={{
              display: 'flex',
              position: 'relative',
              perspective: '2000px',
            }}>
              {/* Left page (double mode) */}
              {!dims.single && leftPage !== null && (
                <div style={{
                  width: dims.w,
                  height: dims.h,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  borderRight: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}>
                  {preloadedPages.has(leftPage) ? (
                    <PageImg src={getImgSrc(pages[leftPage])} alt={`Página ${leftPage + 1}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'transparent' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Right page / Single page */}
              <div
                className={flipClass}
                style={{
                  width: dims.w,
                  height: dims.h,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  flexShrink: 0,
                  transformOrigin: dims.single ? 'center center' : 'left center',
                  backfaceVisibility: 'hidden',
                  willChange: isFlipping ? 'transform' : 'auto',
                }}
              >
                {preloadedPages.has(rightPage) ? (
                  <PageImg src={getImgSrc(pages[rightPage])} alt={`Página ${rightPage + 1}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'transparent' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 backdrop-blur-sm border-t px-2 py-1.5 flex items-center justify-between gap-1 flex-wrap" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
        {/* Nav */}
        <div className="flex items-center gap-1">
          <button onClick={flipPrev} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => goToPageNum(parseInt(pageInput) || 1)}
            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); goToPageNum(parseInt(pageInput) || 1) } }}
            className="w-10 text-center text-xs rounded px-1 py-1 focus:outline-none border"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
          />
          <span className="text-xs opacity-50">/{totalPages}</span>
          <button onClick={flipNext} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Mode */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSingle(true)}
            className="px-2 py-1 rounded text-xs transition-all"
            style={{ backgroundColor: showSingle ? 'var(--accent)' : 'var(--card)', color: 'var(--text)' }}>
            1
          </button>
          <button onClick={() => setShowSingle(false)}
            className="px-2 py-1 rounded text-xs transition-all"
            style={{ backgroundColor: !showSingle ? 'var(--accent)' : 'var(--card)', color: 'var(--text)' }}>
            2
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => applyZoom(zoom - 15)} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => applyZoom(parseInt(zoomInput) || 100)}
            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); applyZoom(parseInt(zoomInput) || 100) } }}
            className="w-11 text-center text-xs rounded px-1 py-1 focus:outline-none border"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
          />
          <span className="text-xs opacity-50">%</span>
          <button onClick={() => applyZoom(zoom + 15)} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button onClick={() => applyZoom(100)} className="px-1.5 py-1 rounded text-xs" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>1:1</button>
        </div>

        {/* Bookmarks + Fullscreen */}
        <div className="flex items-center gap-1 relative">
          <button onClick={toggleBookmark}
            className="p-1.5 rounded transition-all active:scale-95"
            style={{ backgroundColor: isBookmarked ? 'var(--accent)' : 'var(--card)', color: 'var(--text)' }}
            title={isBookmarked ? 'Quitar marcador' : 'Marcar página'}>
            <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {bookmarks.length > 0 && (
            <button onClick={() => setShowBookmarks(!showBookmarks)}
              className="p-1.5 rounded transition-all active:scale-95"
              style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}
              title="Ver marcadores">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="absolute -top-1 -right-1 text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--accent)', color: 'var(--text)' }}>
                {bookmarks.length}
              </span>
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={isFullscreen
                  ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"} />
            </svg>
          </button>

          {showBookmarks && (
            <div className="absolute bottom-full right-0 mb-2 w-48 max-h-48 overflow-y-auto rounded-xl shadow-2xl border z-50" style={{ backgroundColor: 'var(--card)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
              <div className="p-2">
                <p className="text-[10px] px-1 mb-1 opacity-50" style={{ fontFamily: 'var(--font-display)' }}>Marcadores</p>
                {bookmarks.map((page) => (
                  <div key={page} className="flex items-center justify-between px-1 py-1 rounded group" style={{ color: 'var(--text)' }}>
                    <button onClick={() => { goToPageNum(page + 1); setShowBookmarks(false) }}
                      className="text-xs flex-1 text-left px-1" style={{ fontFamily: 'var(--font-display)' }}>
                      Página {page + 1}
                    </button>
                    <button onClick={() => removeBookmark(page)}
                      className="hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export type { FlipBookViewerProps }
