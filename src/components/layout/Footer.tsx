'use client'

import { useStore } from '@/store/use-store'
import { useTranslation } from '@/i18n/use-language'
import { Heart, ShoppingBag, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Footer() {
  const { navigate } = useStore()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async () => {
    if (!email) return
    try {
      await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    } catch { /* silent */ }
  }

  return (
    <footer className="bg-[#0D182A] text-white mt-auto">
      {/* Newsletter Section */}
      <div className="bg-[#EBF1FF] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-bold text-[#0D182A] mb-2">{t('footer.joinFamily')}</h3>
          <p className="text-[#666666] mb-4 text-sm">{t('footer.subscribeDesc')}</p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder={t('footer.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-gray-200 focus-visible:ring-[#E91663]"
              onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button onClick={handleSubscribe} className="bg-[#E91663] hover:bg-[#E91663]/90 text-white px-6 whitespace-nowrap">
              {subscribed ? t('footer.subscribed') : t('footer.subscribe')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="StyleWithHer" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{t('footer.brandDesc')}</p>
            <div className="flex gap-3">
              <a href="https://instagram.com/Style_withher01" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E91663] transition-colors" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
              <a href="https://facebook.com/stylewithher" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E91663] transition-colors" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
              <a href="https://twitter.com/stylewithher" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E91663] transition-colors" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-[#D4AF37]">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t('header.navShopAll'), page: 'products' as const },
                { label: t('header.navCouples'), page: 'products' as const, params: { gender: 'couple' } },
                { label: t('header.navWomen'), page: 'products' as const, params: { gender: 'women' } },
                { label: t('header.navMen'), page: 'products' as const, params: { gender: 'men' } },
                { label: t('header.navNewArrivals'), page: 'products' as const, params: { filter: 'newArrival' } },
                { label: t('header.navBestSellers'), page: 'products' as const, params: { filter: 'bestSeller' } },
              ].map((item) => (
                <li key={item.label}>
                  <button onClick={() => navigate(item.page, item.params)} className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-[#D4AF37]">{t('footer.customerService')}</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => navigate('profile')} className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">{t('header.myAccount')}</button></li>
              <li><button onClick={() => navigate('orders')} className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.trackOrder')}</button></li>
              <li><button onClick={() => navigate('wishlist')} className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">{t('header.wishlist')}</button></li>
              <li><button onClick={() => navigate('cart')} className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.shoppingCart')}</button></li>
              <li><span className="text-gray-400 text-sm">{t('footer.shippingPolicy')}</span></li>
              <li><span className="text-gray-400 text-sm">{t('footer.returnsExchanges')}</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-[#D4AF37]">{t('footer.contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#E91663]" />{t('footer.address')}</li>
              <li className="flex items-center gap-2 text-gray-400 text-sm"><Phone className="h-4 w-4 shrink-0 text-[#E91663]" />{t('footer.phone')}</li>
              <li className="flex items-center gap-2 text-gray-400 text-sm"><Mail className="h-4 w-4 shrink-0 text-[#E91663]" />{t('footer.email')}</li>
              <li className="flex items-center gap-2 text-gray-400 text-sm"><Instagram className="h-4 w-4 shrink-0 text-[#E91663]" /><a href="https://instagram.com/Style_withher01" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">{t('footer.instagram')}</a></li>
            </ul>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> {t('footer.freeShipping')}</div>
              <div className="flex items-center gap-1"><Heart className="h-3 w-3" /> {t('footer.easyReturns')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>{t('footer.rights')}</p>
          <div className="flex gap-4">
            <span className="hover:text-[#D4AF37] cursor-pointer">{t('footer.privacyPolicy')}</span>
            <span className="hover:text-[#D4AF37] cursor-pointer">{t('footer.termsOfService')}</span>
            <span className="hover:text-[#D4AF37] cursor-pointer">{t('footer.refundPolicy')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}