import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Required') })
const signupSchema = z.object({ full_name: z.string().min(1, 'Name required'), email: z.string().email('Invalid email'), password: z.string().min(8, 'Min 8 characters') })
type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) as any })
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) as any })

  async function onLogin(data: LoginForm) {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)
    if (error) toast.error('Invalid email or password.')
  }

  async function onSignup(data: SignupForm) {
    setSignupLoading(true)
    const { data: signupData, error } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { full_name: data.full_name, role: 'super_admin' } }
    })
    if (error) { toast.error(error.message); setSignupLoading(false); return }
    if (signupData?.session) { toast.success('Account created!'); setSignupLoading(false); return }
    const { error: signInError } = await signIn(data.email, data.password)
    setSignupLoading(false)
    if (signInError) toast.success('Account created! Please sign in.')
    else toast.success('Account created and signed in!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-mesh relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 size-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, var(--primary), transparent)' }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 size-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.20 290), transparent)' }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-center size-14 rounded-2xl btn-gradient shadow-xl mb-4"
          >
            <Building2 className="size-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient" style={{ fontFamily: 'var(--font-display)' }}>PartnerHub PRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Partnership Management</p>
        </div>

        <Card className="glass rounded-2xl shadow-2xl border-border/30 overflow-hidden">
          <Tabs defaultValue="login">
            <div className="px-6 pt-6">
              <TabsList className="w-full rounded-xl">
                <TabsTrigger value="login" className="rounded-lg flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg flex-1">Create Account</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login" className="p-6 pt-4 m-0">
              <form onSubmit={loginForm.handleSubmit(onLogin as any)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="email" placeholder="you@company.com" className="pl-10 rounded-xl focus-ring" {...loginForm.register('email')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 rounded-xl focus-ring" {...loginForm.register('password')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <AnimatePresence mode="wait">
                        <motion.div key={showPassword ? 'off' : 'on'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline underline-offset-4">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full btn-gradient text-white rounded-xl h-10" disabled={loading}>
                  {loading ? (
                    <motion.span className="size-4 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                  ) : (
                    <>Sign in <ArrowRight className="size-4 ml-1" /></>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="p-6 pt-4 m-0">
              <form onSubmit={signupForm.handleSubmit(onSignup as any)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="text" placeholder="John Smith" className="pl-10 rounded-xl focus-ring" {...signupForm.register('full_name')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="email" placeholder="you@company.com" className="pl-10 rounded-xl focus-ring" {...signupForm.register('email')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="password" placeholder="Min 8 characters" className="pl-10 rounded-xl focus-ring" {...signupForm.register('password')} />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-gradient text-white rounded-xl h-10" disabled={signupLoading}>
                  {signupLoading ? (
                    <motion.span className="size-4 rounded-full border-2 border-white/30 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                  ) : (
                    <>Create Account <ArrowRight className="size-4 ml-1" /></>
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-4 px-6 pb-4">
                First account created becomes Super Admin
              </p>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  )
}
