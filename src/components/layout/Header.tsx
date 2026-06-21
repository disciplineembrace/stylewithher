'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/use-store'
import { useTranslation, useLanguage, Locale } from '@/i18n/use-language'
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut, Package, Shield, Instagram, Globe } from 'lucide-react'
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
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const cartCount = getCartCount()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = () => {}
    window.addEventListener('language-change', handler)
    return () => window.removeEventListener('language-change', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('products', { search: searchQuery.trim() })
    }
  }

  const handleLogout = () => { setUser(null); navigate('home') }

  const navItems = [
    { label: 'HOME', page: 'home' as const },
    { label: 'NEW ARRIVALS', page: 'products' as const, params: { filter: 'newArrival' } },
    { label: 'CLOTHING', page: 'products' as const },
    { label: 'COUPLES', page: 'products' as const, params: { gender: 'couple' } },
    { label: 'SALE', page: 'products' as const, params: { sort: 'price-asc' } },
  ]

  const langLabels: Record<Locale, string> = { en: 'EN', hi: 'हिं', gu: 'ગુ' }

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#0D182A] text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center relative">
          <p className="text-center text-white/90">
            Free Shipping on Orders Above ₹999 | <span className="font-semibold text-[#D4AF37]">UP TO 50% OFF</span> on New Arrivals
          </p>
          <a href="https://instagram.com/Style_withher01" target="_blank" rel="noopener noreferrer" className="absolute right-4 sm:right-6 hover:text-[#D4AF37] transition-colors" aria-label="Instagram">
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-[#0D182A]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-white p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <img src="/logo.png" alt="StyleWithHer" className="h-9 w-auto object-contain" />
                    <div>
                      <p className="text-[10px] text-[#D4AF37] font-medium tracking-widest uppercase">Fashion • Beauty • Lifestyle</p>
                    </div>
                  </div>
                  <nav className="flex-1 py-4">
                    {navItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { navigate(item.page, item.params); setMobileMenuOpen(false) }}
                        className="w-full text-left px-6 py-3 text-sm font-semibold text-[#0D182A] hover:bg-[#EBF1FF] hover:text-[#E91663] transition-colors tracking-wide"
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-2" />
                    <button onClick={() => { navigate('products', { gender: 'women' }); setMobileMenuOpen(false) }} className="w-full text-left px-6 py-3 text-sm text-[#0D182A] hover:bg-[#EBF1FF] transition-colors">WOMEN</button>
                    <button onClick={() => { navigate('products', { gender: 'men' }); setMobileMenuOpen(false) }} className="w-full text-left px-6 py-3 text-sm text-[#0D182A] hover:bg-[#EBF1FF] transition-colors">MEN</button>
                    <button onClick={() => { navigate('wishlist'); setMobileMenuOpen(false) }} className="w-full text-left px-6 py-3 text-sm text-[#0D182A] hover:bg-[#EBF1FF] transition-colors">WISHLIST</button>
                    <button onClick={() => { navigate('orders'); setMobileMenuOpen(false) }} className="w-full text-left px-6 py-3 text-sm text-[#0D182A] hover:bg-[#EBF1FF] transition-colors">MY ORDERS</button>
                  </nav>
                  <div className="px-6 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-[#E91663]" />
                      <span className="text-xs font-medium text-[#666]">Language</span>
                    </div>
                    <div className="flex gap-2">
                      {(['en', 'hi', 'gu'] as Locale[]).map((l) => (
                        <button key={l} onClick={() => setLocale(l)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${locale === l ? 'bg-[#0D182A] text-white border-[#0D182A]' : 'bg-white text-[#0D182A] border-gray-200 hover:border-[#E91663]'}`}>
                          {langLabels[l]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-100">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <button onClick={() => { navigate('profile'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-[#0D182A] hover:bg-[#EBF1FF] rounded-lg">My Account</button>
                        {user?.role === 'admin' && (
                          <button onClick={() => { navigate('admin'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-[#E91663] hover:bg-[#EBF1FF] rounded-lg font-medium">Admin Panel</button>
                        )}
                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">Logout</button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button onClick={() => { navigate('login'); setMobileMenuOpen(false) }} className="w-full bg-[#0D182A] hover:bg-[#0D182A]/90 text-white">Login</Button>
                        <Button onClick={() => { navigate('signup'); setMobileMenuOpen(false) }} variant="outline" className="w-full border-[#E91663] text-[#E91663] hover:bg-[#EBF1FF]">Sign Up</Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <button onClick={() => navigate('home')} className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.png" alt="StyleWithHer" className="h-10 lg:h-11 w-auto object-contain" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#D4AF37] leading-tight">Fashion • Beauty • Lifestyle</span>
              </div>
            </button>

            {/* Center Search Bar — Desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, categories..."
                  className="w-full h-10 pl-10 pr-4 text-sm bg-[#F5F7FA] border-gray-200 rounded-full focus-visible:ring-[#E91663] focus-visible:border-[#E91663]"
                />
              </div>
            </form>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.page, item.params)}
                  className="px-3 py-2 text-[13px] font-semibold text-[#0D182A] hover:text-[#E91663] transition-colors relative group tracking-wide"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#E91663] transition-all group-hover:w-full" />
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Search — Mobile */}
              <Button variant="ghost" size="icon" onClick={() => navigate('products')} className="lg:hidden text-[#0D182A] hover:text-[#E91663]">
                <Search className="h-5 w-5" />
              </Button>

              {/* Language — Desktop */}
              <DropdownMenu open={langMenuOpen} onOpenChange={setLangMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#0D182A] hover:text-[#E91663] hidden sm:flex">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  {([
                    { code: 'en' as Locale, label: 'English', flag: 'EN' },
                    { code: 'hi' as Locale, label: 'हिन्दी', flag: 'हिं' },
                    { code: 'gu' as Locale, label: 'ગુજરાતી', flag: 'ગુ' },
                  ]).map((l) => (
                    <DropdownMenuItem key={l.code} onClick={() => { setLocale(l.code); setLangMenuOpen(false) }}
                      className={locale === l.code ? 'bg-[#EBF1FF] text-[#E91663]' : ''}>
                      <span className="mr-2 font-mono text-xs">{l.flag}</span>{l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wishlist */}
              <Button variant="ghost" size="icon" onClick={() => navigate('wishlist')} className="text-[#0D182A] hover:text-[#E91663] relative">
                <Heart className="h-5 w-5" />
                {wishlistIds.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#E91663] text-white text-[10px] rounded-full">{wishlistIds.length}</Badge>
                )}
              </Button>

              {/* Cart */}
              <Button variant="ghost" size="icon" onClick={() => navigate('cart')} className="text-[#0D182A] hover:text-[#E91663] relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#0D182A] text-white text-[10px] rounded-full">{cartCount}</Badge>
                )}
              </Button>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-[#0D182A] hover:text-[#E91663]">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-[#0D182A] truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('profile')}><User className="mr-2 h-4 w-4" /> My Account</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('orders')}><Package className="mr-2 h-4 w-4" /> My Orders</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('wishlist')}><Heart className="mr-2 h-4 w-4" /> Wishlist</DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <><DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('admin')}><Shield className="mr-2 h-4 w-4 text-[#E91663]" /> Admin Panel</DropdownMenuItem></>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500"><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate('login')} className="text-[#0D182A] hover:text-[#E91663] text-sm font-medium">Login</Button>
                  <Button size="sm" onClick={() => navigate('signup')} className="bg-[#E91663] hover:bg-[#E91663]/90 text-white text-xs px-5 h-9 rounded-full font-medium">Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}