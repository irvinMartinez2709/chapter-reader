import { useState, useEffect, useRef } from 'react'

const PALETTES = [
  { name: 'Noche', bg: '#0f172a', card: '#1e293b', text: '#f8fafc', accent: '#6366f1' },
  { name: 'Obsidiana', bg: '#1a1a2e', card: '#16213e', text: '#eaeaea', accent: '#e94560' },
  { name: 'Bosque', bg: '#1a2e1a', card: '#2d4a2d', text: '#e8f5e9', accent: '#66bb6a' },
  { name: 'Océano', bg: '#0a192f', card: '#112240', text: '#ccd6f6', accent: '#64ffda' },
  { name: 'Atardecer', bg: '#2d1b3d', card: '#3d2550', text: '#f3e5f5', accent: '#ff8a65' },
  { name: 'Café', bg: '#2c1e1e', card: '#3e2c2c', text: '#f5e6d3', accent: '#d4a574' },
  { name: 'Neón', bg: '#0a0a0a', card: '#1a1a1a', text: '#00ff88', accent: '#ff0080' },
  { name: 'Lavanda', bg: '#2d2340', card: '#3d3055', text: '#e8dff5', accent: '#b39ddb' },
  { name: 'Coral', bg: '#2c1f1f', card: '#3e2d2d', text: '#fce4ec', accent: '#ff7043' },
  { name: 'Menta', bg: '#1a2e2a', card: '#2d4a44', text: '#e0f2f1', accent: '#26a69a' },
  { name: 'Solar', bg: '#2c2a1a', card: '#3e3c2d', text: '#fff8e1', accent: '#ffc107' },
  { name: 'Índigo', bg: '#1a1a3e', card: '#2d2d5c', text: '#c5cae9', accent: '#5c6bc0' },
  { name: 'Gris', bg: '#212121', card: '#333333', text: '#e0e0e0', accent: '#9e9e9e' },
  { name: 'Rojo', bg: '#2c1a1a', card: '#4a2020', text: '#ffebee', accent: '#ef5350' },
  { name: 'Turquesa', bg: '#1a2e2e', card: '#2d4a4a', text: '#e0f7fa', accent: '#26c6da' },
  { name: 'Dorado', bg: '#2c2a1a', card: '#4a4520', text: '#fff8e1', accent: '#d4a017' },
  { name: 'Rosa', bg: '#2e1a2a', card: '#4a2d44', text: '#fce4ec', accent: '#ec407a' },
  { name: 'Petróleo', bg: '#1a2a2e', card: '#2d4448', text: '#e0f2f1', accent: '#00897b' },
  { name: 'Lila', bg: '#2a1a2e', card: '#442d4a', text: '#f3e5f5', accent: '#ab47bc' },
  { name: 'Oliva', bg: '#2a2a1a', card: '#44442d', text: '#f1f8e9', accent: '#9ccc65' },
  { name: 'Gris Claro', bg: '#f5f5f5', card: '#ffffff', text: '#212121', accent: '#1976d2' },
  { name: 'Blanco', bg: '#ffffff', card: '#f8f8f8', text: '#333333', accent: '#333333' },
  { name: 'Arena', bg: '#f5f0e8', card: '#faf7f0', text: '#4a4a3a', accent: '#8b7355' },
  { name: 'Cielo', bg: '#e8f4fd', card: '#f0f8ff', text: '#1a3a5c', accent: '#2196f3' },
]

const STORAGE_KEY = 'flippdf_palette'

function getSavedPalette(): number {
  try {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0')
    if (!isNaN(saved) && saved < PALETTES.length) return saved
  } catch {}
  return 0
}

function applyPalette(idx: number) {
  const p = PALETTES[idx]
  const root = document.documentElement
  root.style.setProperty('--bg', p.bg)
  root.style.setProperty('--card', p.card)
  root.style.setProperty('--text', p.text)
  root.style.setProperty('--accent', p.accent)
  document.body.style.backgroundColor = p.bg
  document.body.style.color = p.text
  try { localStorage.setItem(STORAGE_KEY, String(idx)) } catch {}
}

export function ColorPalette() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(getSavedPalette)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { applyPalette(current) }, [current])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const p = PALETTES[current]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg transition-colors"
        style={{ backgroundColor: p.card, color: p.accent }}
        aria-label="Cambiar paleta de colores"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto rounded-xl shadow-2xl border z-50"
          style={{ backgroundColor: p.card, borderColor: 'rgba(128,128,128,0.2)' }}>
          <div className="p-2">
            <p className="text-xs px-2 py-1 mb-1 opacity-50">Paletas de colores</p>
            {PALETTES.map((palette, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left ${i === current ? 'ring-2 ring-white/30' : 'hover:bg-white/10'}`}
              >
                <div className="flex gap-1 shrink-0">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: palette.bg }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: palette.card }} />
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: palette.accent }} />
                </div>
                <span className="text-xs" style={{ color: palette.text }}>{palette.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
