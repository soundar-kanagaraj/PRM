import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader as Loader2, FileText, Link2, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Partner, Setting, Agreement, Document } from '@/lib/supabase'
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
import { Badge } from '@/components/ui/badge'
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
  const { user } = useAuth()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [partners, setPartners] = useState<Partner[]>([])
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})
  const [linkedDocs, setLinkedDocs] = useState<string[]>([])
  const [availableDocs, setAvailableDocs] = useState<Document[]>([])

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'active', auto_renewal: false, renewal_reminder_days: 30, partner_id: searchParams.get('partner') ?? '' }
  })

  const watchedPartner = useWatch({ control, name: 'partner_id' })

  useEffect(() => {
    fetchPartners()
    fetchSettings()
    if (isEdit) fetchAgreement()
  }, [id])

  useEffect(() => {
    if (watchedPartner) fetchAvailableDocs(watchedPartner)
    else setAvailableDocs([])
  }, [watchedPartner])

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
    reset(sanitizeForForm(data as Record<string, unknown>) as FormData)
    const { data: docs } = await supabase.from('documents').select('id').eq('agreement_id', id!)
    setLinkedDocs((docs ?? []).map(d => d.id))
    if (data.partner_id) fetchAvailableDocs(data.partner_id)
  }

  async function fetchAvailableDocs(partnerId: string) {
    const { data } = await supabase.from('documents').select('*').or(`partner_id.eq.${partnerId},partner_id.is.null`).order('created_at', { ascending: false })
    setAvailableDocs((data ?? []) as Document[])
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = emptyToNull(data as Record<string, unknown>)
    let result
    if (isEdit) {
      const { data: oldRow } = await supabase.from('agreements').select('*').eq('id', id!).maybeSingle()
      result = await supabase.from('agreements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!).select().single()
      if (!result.error && result.data) {
        await logActivity({ user, entityType: 'agreement', entityId: id!, action: 'update', description: `Updated agreement "${result.data.agreement_name}"`, partnerId: data.partner_id, oldValue: oldRow as Record<string, unknown>, newValue: result.data as Record<string, unknown> })
      }
    } else {
      result = await supabase.from('agreements').insert(payload).select().single()
      if (!result.error && result.data) {
        const a = result.data as Agreement
        await logActivity({ user, entityType: 'agreement', entityId: a.id, action: 'create', description: `Created agreement "${a.agreement_name}"`, partnerId: a.partner_id, newValue: a as Record<string, unknown> })
        await notifyManagers({ title: 'New agreement created', message: `"${a.agreement_name}" was created.`, type: 'info', link: '/agreements', partnerId: a.partner_id })
      }
    }
    if (result.error) { setLoading(false); toast.error(`Failed: ${result.error.message}`); return }
    const agreementId = isEdit ? id! : result.data.id
    await syncLinkedDocs(agreementId, data.partner_id)
    setLoading(false)
    toast.success(`Agreement ${isEdit ? 'updated' : 'created'}`)
    navigate('/agreements')
  }

  async function syncLinkedDocs(agreementId: string, partnerId: string) {
    await supabase.from('documents').update({ agreement_id: null }).eq('agreement_id', agreementId)
    if (linkedDocs.length > 0) {
      await supabase.from('documents').update({ agreement_id: agreementId, partner_id: partnerId }).in('id', linkedDocs)
    }
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

        {/* Linked Documents */}
        <FadeIn delay={0.05}>
          <GlassCard className="p-0">
            <CardHeader><CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>Linked Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {linkedDocs.length > 0 && (
                <div className="space-y-2">
                  {linkedDocs.map(docId => {
                    const doc = availableDocs.find(d => d.id === docId)
                    return (
                      <div key={docId} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-muted/20">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">{doc?.name ?? 'Unknown document'}</span>
                        {doc?.doc_type && <Badge variant="outline" className="text-xs">{doc.doc_type}</Badge>}
                        <Button type="button" variant="ghost" size="icon" className="size-7 rounded-lg text-destructive" onClick={() => setLinkedDocs(prev => prev.filter(id => id !== docId))}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              {availableDocs.filter(d => !linkedDocs.includes(d.id)).length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Available documents</Label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {availableDocs.filter(d => !linkedDocs.includes(d.id)).map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setLinkedDocs(prev => [...prev, doc.id])}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors text-left group"
                      >
                        <Link2 className="size-4 text-muted-foreground group-hover:text-primary shrink-0" />
                        <span className="text-sm flex-1 truncate">{doc.name}</span>
                        {doc.doc_type && <Badge variant="secondary" className="text-xs">{doc.doc_type}</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {availableDocs.length === 0 && linkedDocs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Select a partner to see available documents, or add documents from the Document Library.</p>
              )}
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
