import { useState, useEffect } from 'react'

export function Toast() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setMessage(detail.message)
      setVisible(true)
      setTimeout(() => setVisible(false), 2000)
    }
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        color: '#fff',
        backdropFilter: 'blur(8px)',
      }}
    >
      {message}
    </div>
  )
}
