'use client'

import { useStore } from '@/store/use-store'
import { Heart, ShoppingBag, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Footer() {
  const { navigate, user, isAuthenticated } = useStore()
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
    <footer className="bg-[#0B1F3A] text-white mt-auto">
      {/* Newsletter Section */}
      <div className="bg-[#FFF5F7] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-bold text-[#0B1F3A] mb-2">Join the StyleWithHer Family</h3>
          <p className="text-[#666666] mb-4 text-sm">Subscribe for exclusive offers, new arrivals & couple style inspiration</p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-[#F7C8D0] focus-visible:ring-[#D96C8A]"
              onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button onClick={handleSubscribe} className="bg-[#D96C8A] hover:bg-[#D96C8A]/90 text-white px-6 whitespace-nowrap">
              {subscribed ? 'Subscribed!' : 'Subscribe'}
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
              <div className="w-10 h-10 bg-[#F7C8D0] rounded-full flex items-center justify-center">
                <span className="text-[#0B1F3A] font-bold text-lg">S</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">StyleWithHer</h3>
                <p className="text-[#F7C8D0] text-[10px] tracking-wider">STYLE TOGETHER, STAY TOGETHER</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">India&apos;s premium couple fashion brand. Express your love through matching fashion crafted with premium quality fabrics and modern designs.</p>
            <div className="flex gap-3">
              <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D96C8A] transition-colors"><Instagram className="h-4 w-4" /></button>
              <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D96C8A] transition-colors"><Facebook className="h-4 w-4" /></button>
              <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#D96C8A] transition-colors"><Twitter className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-[#F7C8D0]">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Shop All', page: 'products' as const },
                { label: 'Couple Collection', page: 'products' as const, params: { gender: 'couple' } },
                { label: 'Women', page: 'products' as const, params: { gender: 'women' } },
                { label: 'Men', page: 'products' as const, params: { gender: 'men' } },
                { label: 'New Arrivals', page: 'products' as const, params: { filter: 'newArrival' } },
                { label: 'Best Sellers', page: 'products' as const, params: { filter: 'bestSeller' } },
              ].map((item) => (
                <li key={item.label}>
                  <button onClick={() => navigate(item.page, item.params)} className="text-gray-400 hover:text-[#F7C8D0] text-sm transition-colors">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-[#F7C8D0]">Customer Service</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => navigate('profile')} className="text-gray-400 hover:text-[#F7C8D0] text-sm transition-colors">My Account</button></li>
              <li><button onClick={() => navigate('orders')} className="text-gray-400 hover:text-[#F7C8D0] text-sm transition-colors">Track Order</button></li>
              <li><button onClick={() => navigate('wishlist')} className="text-gray-400 hover:text-[#F7C8D0] text-sm transition-colors">Wishlist</button></li>
              <li><button onClick={() => navigate('cart')} className="text-gray-400 hover:text-[#F7C8D0] text-sm transition-colors">Shopping Cart</button></li>
              <li><span className="text-gray-400 text-sm">Shipping Policy</span></li>
              <li><span className="text-gray-400 text-sm">Returns & Exchanges</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-[#F7C8D0]">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400 text-sm"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#D96C8A]" />42 Fashion Street, Andheri West, Mumbai 400053</li>
              <li className="flex items-center gap-2 text-gray-400 text-sm"><Phone className="h-4 w-4 shrink-0 text-[#D96C8A]" />+91 98765 43210</li>
              <li className="flex items-center gap-2 text-gray-400 text-sm"><Mail className="h-4 w-4 shrink-0 text-[#D96C8A]" />hello@stylewithher.com</li>
            </ul>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" /> Free Shipping 999+</div>
              <div className="flex items-center gap-1"><Heart className="h-3 w-3" /> Easy Returns</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>2025 StyleWithHer. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-[#F7C8D0] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#F7C8D0] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#F7C8D0] cursor-pointer">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}