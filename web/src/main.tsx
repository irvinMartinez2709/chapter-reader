import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Aplicar paleta guardada ANTES del primer render para evitar flash
const PALETTES = [
  { bg: '#0f172a', card: '#1e293b', text: '#f8fafc', accent: '#6366f1' },
  { bg: '#1a1a2e', card: '#16213e', text: '#eaeaea', accent: '#e94560' },
  { bg: '#1a2e1a', card: '#2d4a2d', text: '#e8f5e9', accent: '#66bb6a' },
  { bg: '#0a192f', card: '#112240', text: '#ccd6f6', accent: '#64ffda' },
  { bg: '#2d1b3d', card: '#3d2550', text: '#f3e5f5', accent: '#ff8a65' },
  { bg: '#2c1e1e', card: '#3e2c2c', text: '#f5e6d3', accent: '#d4a574' },
  { bg: '#0a0a0a', card: '#1a1a1a', text: '#00ff88', accent: '#ff0080' },
  { bg: '#2d2340', card: '#3d3055', text: '#e8dff5', accent: '#b39ddb' },
  { bg: '#2c1f1f', card: '#3e2d2d', text: '#fce4ec', accent: '#ff7043' },
  { bg: '#1a2e2a', card: '#2d4a44', text: '#e0f2f1', accent: '#26a69a' },
  { bg: '#2c2a1a', card: '#3e3c2d', text: '#fff8e1', accent: '#ffc107' },
  { bg: '#1a1a3e', card: '#2d2d5c', text: '#c5cae9', accent: '#5c6bc0' },
  { bg: '#212121', card: '#333333', text: '#e0e0e0', accent: '#9e9e9e' },
  { bg: '#2c1a1a', card: '#4a2020', text: '#ffebee', accent: '#ef5350' },
  { bg: '#1a2e2e', card: '#2d4a4a', text: '#e0f7fa', accent: '#26c6da' },
  { bg: '#2c2a1a', card: '#4a4520', text: '#fff8e1', accent: '#d4a017' },
  { bg: '#2e1a2a', card: '#4a2d44', text: '#fce4ec', accent: '#ec407a' },
  { bg: '#1a2a2e', card: '#2d4448', text: '#e0f2f1', accent: '#00897b' },
  { bg: '#2a1a2e', card: '#442d4a', text: '#f3e5f5', accent: '#ab47bc' },
  { bg: '#2a2a1a', card: '#44442d', text: '#f1f8e9', accent: '#9ccc65' },
  { bg: '#f5f5f5', card: '#ffffff', text: '#212121', accent: '#1976d2' },
  { bg: '#ffffff', card: '#f8f8f8', text: '#333333', accent: '#333333' },
  { bg: '#f5f0e8', card: '#faf7f0', text: '#4a4a3a', accent: '#8b7355' },
  { bg: '#e8f4fd', card: '#f0f8ff', text: '#1a3a5c', accent: '#2196f3' },
]

try {
  const saved = parseInt(localStorage.getItem('flippdf_palette') || '0')
  if (!isNaN(saved) && saved < PALETTES.length) {
    const p = PALETTES[saved]
    const root = document.documentElement
    root.style.setProperty('--bg', p.bg)
    root.style.setProperty('--card', p.card)
    root.style.setProperty('--text', p.text)
    root.style.setProperty('--accent', p.accent)
    document.body.style.backgroundColor = p.bg
    document.body.style.color = p.text
  }
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
