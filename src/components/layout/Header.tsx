'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/use-store'
import { useTranslation, useLanguage, Locale } from '@/i18n/use-language'
import { Search, Heart, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Package, Settings, Shield, Instagram, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

export default function Header() {
  const { navigate, user, setUser, getCartCount, wishlistIds, searchQuery, setSearchQuery, mobileMenuOpen, setMobileMenuOpen, isAuthenticated } = useStore()
  const { t, locale, setLocale } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const cartCount = getCartCount()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  // Re-render on language change
  useEffect(() => {
    const handler = () => {}
    window.addEventListener('language-change', handler)
    return () => window.removeEventListener('language-change', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('products', { search: searchQuery.trim() })
      setSearchOpen(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    navigate('home')
  }

  const navItems = [
    { label: t('header.navHome'), page: 'home' as const },
    { label: t('header.navShopAll'), page: 'products' as const },
    { label: t('header.navCouples'), page: 'products' as const, params: { gender: 'couple' } },
    { label: t('header.navWomen'), page: 'products' as const, params: { gender: 'women' } },
    { label: t('header.navMen'), page: 'products' as const, params: { gender: 'men' } },
    { label: t('header.navNewArrivals'), page: 'products' as const, params: { filter: 'newArrival' } },
    { label: t('header.navBestSellers'), page: 'products' as const, params: { filter: 'bestSeller' } },
  ]

  const langLabels: Record<Locale, string> = { en: 'EN', hi: 'हिं', gu: 'ગુ' }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#0B1F3A] text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center relative">
          <p className="animate-fadeIn">{t('header.topBar').replace('WELCOME20', '<span class="font-bold text-[#F7C8D0]">WELCOME20</span>')}</p>
          <a href="https://instagram.com/Style_withher01" target="_blank" rel="noopener noreferrer" className="absolute right-4 sm:right-6 hover:text-[#F7C8D0] transition-colors" aria-label="Follow us on Instagram">
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-[#222222]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-white p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-[#F7C8D0] flex items-center gap-3">
                    <img src="/logo.png" alt="StyleWithHer" className="h-9 w-auto object-contain" />
                    <div>
                      <p className="text-xs text-[#D96C8A]">{t('splash.tagline')}</p>
                    </div>
                  </div>
                  <nav className="flex-1 py-4">
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { navigate(item.page, item.params); setMobileMenuOpen(false) }}
                        className="w-full text-left px-6 py-3 text-sm font-medium text-[#222222] hover:bg-[#FFF5F7] hover:text-[#D96C8A] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                  {/* Language Switcher in Mobile */}
                  <div className="px-6 py-3 border-t border-[#E5E7EB]">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-[#D96C8A]" />
                      <span className="text-xs font-medium text-[#666]">Language</span>
                    </div>
                    <div className="flex gap-2">
                      {(['en', 'hi', 'gu'] as Locale[]).map((l) => (
                        <button
                          key={l}
                          onClick={() => setLocale(l)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${locale === l ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]' : 'bg-white text-[#222] border-[#E5E7EB] hover:border-[#D96C8A]'}`}
                        >
                          {langLabels[l]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-[#E5E7EB]">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <button onClick={() => { navigate('profile'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-[#222222] hover:bg-[#FFF5F7] rounded-lg">{t('header.myAccount')}</button>
                        <button onClick={() => { navigate('orders'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-[#222222] hover:bg-[#FFF5F7] rounded-lg">{t('header.myOrders')}</button>
                        {user?.role === 'admin' && (
                          <button onClick={() => { navigate('admin'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-[#D96C8A] hover:bg-[#FFF5F7] rounded-lg font-medium">{t('header.adminPanel')}</button>
                        )}
                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">{t('header.logout')}</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button onClick={() => { navigate('login'); setMobileMenuOpen(false) }} className="w-full bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white">{t('header.login')}</Button>
                        <Button onClick={() => { navigate('signup'); setMobileMenuOpen(false) }} variant="outline" className="w-full border-[#D96C8A] text-[#D96C8A] hover:bg-[#FFF5F7]">{t('header.signUp')}</Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <button onClick={() => navigate('home')} className="flex items-center gap-2">
              <img src="/logo.png" alt="StyleWithHer" className="h-12 w-auto object-contain" />
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.page, item.params)}
                  className="px-3 py-2 text-sm font-medium text-[#222222] hover:text-[#D96C8A] transition-colors relative group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#D96C8A] transition-all group-hover:w-full" />
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Language Switcher Desktop */}
              <DropdownMenu open={langMenuOpen} onOpenChange={setLangMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#222222] hover:text-[#D96C8A] hidden sm:flex">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {([
                    { code: 'en' as Locale, label: 'English', flag: 'EN' },
                    { code: 'hi' as Locale, label: 'हिन्दी', flag: 'हिं' },
                    { code: 'gu' as Locale, label: 'ગુજરાતી', flag: 'ગુ' },
                  ]).map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => { setLocale(l.code); setLangMenuOpen(false) }}
                      className={locale === l.code ? 'bg-[#FFF5F7] text-[#D96C8A]' : ''}
                    >
                      <span className="mr-2 font-mono text-xs">{l.flag}</span>
                      {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <div className="relative">
                {searchOpen ? (
                  <form onSubmit={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                    <Input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('header.searchPlaceholder')}
                      className="w-48 sm:w-64 h-9 text-sm bg-[#FFF5F7] border-[#F7C8D0] focus-visible:ring-[#D96C8A]"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="text-[#222222] hover:text-[#D96C8A]">
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Wishlist */}
              <Button variant="ghost" size="icon" onClick={() => navigate('wishlist')} className="text-[#222222] hover:text-[#D96C8A] relative">
                <Heart className="h-5 w-5" />
                {wishlistIds.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#D96C8A] text-white text-[10px] rounded-full">
                    {wishlistIds.length}
                  </Badge>
                )}
              </Button>

              {/* Cart */}
              <Button variant="ghost" size="icon" onClick={() => navigate('cart')} className="text-[#222222] hover:text-[#D96C8A] relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#0B1F3A] text-white text-[10px] rounded-full">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-[#222222] hover:text-[#D96C8A]">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-[#222222] truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('profile')}><User className="mr-2 h-4 w-4" /> {t('header.myAccount')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('orders')}><Package className="mr-2 h-4 w-4" /> {t('header.myOrders')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('wishlist')}><Heart className="mr-2 h-4 w-4" /> {t('header.wishlist')}</DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('admin')}><Shield className="mr-2 h-4 w-4 text-[#D96C8A]" /> {t('header.adminPanel')}</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500"><LogOut className="mr-2 h-4 w-4" /> {t('header.logout')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('login')} className="text-[#222222] hover:text-[#D96C8A] text-sm">{t('header.login')}</Button>
                  <Button size="sm" onClick={() => navigate('signup')} className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-xs px-4">{t('header.signUp')}</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}