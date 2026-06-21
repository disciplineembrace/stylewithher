'use client'

import { useEffect, useState } from 'react'
import { useLanguage, Locale } from '@/i18n/use-language'

export default function SplashScreen() {
  const [phase, setPhase] = useState<'splash' | 'language' | 'done'>('splash')
  const [animationStep, setAnimationStep] = useState(0)
  const setLocale = useLanguage((s) => s.setLocale)

  // Splash animation sequence
  useEffect(() => {
    if (phase !== 'splash') return
    const t1 = setTimeout(() => setAnimationStep(1), 400)
    const t2 = setTimeout(() => setAnimationStep(2), 1000)
    const t3 = setTimeout(() => setAnimationStep(3), 1800)
    const t4 = setTimeout(() => setPhase('language'), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [phase])

  const handleSelectLanguage = (locale: Locale) => {
    setLocale(locale)
    setPhase('done')
  }

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0B1F3A] via-[#1a3355] to-[#0B1F3A]">
      {phase === 'splash' ? <SplashContent step={animationStep} /> : null}
      {phase === 'language' ? <LanguageSelection onSelect={handleSelectLanguage} /> : null}
    </div>
  )
}

function SplashContent({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center text-center px-6">
      {/* Decorative ring */}
      <div
        className="relative mb-8"
        style={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="w-32 h-32 rounded-full border-2 border-[#F7C8D0]/40 flex items-center justify-center"
          style={{
            boxShadow: step >= 2 ? '0 0 60px rgba(247, 200, 208, 0.3)' : 'none',
            transition: 'box-shadow 0.8s ease',
          }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F7C8D0] to-[#D96C8A] flex items-center justify-center">
            <span className="text-[#0B1F3A] font-bold text-3xl tracking-tight">S</span>
          </div>
        </div>
        {/* Orbiting dots */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#F7C8D0]"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateY(-80px) rotate(${-deg}deg)`,
              opacity: step >= 1 ? 0.6 : 0,
              transition: `opacity 0.5s ease ${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Welcome text */}
      <p
        className="text-[#F7C8D0]/80 text-sm md:text-base tracking-[0.3em] uppercase mb-3"
        style={{
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.3s',
        }}
      >
        Welcome to
      </p>

      {/* Brand name */}
      <h1
        className="text-white text-4xl md:text-6xl font-bold tracking-tight mb-4"
        style={{
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s',
        }}
      >
        <span className="bg-gradient-to-r from-[#F7C8D0] via-[#fff] to-[#D96C8A] bg-clip-text text-transparent">
          Stylewithher
        </span>
      </h1>

      {/* Tagline */}
      <p
        className="text-white/60 text-sm md:text-lg tracking-wide"
        style={{
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.7s ease 0.9s',
        }}
      >
        Style Together, Stay Together
      </p>

      {/* Loading bar */}
      {step >= 2 && (
        <div className="mt-10 w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F7C8D0] to-[#D96C8A] rounded-full"
            style={{
              animation: 'splashLoad 1.2s ease-in-out forwards',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes splashLoad {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

function LanguageSelection({ onSelect }: { onSelect: (l: Locale) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const languages: { code: Locale; label: string; native: string; flag: string }[] = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', native: 'Hindi', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', native: 'Gujarati', flag: '🇮🇳' },
  ]

  return (
    <div className="flex flex-col items-center text-center px-6 w-full max-w-md mx-auto">
      {/* Title */}
      <h2
        className="text-white text-2xl md:text-3xl font-bold mb-2"
        style={{
          animation: 'fadeSlideUp 0.6s ease forwards',
        }}
      >
        Choose Your Language
      </h2>
      <p
        className="text-white/50 text-sm mb-10"
        style={{
          animation: 'fadeSlideUp 0.6s ease 0.15s forwards',
          opacity: 0,
        }}
      >
        भाषा चुनें / ભાષા પસંદ કરો
      </p>

      {/* Language cards */}
      <div className="flex flex-col gap-4 w-full">
        {languages.map((lang, i) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            onMouseEnter={() => setHovered(lang.code)}
            onMouseLeave={() => setHovered(null)}
            className="group relative flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-[#F7C8D0]/50 hover:bg-white/10 cursor-pointer"
            style={{
              animation: `fadeSlideUp 0.5s ease ${0.3 + i * 0.12}s forwards`,
              opacity: 0,
            }}
          >
            {/* Hover glow */}
            {hovered === lang.code && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#F7C8D0]/10 to-[#D96C8A]/10 pointer-events-none" />
            )}

            {/* Flag */}
            <span className="text-3xl relative z-10">{lang.flag}</span>

            {/* Text */}
            <div className="flex-1 text-left relative z-10">
              <p className="text-white font-semibold text-lg">{lang.native}</p>
              <p className="text-white/50 text-sm">{lang.label}</p>
            </div>

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-white/30 group-hover:text-[#F7C8D0] transition-colors relative z-10"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}