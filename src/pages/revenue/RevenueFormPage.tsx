import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader as Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Partner, Setting, RevenueRecord } from '@/lib/supabase'
import { sanitizeForForm, emptyToNull } from '@/lib/form-utils'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity, notifyManagers } from '@/lib/activity'
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
  revenue_source: z.string().optional(),
  revenue_type: z.string().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  quarter: z.coerce.number().min(1).max(4).optional(),
  financial_year: z.coerce.number().optional(),
  currency: z.string().default('USD'),
  amount: z.coerce.number().min(0).default(0),
  margin: z.coerce.number().optional(),
  incentives: z.coerce.number().default(0),
  rebates: z.coerce.number().default(0),
  mdf: z.coerce.number().default(0),
  referral_commission: z.coerce.number().default(0),
  incentive_received: z.boolean().default(false),
  invoice_number: z.string().optional(),
  payment_status: z.string().default('pending'),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function RevenueFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [partners, setPartners] = useState<Partner[]>([])
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: 'USD', amount: 0, incentives: 0, rebates: 0, mdf: 0, referral_commission: 0, incentive_received: false, payment_status: 'pending', partner_id: searchParams.get('partner') ?? '', financial_year: new Date().getFullYear() }
  })

  useEffect(() => {
    fetchPartners()
    fetchSettings()
    if (isEdit) fetchRecord()
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

  async function fetchRecord() {
    setFetching(true)
    const { data, error } = await supabase.from('revenue_records').select('*').eq('id', id!).maybeSingle()
    setFetching(false)
    if (error || !data) { toast.error('Record not found'); navigate('/revenue'); return }
    reset(sanitizeForForm(data as Record<string, unknown>) as FormData)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = emptyToNull(data as Record<string, unknown>)
    let result
    if (isEdit) {
      const { data: oldRow } = await supabase.from('revenue_records').select('*').eq('id', id!).maybeSingle()
      result = await supabase.from('revenue_records').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!).select().single()
      if (!result.error && result.data) {
        await logActivity({ user, entityType: 'revenue', entityId: id!, action: 'update', description: `Updated revenue record (${result.data.currency} ${result.data.amount})`, partnerId: data.partner_id, oldValue: oldRow as Record<string, unknown>, newValue: result.data as Record<string, unknown> })
      }
    } else {
      result = await supabase.from('revenue_records').insert(payload).select().single()
      if (!result.error && result.data) {
        const r = result.data as RevenueRecord
        await logActivity({ user, entityType: 'revenue', entityId: r.id, action: 'create', description: `Created revenue record (${r.currency} ${r.amount})`, partnerId: r.partner_id, newValue: r as Record<string, unknown> })
        await notifyManagers({ title: 'New revenue record', message: `A revenue record of ${r.currency} ${r.amount.toLocaleString()} was added.`, type: 'success', link: '/revenue', partnerId: r.partner_id })
      }
    }
    setLoading(false)
    if (result.error) { toast.error(`Failed: ${result.error.message}`); return }
    toast.success(`Revenue record ${isEdit ? 'updated' : 'created'}`)
    navigate('/revenue')
  }

  if (fetching) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={isEdit ? 'Edit Revenue Record' : 'Add Revenue Record'} description="Track partner revenue and incentives">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-4" /></Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <FadeIn>
          <GlassCard className="p-0">
            <CardHeader><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Revenue Details</CardTitle></CardHeader>
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

              <div className="space-y-1.5">
                <Label>Revenue Source</Label>
                <Input className="rounded-xl focus-ring" {...register('revenue_source')} placeholder="e.g. License Sale" />
              </div>

              <div className="space-y-1.5">
                <Label>Revenue Type</Label>
                <Controller name="revenue_type" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>{(settings.revenue_type ?? []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('amount')} />
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
                <Label>Financial Year</Label>
                <Input type="number" className="rounded-xl focus-ring tabular-nums" {...register('financial_year')} />
              </div>

              <div className="space-y-1.5">
                <Label>Month</Label>
                <Controller name="month" control={control} render={({ field }) => (
                  <Select value={field.value?.toString() ?? ''} onValueChange={v => field.onChange(parseInt(v))}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Month..." /></SelectTrigger>
                    <SelectContent>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                        <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5">
                <Label>Quarter</Label>
                <Controller name="quarter" control={control} render={({ field }) => (
                  <Select value={field.value?.toString() ?? ''} onValueChange={v => field.onChange(parseInt(v))}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Quarter..." /></SelectTrigger>
                    <SelectContent>{[1,2,3,4].map(q => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-1.5"><Label>Margin (%)</Label><Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('margin')} /></div>
              <div className="space-y-1.5"><Label>Incentives</Label><Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('incentives')} /></div>
              <div className="space-y-1.5"><Label>Rebates</Label><Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('rebates')} /></div>
              <div className="space-y-1.5"><Label>MDF</Label><Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('mdf')} /></div>
              <div className="space-y-1.5"><Label>Referral Commission</Label><Input type="number" step="0.01" className="rounded-xl focus-ring tabular-nums" {...register('referral_commission')} /></div>
              <div className="space-y-1.5"><Label>Invoice Number</Label><Input className="rounded-xl focus-ring" {...register('invoice_number')} /></div>

              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Controller name="payment_status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>{['pending','paid','overdue','cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Controller name="incentive_received" control={control} render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} id="incentive_received" />
                )} />
                <Label htmlFor="incentive_received">Incentive Received</Label>
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
