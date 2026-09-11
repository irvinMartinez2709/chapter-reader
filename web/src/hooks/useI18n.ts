import { useState, useEffect } from 'react'
import { translations, type Locale } from '../i18n/translations'
import { getSetting, setSetting } from '../utils/storage'

type TranslationNamespace = keyof typeof translations.es

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    getSetting<Locale>('locale').then((saved) => {
      if (saved) {
        setLocaleState(saved)
      }
    })
  }, [])

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale)
    await setSetting('locale', newLocale)
  }

  const t = (namespace: TranslationNamespace, key: string): string => {
    const ns = translations[locale][namespace] as Record<string, string>
    return ns[key] || key
  }

  return { locale, setLocale, t }
}
