'use client'

import { create } from 'zustand'
import en from '@/i18n/en.json'
import hi from '@/i18n/hi.json'
import gu from '@/i18n/gu.json'

export type Locale = 'en' | 'hi' | 'gu'

const translations: Record<Locale, typeof en> = { en, hi, gu }

const STORAGE_KEY = 'stylewithher-locale'

function getSavedLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) return saved
  } catch {}
  return 'en'
}

// Resolve a nested key like "home.heroSlides.0.title" from an object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    const numKey = Number(key)
    return isNaN(numKey) ? acc[key] : acc[numKey]
  }, obj)
}

interface LanguageState {
  locale: Locale
  initialized: boolean
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  init: () => void
}

export const useLanguage = create<LanguageState>((set, get) => ({
  locale: 'en',
  initialized: false,

  init: () => {
    const saved = getSavedLocale()
    set({ locale: saved, initialized: true })
  },

  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale)
    }
    set({ locale })
    // Dispatch a custom event so all components re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('language-change', { detail: locale }))
    }
  },

  t: (key: string, vars?: Record<string, string | number>) => {
    const { locale } = get()
    const messages = translations[locale] || translations.en
    let value = getNestedValue(messages, key)
    if (value === undefined) {
      // fallback to English
      value = getNestedValue(translations.en, key)
    }
    if (typeof value !== 'string') return key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    return value
  },
}))

// Hook that re-renders on language change
export function useTranslation() {
  const { t, locale, setLocale } = useLanguage()
  // Force re-render by reading locale
  void locale
  return { t, locale, setLocale }
}