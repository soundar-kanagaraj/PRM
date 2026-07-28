import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader, GlassCard, StatusBadge, FadeIn } from '@/components/shared/premium'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Min 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', partnership_manager: 'Partnership Manager', viewer: 'Viewer'
}

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { full_name: profile?.full_name ?? '', title: profile?.title ?? '', department: profile?.department ?? '', phone: profile?.phone ?? '' }
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  async function onSaveProfile(data: ProfileForm) {
    setSavingProfile(true)
    const { error } = await updateProfile(data)
    setSavingProfile(false)
    if (error) toast.error('Failed to update profile')
    else toast.success('Profile updated')
  }

  async function onChangePassword(data: PasswordForm) {
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: data.new_password })
    setSavingPassword(false)
    if (error) toast.error('Failed to update password: ' + error.message)
    else { toast.success('Password updated'); passwordForm.reset() }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="My Profile" description="Manage your account settings" />

      <FadeIn>
        <GlassCard>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{profile?.full_name || 'Unnamed User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {profile?.role && (
                  <StatusBadge status={ROLE_LABELS[profile.role]} variant={profile.role === 'super_admin' ? 'active' : profile.role === 'partnership_manager' ? 'info' : 'inactive'} />
                )}
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={0.06}>
        <Card className="glass rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Personal Information</CardTitle>
            <CardDescription>Update your name and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input className="rounded-xl focus-ring" aria-invalid={!!profileForm.formState.errors.full_name} {...profileForm.register('full_name')} />
                  {profileForm.formState.errors.full_name && <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Job Title</Label>
                  <Input className="rounded-xl focus-ring" {...profileForm.register('title')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input className="rounded-xl focus-ring" {...profileForm.register('department')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input className="rounded-xl focus-ring" {...profileForm.register('phone')} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="rounded-xl" disabled={savingProfile}>
                  {savingProfile ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Save className="size-4" />Save Changes</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.12}>
        <Card className="glass rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Change Password</CardTitle>
            <CardDescription>Set a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" className="rounded-xl focus-ring" aria-invalid={!!passwordForm.formState.errors.new_password} {...passwordForm.register('new_password')} />
                {passwordForm.formState.errors.new_password && <p className="text-xs text-destructive">{passwordForm.formState.errors.new_password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" className="rounded-xl focus-ring" aria-invalid={!!passwordForm.formState.errors.confirm_password} {...passwordForm.register('confirm_password')} />
                {passwordForm.formState.errors.confirm_password && <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" className="rounded-xl" disabled={savingPassword}>
                  {savingPassword ? <><Loader2 className="size-4 animate-spin" />Updating...</> : <><Lock className="size-4" />Update Password</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
