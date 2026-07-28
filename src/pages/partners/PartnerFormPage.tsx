import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Setting } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlassCard, FadeIn, PremiumSkeleton } from '@/components/shared/premium'


const schema = z.object({
  partner_name: z.string().min(1, 'Partner name is required'),
  legal_name: z.string().optional(),
  registration_number: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  tier: z.string().optional(),
  partner_type: z.string().optional(),
  status: z.string().default('active'),
  primary_contact: z.string().optional(),
  secondary_contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  territory: z.string().optional(),
  business_region: z.string().optional(),
  technology_focus: z.string().optional(),
  distributor: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  internal_comments: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function PartnerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'active' }
  })

  useEffect(() => {
    fetchSettings()
    if (isEdit) fetchPartner()
  }, [id])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('is_active', true).order('sort_order')
    if (data) {
      const grouped: Record<string, Setting[]> = {}
      data.forEach((s: Setting) => {
        if (!grouped[s.category]) grouped[s.category] = []
        grouped[s.category].push(s)
      })
      setSettings(grouped)
    }
  }

  async function fetchPartner() {
    setFetching(true)
    const { data, error } = await supabase.from('partners').select('*').eq('id', id!).maybeSingle()
    setFetching(false)
    if (error || !data) { toast.error('Partner not found'); navigate('/partners'); return }
    reset(data)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = { ...data }
    Object.keys(payload).forEach(k => {
      const key = k as keyof typeof payload
      if (payload[key] === '' || payload[key] === undefined) (payload as Record<string, unknown>)[k] = null
    })

    const { error } = isEdit
      ? await supabase.from('partners').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!)
      : await supabase.from('partners').insert(payload)

    setLoading(false)
    if (error) { toast.error(`Failed to ${isEdit ? 'update' : 'create'} partner: ${error.message}`); return }
    toast.success(`Partner ${isEdit ? 'updated' : 'created'} successfully`)
    navigate('/partners')
  }

  const F = ({ label, name, type = 'text', required = false }: { label: string; name: keyof FormData; type?: string; required?: boolean }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input id={name} type={type} className="rounded-xl focus-ring" aria-invalid={!!errors[name]} {...register(name as any)} />
      {errors[name] && <p className="text-xs text-destructive">{(errors[name] as { message?: string })?.message}</p>}
    </div>
  )

  const SField = ({ label, name, options }: { label: string; name: keyof FormData; options: { value: string; label: string }[] }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Controller name={name} control={control} render={({ field }) => (
        <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
          <SelectTrigger className="rounded-xl focus-ring" aria-invalid={!!errors[name]}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      )} />
    </div>
  )

  if (fetching) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <PremiumSkeleton className="size-9 rounded-xl" />
        <div className="space-y-2">
          <PremiumSkeleton className="h-6 w-48" />
          <PremiumSkeleton className="h-4 w-64" />
        </div>
      </div>
      <PremiumSkeleton className="h-96 w-full rounded-2xl" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
          <div>
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{isEdit ? 'Edit Partner' : 'Add New Partner'}</h2>
            <p className="text-sm text-muted-foreground">{isEdit ? 'Update partner information' : 'Create a new partner record'}</p>
          </div>
        </div>
      </FadeIn>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-4"><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Basic Information</CardTitle></CardHeader>
                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Partner Name" name="partner_name" required />
                  <F label="Legal Company Name" name="legal_name" />
                  <F label="Business Registration Number" name="registration_number" />
                  <F label="Website" name="website" type="url" />
                  <SField label="Industry" name="industry" options={(settings.industry ?? []).map(s => ({ value: s.value, label: s.label }))} />
                  <SField label="Partner Category" name="category" options={(settings.partner_category ?? []).map(s => ({ value: s.value, label: s.label }))} />
                  <SField label="Partner Tier" name="tier" options={(settings.partner_tier ?? []).map(s => ({ value: s.value, label: s.label }))} />
                  <SField label="Partner Type" name="partner_type" options={(settings.partner_type ?? []).map(s => ({ value: s.value, label: s.label }))} />
                  <SField label="Status" name="status" options={[
                    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
                    { value: 'prospect', label: 'Prospect' }, { value: 'suspended', label: 'Suspended' }
                  ]} />
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabsContent>

          <TabsContent value="contact">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-4"><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Contact Information</CardTitle></CardHeader>
                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Primary Contact" name="primary_contact" />
                  <F label="Secondary Contact" name="secondary_contact" />
                  <F label="Email" name="email" type="email" />
                  <F label="Phone" name="phone" />
                  <F label="Mobile" name="mobile" />
                  <div className="sm:col-span-2"><F label="Address" name="address" /></div>
                  <F label="Country" name="country" />
                  <F label="State / Province" name="state" />
                  <F label="City" name="city" />
                  <F label="Postal Code" name="postal_code" />
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabsContent>

          <TabsContent value="business">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-4"><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Business Details</CardTitle></CardHeader>
                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Territory" name="territory" />
                  <SField label="Business Region" name="business_region" options={(settings.region ?? []).map(s => ({ value: s.value, label: s.label }))} />
                  <F label="Technology Focus" name="technology_focus" />
                  <F label="Distributor" name="distributor" />
                  <F label="Vendor" name="vendor" />
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabsContent>

          <TabsContent value="internal">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-4"><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Internal Details</CardTitle></CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Notes</Label>
                    <Textarea {...register('notes')} rows={4} className="rounded-xl focus-ring" placeholder="Partnership notes..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Internal Comments</Label>
                    <Textarea {...register('internal_comments')} rows={4} className="rounded-xl focus-ring" placeholder="Internal team comments (not visible to partner)..." />
                  </div>
                </CardContent>
              </GlassCard>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Save className="size-4" />Save Partner</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
