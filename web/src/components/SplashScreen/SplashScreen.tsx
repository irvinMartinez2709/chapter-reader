import { useState, useEffect } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer1 = setTimeout(() => setOpacity(1), 50)
    const timer2 = setTimeout(() => onComplete(), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-500"
      style={{
        opacity,
        backgroundColor: 'var(--bg)',
      }}
    >
      <div className="text-center">
        {/* Icono */}
        <div className="mb-6 mx-auto" style={{ width: 80, height: 80 }}>
          <img
            src="/favicon.ico"
            alt="Chapter"
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            }}
          />
        </div>

        {/* Nombre */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--accent)',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Chapter
        </h1>

        {/* Tagline */}
        <p
          className="text-sm"
          style={{ color: 'var(--text)', opacity: 0.5 }}
        >
          Tu lector de historias favorito
        </p>

        {/* Loader */}
        <div className="mt-8">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
              borderTopColor: 'var(--accent)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
