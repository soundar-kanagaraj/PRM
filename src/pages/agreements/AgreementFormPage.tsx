import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Partner, Setting } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { motion } from 'framer-motion'
import { GlassCard, PageHeader, FadeIn } from '@/components/shared/premium'

const schema = z.object({
  partner_id: z.string().min(1, 'Partner is required'),
  agreement_name: z.string().min(1, 'Agreement name is required'),
  agreement_type: z.string().optional(),
  agreement_number: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  expiry_date: z.string().optional(),
  renewal_date: z.string().optional(),
  status: z.string().default('active'),
  auto_renewal: z.boolean().default(false),
  renewal_reminder_days: z.coerce.number().default(30),
  renewal_frequency: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AgreementFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [partners, setPartners] = useState<Partner[]>([])
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'active', auto_renewal: false, renewal_reminder_days: 30, partner_id: searchParams.get('partner') ?? '' }
  })

  useEffect(() => {
    fetchPartners()
    fetchSettings()
    if (isEdit) fetchAgreement()
  }, [id])

  async function fetchPartners() {
    const { data } = await supabase.from('partners').select('id, partner_name').order('partner_name')
    setPartners((data ?? []) as Partner[])
  }

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('is_active', true)
    if (data) {
      const grouped: Record<string, Setting[]> = {}
      data.forEach((s: Setting) => { if (!grouped[s.category]) grouped[s.category] = []; grouped[s.category].push(s) })
      setSettings(grouped)
    }
  }

  async function fetchAgreement() {
    setFetching(true)
    const { data, error } = await supabase.from('agreements').select('*').eq('id', id!).maybeSingle()
    setFetching(false)
    if (error || !data) { toast.error('Agreement not found'); navigate('/agreements'); return }
    reset({ ...data, start_date: data.start_date ?? '', end_date: data.end_date ?? '', expiry_date: data.expiry_date ?? '', renewal_date: data.renewal_date ?? '' })
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = { ...data }
    Object.keys(payload).forEach(k => { if ((payload as Record<string, unknown>)[k] === '') (payload as Record<string, unknown>)[k] = null })
    const { error } = isEdit
      ? await supabase.from('agreements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!)
      : await supabase.from('agreements').insert(payload)
    setLoading(false)
    if (error) { toast.error(`Failed: ${error.message}`); return }
    toast.success(`Agreement ${isEdit ? 'updated' : 'created'}`)
    navigate('/agreements')
  }

  if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={isEdit ? 'Edit Agreement' : 'New Agreement'} description="Manage partnership agreement details">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <FadeIn>
          <GlassCard className="p-0">
            <CardHeader><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Agreement Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Partner <span className="text-destructive">*</span></Label>
                <Controller name="partner_id" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.partner_id} className="rounded-xl focus-ring"><SelectValue placeholder="Select partner..." /></SelectTrigger>
                    <SelectContent>{partners.map(p => <SelectItem key={p.id} value={p.id}>{p.partner_name}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                {errors.partner_id && <p className="text-xs text-destructive">{errors.partner_id.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Agreement Name <span className="text-destructive">*</span></Label>
                <Input aria-invalid={!!errors.agreement_name} className="rounded-xl focus-ring" {...register('agreement_name')} />
                {errors.agreement_name && <p className="text-xs text-destructive">{errors.agreement_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Agreement Type</Label>
                <Controller name="agreement_type" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>{(settings.agreement_type ?? []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Agreement Number</Label>
                <Input className="rounded-xl focus-ring" {...register('agreement_number')} />
              </div>

              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" className="rounded-xl focus-ring" {...register('start_date')} />
              </div>

              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" className="rounded-xl focus-ring" {...register('end_date')} />
              </div>

              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input type="date" className="rounded-xl focus-ring" {...register('expiry_date')} />
              </div>

              <div className="space-y-1.5">
                <Label>Renewal Date</Label>
                <Input type="date" className="rounded-xl focus-ring" {...register('renewal_date')} />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['active', 'draft', 'pending', 'expired', 'terminated'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Renewal Frequency</Label>
                <Input className="rounded-xl focus-ring" {...register('renewal_frequency')} placeholder="e.g. Annual, Quarterly" />
              </div>

              <div className="space-y-1.5">
                <Label>Reminder Days Before Expiry</Label>
                <Input type="number" className="rounded-xl focus-ring tabular-nums" {...register('renewal_reminder_days')} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Controller name="auto_renewal" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="auto_renewal" />
                )} />
                <Label htmlFor="auto_renewal">Auto Renewal</Label>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Textarea className="rounded-xl focus-ring" {...register('notes')} rows={3} />
              </div>
            </CardContent>
          </GlassCard>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="flex justify-end gap-3"
        >
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading} className="rounded-xl">
            {loading ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Save className="size-4" />Save</>}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
