import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader as Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Partner, Setting, Opportunity } from '@/lib/supabase'
import { sanitizeForForm, emptyToNull } from '@/lib/form-utils'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity, notifyManagers } from '@/lib/activity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { motion } from 'framer-motion'
import { GlassCard, PageHeader, FadeIn } from '@/components/shared/premium'

const schema = z.object({
  partner_id: z.string().min(1, 'Partner is required'),
  opportunity_name: z.string().min(1, 'Name is required'),
  opportunity_ref: z.string().optional(),
  customer_name: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  estimated_revenue: z.coerce.number().min(0).default(0),
  expected_close_date: z.string().optional(),
  stage: z.string().default('lead'),
  probability: z.coerce.number().min(0).max(100).default(0),
  source: z.string().optional(),
  product: z.string().optional(),
  service: z.string().optional(),
  status: z.string().default('open'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  lost_reason: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function OpportunityFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [partners, setPartners] = useState<Partner[]>([])
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { stage: 'lead', probability: 10, status: 'open', currency: 'USD', estimated_revenue: 0, partner_id: searchParams.get('partner') ?? '' }
  })

  const stage = watch('stage')
  const STAGE_PROBS: Record<string, number> = { lead: 10, qualified: 25, proposal: 50, negotiation: 75, won: 100, lost: 0, closed: 100 }

  useEffect(() => {
    fetchPartners()
    fetchSettings()
    if (isEdit) fetchOpp()
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

  async function fetchOpp() {
    setFetching(true)
    const { data, error } = await supabase.from('opportunities').select('*').eq('id', id!).maybeSingle()
    setFetching(false)
    if (error || !data) { toast.error('Opportunity not found'); navigate('/opportunities'); return }
    reset(sanitizeForForm(data as Record<string, unknown>) as FormData)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = emptyToNull(data as Record<string, unknown>)
    let result
    if (isEdit) {
      const { data: oldRow } = await supabase.from('opportunities').select('*').eq('id', id!).maybeSingle()
      result = await supabase.from('opportunities').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!).select().single()
      if (!result.error && result.data) {
        await logActivity({ user, entityType: 'opportunity', entityId: id!, action: 'update', description: `Updated opportunity "${result.data.opportunity_name}"`, partnerId: data.partner_id, oldValue: oldRow as Record<string, unknown>, newValue: result.data as Record<string, unknown> })
        if (data.stage === 'won') await notifyManagers({ title: 'Deal won!', message: `Opportunity "${result.data.opportunity_name}" was marked as won.`, type: 'success', link: '/opportunities', partnerId: data.partner_id })
      }
    } else {
      result = await supabase.from('opportunities').insert(payload).select().single()
      if (!result.error && result.data) {
        const o = result.data as Opportunity
        await logActivity({ user, entityType: 'opportunity', entityId: o.id, action: 'create', description: `Created opportunity "${o.opportunity_name}"`, partnerId: o.partner_id, newValue: o as Record<string, unknown> })
        await notifyManagers({ title: 'New opportunity created', message: `"${o.opportunity_name}" was added to the pipeline.`, type: 'info', link: '/opportunities', partnerId: o.partner_id })
      }
    }
    setLoading(false)
    if (result.error) { toast.error(`Failed: ${result.error.message}`); return }
    toast.success(`Opportunity ${isEdit ? 'updated' : 'created'}`)
    navigate('/opportunities')
  }

  if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={isEdit ? 'Edit Opportunity' : 'New Opportunity'} description="Track and manage deal details">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <FadeIn>
          <GlassCard className="p-0">
            <CardHeader><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Opportunity Details</CardTitle></CardHeader>
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
                <Label>Opportunity Name <span className="text-destructive">*</span></Label>
                <Input aria-invalid={!!errors.opportunity_name} className="rounded-xl focus-ring" {...register('opportunity_name')} />
                {errors.opportunity_name && <p className="text-xs text-destructive">{errors.opportunity_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Customer Name</Label>
                <Input className="rounded-xl focus-ring" {...register('customer_name')} />
              </div>

              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Controller name="industry" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Select industry..." /></SelectTrigger>
                    <SelectContent>{(settings.industry ?? []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input className="rounded-xl focus-ring" {...register('country')} />
              </div>

              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Controller name="stage" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={v => { field.onChange(v); setValue('probability', STAGE_PROBS[v] ?? 10) }}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'closed'].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Probability (%): <span className="font-semibold tabular-nums">{watch('probability')}%</span></Label>
                <Controller name="probability" control={control} render={({ field }) => (
                  <Slider min={0} max={100} step={5} value={[field.value]} onValueChange={v => field.onChange(v[0])} className="mt-2" />
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Estimated Revenue</Label>
                <Input type="number" className="rounded-xl focus-ring tabular-nums" {...register('estimated_revenue')} />
              </div>

              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Controller name="currency" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>{(settings.currency ?? []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Expected Close Date</Label>
                <Input type="date" className="rounded-xl focus-ring" {...register('expected_close_date')} />
              </div>

              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input className="rounded-xl focus-ring" {...register('source')} placeholder="Inbound, Referral, Events..." />
              </div>

              <div className="space-y-1.5">
                <Label>Product</Label>
                <Input className="rounded-xl focus-ring" {...register('product')} />
              </div>

              <div className="space-y-1.5">
                <Label>Service</Label>
                <Input className="rounded-xl focus-ring" {...register('service')} />
              </div>

              {(stage === 'lost') && (
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Lost Reason</Label>
                  <Input className="rounded-xl focus-ring" {...register('lost_reason')} placeholder="Reason for losing this opportunity..." />
                </div>
              )}

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
