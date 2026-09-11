import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import HTMLFlipBook from 'react-pageflip'
import type { PageData } from '../../types/flipbook'

interface FlipBookViewerProps {
  pages: PageData[]
  bookId?: string
  initialPage?: number
  onPageChange?: (page: number) => void
}

const LAST_READ_KEY = 'flippdf_last_read'
const BOOKMARKS_PREFIX = 'flippdf_bookmarks_'

const PageComponent = React.memo(React.forwardRef<HTMLDivElement, { src: string; pageNum: number }>((props, ref) => {
  return (
    <div ref={ref} className="w-full h-full overflow-hidden bg-white" style={{ margin: 0, padding: 0 }}>
      <img src={props.src} alt="" loading="lazy"
        className="block w-full h-full" style={{ objectFit: 'fill', margin: 0, padding: 0 }}
        draggable={false} />
    </div>
  )
}))
PageComponent.displayName = 'PageComponent'

export function FlipBookViewer({ pages, bookId = 'default', initialPage = 0, onPageChange }: FlipBookViewerProps) {
  const lastReadKey = LAST_READ_KEY + '_' + bookId
  const bookmarksKey = BOOKMARKS_PREFIX + bookId

  const savedPage = useMemo(() => {
    try { return parseInt(localStorage.getItem(lastReadKey) || '0') || 0 } catch { return 0 }
  }, [lastReadKey])

  const [currentPage, setCurrentPage] = useState(savedPage < pages.length ? savedPage : initialPage)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [zoomInput, setZoomInput] = useState('100')
  const [showSingle, setShowSingle] = useState(false)
  const [pageInput, setPageInput] = useState(String((savedPage < pages.length ? savedPage : initialPage) + 1))
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(bookmarksKey) || '[]') } catch { return [] }
  })
  const [showBookmarks, setShowBookmarks] = useState(false)
  const bookRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(zoom)
  const totalPages = pages.length

  useEffect(() => {
    let ticking = false
    const check = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setIsMobile(window.innerWidth < 768)
        ticking = false
      })
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Guardar posición de lectura
  useEffect(() => {
    try { localStorage.setItem(lastReadKey, String(currentPage)) } catch {}
  }, [currentPage, lastReadKey])

  const getImgSrc = useCallback((page: PageData) => page.url || URL.createObjectURL(page.blob), [])

  const onFlip = useCallback((e: any) => {
    const p = e.data
    setCurrentPage(p)
    setPageInput(String(p + 1))
    onPageChange?.(p)
  }, [onPageChange])

  const flipNext = useCallback(() => {
    try { bookRef.current?.pageFlip()?.flipNext() } catch {}
  }, [])

  const flipPrev = useCallback(() => {
    try { bookRef.current?.pageFlip()?.flipPrev() } catch {}
  }, [])

  const goToPage = useCallback((num: number) => {
    const idx = Math.max(0, Math.min(num - 1, totalPages - 1))
    try { bookRef.current?.pageFlip()?.turnToPage(idx) } catch {}
    setCurrentPage(idx)
    setPageInput(String(idx + 1))
  }, [totalPages])

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])



  const applyZoomImmediate = useCallback((val: number) => {
    const clamped = Math.max(40, Math.min(250, val))
    setZoom(clamped)
    setZoomInput(String(clamped))
  }, [])

  useEffect(() => { zoomRef.current = zoom }, [zoom])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') flipNext()
      else if (e.key === 'ArrowLeft') flipPrev()
      else if (e.key === 'f') toggleFullscreen()
      else if (e.key === '+' || e.key === '=') applyZoomImmediate(zoomRef.current + 15)
      else if (e.key === '-') applyZoomImmediate(zoomRef.current - 15)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipNext, flipPrev, toggleFullscreen, applyZoomImmediate])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const dims = useMemo(() => {
    const useSingle = isMobile || showSingle
    const availH = window.innerHeight - 100
    const availW = isMobile ? window.innerWidth - 16 : window.innerWidth - 32
    const pageAspect = 3 / 4

    if (useSingle) {
      let h = Math.min(availH, 600)
      let w = h * pageAspect
      if (w > availW) { w = availW; h = w / pageAspect }
      return { w: Math.round(w), h: Math.round(h), single: true }
    } else {
      let h = Math.min(availH, 560)
      let w = h * pageAspect
      const totalW = w * 2 + 4
      if (totalW > availW) { w = (availW - 4) / 2; h = w / pageAspect }
      return { w: Math.round(w), h: Math.round(h), single: false }
    }
  }, [isMobile, showSingle])

  // Key para forzar remount cuando cambia el modo
  const bookKey = `${dims.single ? 's' : 'd'}-${dims.w}-${dims.h}`

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="opacity-50" style={{ fontFamily: 'var(--font-display)' }}>No hay páginas</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden select-none" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 pb-2">
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
          {/* Leather book frame — darker, textured */}
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
            {/* Stitching line */}
            <div style={{
              position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px',
              border: '1px dashed rgba(100,65,25,0.35)',
              borderRadius: '4px',
              pointerEvents: 'none',
            }} />
            {/* Spine shadow on left */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px', bottom: '10px', width: '14px',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)',
              borderRadius: '2px',
              pointerEvents: 'none',
            }} />
            <HTMLFlipBook
              key={bookKey}
              ref={bookRef}
              width={dims.w}
              height={dims.h}
              size="fixed"
              drawShadow={true}
              flippingTime={800}
              usePortrait={dims.single}
              startZIndex={0}
              autoSize={false}
              showCover={true}
              mobileScrollSupport={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={30}
              onFlip={onFlip}
              style={{}}
              startPage={currentPage}
              maxShadowOpacity={0.5}
              showPageCorners={!dims.single}
              disableFlipByClick={false}
              className=""
              minWidth={100}
              maxWidth={800}
              minHeight={100}
              maxHeight={700}
            >
              {pages.map((page, i) => (
                <PageComponent key={i} src={getImgSrc(page)} pageNum={i + 1} />
              ))}
            </HTMLFlipBook>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 backdrop-blur-sm border-t px-2 py-1.5 flex items-center justify-between gap-1 flex-wrap" style={{ backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
        {/* Navegación + Salto a página */}
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
            onBlur={() => goToPage(parseInt(pageInput) || 1)}
            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); goToPage(parseInt(pageInput) || 1) } }}
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

        {/* Modo página */}
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
          <button onClick={() => applyZoomImmediate(zoom - 15)} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => applyZoomImmediate(parseInt(zoomInput) || 100)}
            onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); applyZoomImmediate(parseInt(zoomInput) || 100) } }}
            className="w-11 text-center text-xs rounded px-1 py-1 focus:outline-none border"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}
          />
          <span className="text-xs opacity-50">%</span>
          <button onClick={() => applyZoomImmediate(zoom + 15)} className="p-1.5 rounded transition-all active:scale-95 hover:opacity-80" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button onClick={() => applyZoomImmediate(100)} className="px-1.5 py-1 rounded text-xs" style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}>1:1</button>
        </div>

        {/* Fullscreen + Bookmarks */}
        <div className="flex items-center gap-1 relative">
          <button onClick={toggleBookmark}
            className="p-1.5 rounded transition-all active:scale-95"
            style={{ backgroundColor: isBookmarked ? 'var(--accent)' : 'var(--card)', color: 'var(--text)' }}
            title={isBookmarked ? 'Quitar marcador' : 'Marcar página'}>
            <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {bookmarks.length > 0 && (
            <button onClick={() => setShowBookmarks(!showBookmarks)}
              className="p-1.5 rounded transition-all active:scale-95"
              style={{ backgroundColor: 'var(--card)', color: 'var(--accent)' }}
              title="Ver marcadores">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

          {/* Panel de marcadores */}
          {showBookmarks && (
            <div className="absolute bottom-full right-0 mb-2 w-48 max-h-48 overflow-y-auto rounded-xl shadow-2xl border z-50" style={{ backgroundColor: 'var(--card)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
              <div className="p-2">
                <p className="text-[10px] px-1 mb-1 opacity-50" style={{ fontFamily: 'var(--font-display)' }}>Marcadores</p>
                {bookmarks.map((page) => (
                  <div key={page} className="flex items-center justify-between px-1 py-1 rounded group" style={{ color: 'var(--text)' }}>
                    <button onClick={() => { goToPage(page); setShowBookmarks(false) }}
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
