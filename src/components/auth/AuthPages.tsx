'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/use-store'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { User, Mail, Lock, Phone, MapPin, Trash2, Plus, ArrowLeft, Eye, EyeOff, Save } from 'lucide-react'
import type { AddressData } from '@/store/use-store'
import { Skeleton } from '@/components/ui/skeleton'

import { useTranslation } from '@/i18n/use-language'
// ─── Zod Schemas ────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
})

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(5, 'Valid pincode required'),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>
type ForgotFormData = z.infer<typeof forgotSchema>
type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type AddressFormData = z.infer<typeof addressSchema>

// ─── Brand Split Layout Helper ──────────────────────────────────────────────

function BrandSide({ tagline }: { tagline: string }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0B1F3A] text-white flex-col items-center justify-center p-12 rounded-l-2xl relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-[#F7C8D0]" />
        <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-[#D96C8A]" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-[#F7C8D0]" />
      </div>
      <div className="relative z-10 text-center max-w-sm">
        <div className="text-4xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          Style<span className="text-[#F7C8D0]">With</span>Her
        </div>
        <p className="text-[#F7C8D0] text-lg leading-relaxed">{tagline}</p>
        <div className="mt-8 w-16 h-0.5 bg-[#D96C8A] mx-auto" />
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-[#0B1F3A] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Login Page ─────────────────────────────────────────────────────────────

export function LoginPage() {
  const { t } = useTranslation()
  const { setUser, navigate, showToast } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...data }),
      })
      const result = await res.json()
      if (!res.ok) {
        showToast(result.error || 'Login failed', 'error')
        return
      }
      setUser({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        token: result.token,
      })
      showToast('Welcome back!')
      navigate('home')
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-4xl overflow-hidden border-0 shadow-2xl">
        <div className="flex flex-col lg:flex-row">
          <BrandSide tagline="Discover your signature style with curated fashion essentials." />

          <div className="w-full lg:w-1/2 p-6 sm:p-10">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#222222]">Welcome Back</CardTitle>
              <CardDescription className="text-gray-500">Sign in to your account</CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#222222] font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#222222] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('forgot-password')}
                    className="text-sm text-[#D96C8A] hover:text-[#D96C8A]/80 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg"
                >
                  {loading ? <LoadingSpinner /> : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 p-3 bg-[#FFF5F7] rounded-lg">
                <p className="text-xs text-center text-gray-600">
                  Demo: <span className="font-mono font-semibold text-[#0B1F3A]">demo@stylewithher.com</span> / <span className="font-mono font-semibold text-[#0B1F3A]">User@123</span>
                </p>
              </div>

              <Separator className="my-6" />

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => navigate('signup')}
                  className="text-[#D96C8A] hover:text-[#D96C8A]/80 font-semibold"
                >
                  Create one
                </button>
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </section>
  )
}

// ─── Signup Page ────────────────────────────────────────────────────────────

export function SignupPage() {
  const { setUser, navigate, showToast } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name: data.name, email: data.email, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) {
        showToast(result.error || 'Signup failed', 'error')
        return
      }
      setUser({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        token: result.token,
      })
      showToast('Account created successfully!')
      navigate('home')
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-4xl overflow-hidden border-0 shadow-2xl">
        <div className="flex flex-col lg:flex-row">
          <BrandSide tagline="Join our community of fashion-forward women." />

          <div className="w-full lg:w-1/2 p-6 sm:p-10">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-[#222222]">Create Account</CardTitle>
              <CardDescription className="text-gray-500">Start your style journey today</CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-[#222222] font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      placeholder="Your full name"
                      className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[#222222] font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[#222222] font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-[#222222] font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg mt-2"
                >
                  {loading ? <LoadingSpinner /> : 'Create Account'}
                </Button>
              </form>

              <Separator className="my-6" />

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('login')}
                  className="text-[#D96C8A] hover:text-[#D96C8A]/80 font-semibold"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </div>
        </div>
      </Card>
    </section>
  )
}

// ─── Forgot Password Page ───────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const { navigate, showToast } = useStore()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!res.ok) {
        throw new Error('Failed to send reset link')
      }

      setSent(true)
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#FFF5F7] flex items-center justify-center mb-4">
            <Lock className="h-7 w-7 text-[#D96C8A]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#222222]">Forgot Password?</CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            {sent ? 'Check your email for reset instructions' : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">If an account exists with this email, a reset link has been sent.</p>
              </div>
              <Button
                onClick={() => navigate('login')}
                variant="outline"
                className="border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[#222222] font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-medium rounded-lg"
                >
                  {loading ? <LoadingSpinner /> : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('login')}
                  className="text-sm text-[#D96C8A] hover:text-[#D96C8A]/80 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Profile Page ───────────────────────────────────────────────────────────

interface ProfileUserData {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  avatar?: string | null
}

export function ProfilePage() {
  const { user, isAuthenticated, navigate, setUser, showToast } = useStore()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileUserData | null>(null)
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [addressLoading, setAddressLoading] = useState(true)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null)

  // Profile form
  const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) })
  // Password form
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })
  // Address form
  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefault: false,
    },
  })

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('login')
      return
    }
    fetchProfile()
    fetchAddresses()
  }, [isAuthenticated, user])

  const fetchProfile = async () => {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setProfileData(data.user)
          profileForm.reset({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          })
        } else {
          // Fallback: use store data
          setProfileData({
            id: user!.userId,
            name: user!.email.split('@')[0],
            email: user!.email,
            role: user!.role,
          })
          profileForm.reset({
            name: user!.email.split('@')[0],
            email: user!.email,
            phone: '',
          })
        }
      } else {
        // Fallback: use store data
        setProfileData({
          id: user!.userId,
          name: user!.email.split('@')[0],
          email: user!.email,
          role: user!.role,
        })
        profileForm.reset({
          name: user!.email.split('@')[0],
          email: user!.email,
          phone: '',
        })
      }
    } catch {
      setProfileData({
        id: user!.userId,
        name: user!.email.split('@')[0],
        email: user!.email,
        role: user!.role,
      })
      profileForm.reset({
        name: user!.email.split('@')[0],
        email: user!.email,
        phone: '',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchAddresses = async () => {
    setAddressLoading(true)
    try {
      const res = await fetch('/api/addresses', {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch {
      showToast('Failed to load addresses', 'error')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleProfileSave = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, phone: data.phone || '' }),
      })
      const result = await res.json()
      if (res.ok) {
        showToast('Profile updated successfully!')
        setProfileData((prev) => prev ? { ...prev, name: data.name, phone: data.phone } : prev)
      } else {
        showToast(result.error || 'Failed to update profile', 'error')
      }
    } catch {
      showToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (data: PasswordFormData) => {
    setSavingPassword(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: data.oldPassword, newPassword: data.newPassword }),
      })
      const result = await res.json()
      if (res.ok) {
        showToast('Password changed successfully!')
        passwordForm.reset()
      } else {
        showToast(result.error || 'Failed to change password', 'error')
      }
    } catch {
      showToast('Failed to change password', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  const openAddressDialog = (address?: AddressData) => {
    if (address) {
      setEditingAddress(address)
      addressForm.reset({
        label: address.label || '',
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        isDefault: address.isDefault,
      })
    } else {
      setEditingAddress(null)
      addressForm.reset({
        label: '',
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false,
      })
    }
    setAddressDialogOpen(true)
  }

  const handleAddressSave = async (data: AddressFormData) => {
    setSavingAddress(true)
    try {
      const payload = {
        ...data,
        isDefault: data.isDefault || false,
        country: data.country || 'India',
      }

      const isEdit = !!editingAddress
      const res = await fetch('/api/addresses', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { addressId: editingAddress.id, ...payload } : payload),
      })
      const result = await res.json()
      if (res.ok) {
        showToast(isEdit ? 'Address updated!' : 'Address added!')
        setAddressDialogOpen(false)
        fetchAddresses()
      } else {
        showToast(result.error || 'Failed to save address', 'error')
      }
    } catch {
      showToast('Failed to save address', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingAddress(addressId)
    try {
      const res = await fetch(`/api/addresses?addressId=${addressId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      if (res.ok) {
        showToast('Address deleted')
        fetchAddresses()
      } else {
        showToast('Failed to delete address', 'error')
      }
    } catch {
      showToast('Failed to delete address', 'error')
    } finally {
      setDeletingAddress(null)
    }
  }

  if (profileLoading) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('home')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#222222]" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full bg-gray-100 p-1">
              <TabsTrigger value="personal" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="h-4 w-4 mr-2" /> Personal Info
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Lock className="h-4 w-4 mr-2" /> Password
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card className="border-0 shadow-sm mt-4">
                <CardHeader>
                  <CardTitle className="text-lg text-[#222222]">Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name" className="text-[#222222] font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="profile-name"
                          className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...profileForm.register('name')}
                        />
                      </div>
                      {profileForm.formState.errors.name && (
                        <p className="text-red-500 text-xs">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-email" className="text-[#222222] font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="profile-email"
                          className="pl-10 h-11 border-gray-200 bg-gray-50"
                          disabled
                          {...profileForm.register('email')}
                        />
                      </div>
                      <p className="text-xs text-gray-400">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-phone" className="text-[#222222] font-medium">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="profile-phone"
                          placeholder="Your phone number"
                          className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...profileForm.register('phone')}
                        />
                      </div>
                      {profileForm.formState.errors.phone && (
                        <p className="text-red-500 text-xs">{profileForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white h-11 px-6"
                    >
                      {saving ? <LoadingSpinner /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card className="border-0 shadow-sm mt-4">
                <CardHeader>
                  <CardTitle className="text-lg text-[#222222]">Change Password</CardTitle>
                  <CardDescription>Ensure your account stays secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="old-password" className="text-[#222222] font-medium">Current Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="old-password"
                          type="password"
                          className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...passwordForm.register('oldPassword')}
                        />
                      </div>
                      {passwordForm.formState.errors.oldPassword && (
                        <p className="text-red-500 text-xs">{passwordForm.formState.errors.oldPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-[#222222] font-medium">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="At least 6 characters"
                          className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...passwordForm.register('newPassword')}
                        />
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-red-500 text-xs">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password" className="text-[#222222] font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirm-new-password"
                          type="password"
                          placeholder="Confirm new password"
                          className="pl-10 h-11 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...passwordForm.register('confirmPassword')}
                        />
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-xs">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={savingPassword}
                      className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white h-11 px-6"
                    >
                      {savingPassword ? <LoadingSpinner /> : <><Save className="h-4 w-4 mr-2" /> Update Password</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Address Management */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#222222] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#D96C8A]" /> Addresses
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">Manage delivery addresses</CardDescription>
                </div>
                <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-[#D96C8A] hover:bg-[#D96C8A]/90 text-white h-9 px-3"
                      onClick={() => openAddressDialog()}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-[#222222]">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addressForm.handleSubmit(handleAddressSave)} className="space-y-4 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <Label className="text-sm font-medium text-[#222222]">Label</Label>
                          <Input
                            placeholder="Home, Office, etc."
                            className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                            {...addressForm.register('label')}
                          />
                        </div>
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                          <Label className="text-sm font-medium text-[#222222]">Full Name *</Label>
                          <Input
                            placeholder="Recipient name"
                            className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                            {...addressForm.register('fullName')}
                          />
                          {addressForm.formState.errors.fullName && (
                            <p className="text-red-500 text-xs">{addressForm.formState.errors.fullName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#222222]">Phone *</Label>
                        <Input
                          placeholder="Phone number"
                          className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...addressForm.register('phone')}
                        />
                        {addressForm.formState.errors.phone && (
                          <p className="text-red-500 text-xs">{addressForm.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#222222]">Address Line 1 *</Label>
                        <Input
                          placeholder="House no, Street, Area"
                          className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...addressForm.register('addressLine1')}
                        />
                        {addressForm.formState.errors.addressLine1 && (
                          <p className="text-red-500 text-xs">{addressForm.formState.errors.addressLine1.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#222222]">Address Line 2</Label>
                        <Input
                          placeholder="Landmark, etc. (optional)"
                          className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                          {...addressForm.register('addressLine2')}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[#222222]">City *</Label>
                          <Input
                            placeholder="City"
                            className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                            {...addressForm.register('city')}
                          />
                          {addressForm.formState.errors.city && (
                            <p className="text-red-500 text-xs">{addressForm.formState.errors.city.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[#222222]">State *</Label>
                          <Input
                            placeholder="State"
                            className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                            {...addressForm.register('state')}
                          />
                          {addressForm.formState.errors.state && (
                            <p className="text-red-500 text-xs">{addressForm.formState.errors.state.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-[#222222]">Pincode *</Label>
                          <Input
                            placeholder="Pincode"
                            className="h-10 border-gray-200 focus:border-[#D96C8A] focus:ring-[#D96C8A]/20"
                            {...addressForm.register('pincode')}
                          />
                          {addressForm.formState.errors.pincode && (
                            <p className="text-red-500 text-xs">{addressForm.formState.errors.pincode.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="address-default"
                          className="rounded border-gray-300 text-[#D96C8A] focus:ring-[#D96C8A]"
                          {...addressForm.register('isDefault')}
                        />
                        <Label htmlFor="address-default" className="text-sm text-gray-600 cursor-pointer">
                          Set as default address
                        </Label>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAddressDialogOpen(false)}
                          className="flex-1 h-11 border-gray-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={savingAddress}
                          className="flex-1 h-11 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white"
                        >
                          {savingAddress ? <LoadingSpinner /> : <><Save className="h-4 w-4 mr-2" /> {editingAddress ? 'Update' : 'Save'}</>}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {addressLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No saved addresses</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-[#D96C8A] text-[#D96C8A] hover:bg-[#D96C8A] hover:text-white"
                    onClick={() => openAddressDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-lg border border-gray-100 hover:border-[#D96C8A]/30 transition-colors relative group"
                    >
                      {addr.isDefault && (
                        <Badge className="absolute top-2 right-2 bg-[#D96C8A] text-white text-[10px] px-2 py-0.5">
                          Default
                        </Badge>
                      )}
                      {addr.label && (
                        <p className="text-xs font-semibold text-[#D96C8A] uppercase tracking-wider mb-1">{addr.label}</p>
                      )}
                      <p className="text-sm font-medium text-[#222222]">{addr.fullName}</p>
                      <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                      <p className="text-sm text-gray-500 mt-1">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{addr.phone}</p>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-gray-200 hover:border-[#0B1F3A] hover:text-[#0B1F3A]"
                          onClick={() => openAddressDialog(addr)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                          disabled={deletingAddress === addr.id}
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          {deletingAddress === addr.id ? (
                            <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Trash2 className="h-3 w-3 mr-1" /> Remove</>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}