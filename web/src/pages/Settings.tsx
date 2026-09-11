import { useTheme } from '../hooks/useTheme'
import { useI18n } from '../hooks/useI18n'

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
            Configuración
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tema</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Oscuro
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Idioma</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLocale('es')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  locale === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Español
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  locale === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acerca de</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chapter v0.1.0
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tu lector de historias favorito
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              React + Capacitor + StPageFlip
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
