import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/shared/premium'

const schema = z.object({ email: z.string().email('Invalid email address') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error('Failed to send reset email. Please try again.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <FadeIn>
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center size-14 rounded-xl bg-primary mb-4 shadow-lg">
              <Building2 className="size-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>PartnerHub PRM</h1>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="glass rounded-2xl shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>Reset your password</CardTitle>
              <CardDescription>
                {sent ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sent ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@company.com" className="pl-10 rounded-xl focus-ring" aria-invalid={!!errors.email} {...register('email')} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              ) : (
                <div className="py-4 text-center">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Mail className="size-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">A password reset link has been sent to your email address.</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link to="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
