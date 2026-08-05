import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard as Edit, Building2, Mail, Phone, Globe, MapPin, FileText, TrendingUp, DollarSign, Plus, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Partner, Agreement, Opportunity, RevenueRecord, Activity, Document } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GlassCard, StatCard, StatusBadge, FadeIn, EmptyState, PremiumSkeleton
} from '@/components/shared/premium'

const STATUS_VARIANTS: Record<string, 'active' | 'inactive' | 'pending' | 'warning' | 'danger' | 'info' | 'success'> = {
  active: 'active',
  inactive: 'inactive',
  prospect: 'info',
  suspended: 'danger',
  expired: 'danger',
  paid: 'success',
  overdue: 'danger',
  pending: 'pending',
  draft: 'warning',
  terminated: 'inactive',
}

const STAGE_VARIANTS: Record<string, 'active' | 'inactive' | 'pending' | 'warning' | 'danger' | 'info' | 'success'> = {
  lead: 'inactive',
  qualified: 'info',
  proposal: 'info',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
  closed: 'inactive',
}

export default function PartnerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [revenues, setRevenues] = useState<RevenueRecord[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const [pRes, aRes, oRes, rRes, acRes, dRes] = await Promise.all([
      supabase.from('partners').select('*').eq('id', id!).maybeSingle(),
      supabase.from('agreements').select('*').eq('partner_id', id!).order('created_at', { ascending: false }),
      supabase.from('opportunities').select('*').eq('partner_id', id!).order('created_at', { ascending: false }),
      supabase.from('revenue_records').select('*').eq('partner_id', id!).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('partner_id', id!).order('created_at', { ascending: false }).limit(20),
      supabase.from('documents').select('*').eq('partner_id', id!).order('created_at', { ascending: false }),
    ])
    setLoading(false)
    if (!pRes.data) { toast.error('Partner not found'); navigate('/partners'); return }
    setPartner(pRes.data as Partner)
    setAgreements((aRes.data ?? []) as Agreement[])
    setOpportunities((oRes.data ?? []) as Opportunity[])
    setRevenues((rRes.data ?? []) as RevenueRecord[])
    setActivities((acRes.data ?? []) as Activity[])
    setDocuments((dRes.data ?? []) as Document[])
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4"><PremiumSkeleton className="size-9 rounded-xl" /><div className="space-y-2"><PremiumSkeleton className="h-6 w-48" /><PremiumSkeleton className="h-4 w-64" /></div></div>
      <PremiumSkeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
  if (!partner) return null

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0)
  const activeAgreements = agreements.filter(a => a.status === 'active').length
  const openOpps = opportunities.filter(o => !['won', 'lost', 'closed'].includes(o.stage)).length

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <FadeIn>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/partners')}><ArrowLeft className="size-4" /></Button>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{partner.partner_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={partner.status} variant={STATUS_VARIANTS[partner.status] ?? 'info'} />
                  {partner.tier && <Badge variant="outline" className="text-xs rounded-lg">{partner.tier}</Badge>}
                  {partner.partner_type && <Badge variant="secondary" className="text-xs rounded-lg">{partner.partner_type}</Badge>}
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={`/partners/${id}/edit`}><Edit className="size-4" />Edit Partner</Link>
            </Button>
          )}
        </div>
      </FadeIn>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={totalRevenue / 1000} format={(n) => `$${n.toFixed(1)}K`} icon={DollarSign} color="success" delay={0} />
        <StatCard title="Active Agreements" value={activeAgreements} icon={FileText} color="primary" delay={0.05} />
        <StatCard title="Open Opportunities" value={openOpps} icon={TrendingUp} color="warning" delay={0.1} />
        <StatCard title="Total Deals" value={opportunities.length} icon={TrendingUp} color="accent" delay={0.15} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agreements">Agreements ({agreements.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="revenue">Revenue ({revenues.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FadeIn delay={0.05}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-3"><CardTitle className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>Contact Information</CardTitle></CardHeader>
                <CardContent className="p-0 space-y-3">
                  {partner.email && <div className="flex items-center gap-2 text-sm"><Mail className="size-4 text-muted-foreground" /><span>{partner.email}</span></div>}
                  {partner.phone && <div className="flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground" /><span>{partner.phone}</span></div>}
                  {partner.website && <div className="flex items-center gap-2 text-sm"><Globe className="size-4 text-muted-foreground" /><a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{partner.website}</a></div>}
                  {(partner.city || partner.country) && <div className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" /><span>{[partner.city, partner.state, partner.country].filter(Boolean).join(', ')}</span></div>}
                  {partner.primary_contact && <div className="text-sm"><span className="text-muted-foreground">Primary: </span>{partner.primary_contact}</div>}
                  {partner.secondary_contact && <div className="text-sm"><span className="text-muted-foreground">Secondary: </span>{partner.secondary_contact}</div>}
                </CardContent>
              </GlassCard>
            </FadeIn>
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-3"><CardTitle className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>Business Details</CardTitle></CardHeader>
                <CardContent className="p-0 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Industry', value: partner.industry },
                    { label: 'Category', value: partner.category },
                    { label: 'Territory', value: partner.territory },
                    { label: 'Region', value: partner.business_region },
                    { label: 'Tech Focus', value: partner.technology_focus },
                    { label: 'Distributor', value: partner.distributor },
                  ].map(f => f.value && (
                    <div key={f.label}>
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium">{f.value}</p>
                    </div>
                  ))}
                </CardContent>
              </GlassCard>
            </FadeIn>
          </div>
          {partner.notes && (
            <FadeIn delay={0.15}>
              <GlassCard className="p-6">
                <CardHeader className="p-0 pb-3"><CardTitle className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>Notes</CardTitle></CardHeader>
                <CardContent className="p-0"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{partner.notes}</p></CardContent>
              </GlassCard>
            </FadeIn>
          )}
        </TabsContent>

        <TabsContent value="agreements" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{agreements.length} agreement(s)</p>
            {canEdit && <Button size="sm" className="rounded-xl" asChild><Link to={`/agreements/new?partner=${id}`}><Plus className="size-3" />Add Agreement</Link></Button>}
          </div>
          <div className="space-y-3">
            {agreements.length === 0 ? (
              <GlassCard className="p-6"><EmptyState icon={FileText} title="No agreements yet" description="Agreements will appear here once created." /></GlassCard>
            ) : agreements.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <GlassCard className="p-5">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{a.agreement_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.agreement_type} {a.agreement_number ? `• #${a.agreement_number}` : ''}</p>
                      </div>
                      <StatusBadge status={a.status} variant={STATUS_VARIANTS[a.status] ?? 'inactive'} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {a.start_date && <span>Start: {format(new Date(a.start_date), 'MMM d, yyyy')}</span>}
                      {a.expiry_date && <span>Expires: {format(new Date(a.expiry_date), 'MMM d, yyyy')}</span>}
                      {a.auto_renewal && <Badge variant="secondary" className="text-xs rounded-lg">Auto-renewal</Badge>}
                    </div>
                  </CardContent>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{opportunities.length} opportunit(ies)</p>
            {canEdit && <Button size="sm" className="rounded-xl" asChild><Link to={`/opportunities/new?partner=${id}`}><Plus className="size-3" />Add Opportunity</Link></Button>}
          </div>
          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <GlassCard className="p-6"><EmptyState icon={TrendingUp} title="No opportunities yet" description="Opportunities will appear here once created." /></GlassCard>
            ) : opportunities.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <GlassCard className="p-5">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{o.opportunity_name}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={o.stage} variant={STAGE_VARIANTS[o.stage] ?? 'info'} />
                        <p className="text-sm font-semibold mt-1 tabular-nums">${o.estimated_revenue?.toLocaleString()}</p>
                      </div>
                    </div>
                    {o.expected_close_date && <p className="text-xs text-muted-foreground mt-1">Close: {format(new Date(o.expected_close_date), 'MMM d, yyyy')}</p>}
                  </CardContent>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">Total: <strong className="tabular-nums">${totalRevenue.toLocaleString()}</strong></p>
            {canEdit && <Button size="sm" className="rounded-xl" asChild><Link to={`/revenue/new?partner=${id}`}><Plus className="size-3" />Add Revenue</Link></Button>}
          </div>
          <div className="space-y-3">
            {revenues.length === 0 ? (
              <GlassCard className="p-6"><EmptyState icon={DollarSign} title="No revenue records yet" description="Revenue records will appear here once created." /></GlassCard>
            ) : revenues.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <GlassCard className="p-5">
                  <CardContent className="p-0 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{r.revenue_type ?? 'Revenue'}</p>
                      <p className="text-xs text-muted-foreground">{r.revenue_source} {r.financial_year ? `• FY${r.financial_year}` : ''} {r.month ? `Q${r.quarter}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{r.currency} {r.amount.toLocaleString()}</p>
                      <StatusBadge status={r.payment_status} variant={STATUS_VARIANTS[r.payment_status] ?? 'inactive'} />
                    </div>
                  </CardContent>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{documents.length} document(s)</p>
            {canEdit && <Button size="sm" className="rounded-xl" asChild><Link to="/documents"><Plus className="size-3" />Add Document</Link></Button>}
          </div>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <GlassCard className="p-6"><EmptyState icon={FileText} title="No documents yet" description="Documents will appear here once uploaded." /></GlassCard>
            ) : documents.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <GlassCard className="p-5">
                  <CardContent className="p-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.doc_type ?? 'Document'} {d.category ? `• ${d.category}` : ''}</p>
                      </div>
                    </div>
                    {d.file_url && (
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg" asChild>
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /></a>
                      </Button>
                    )}
                  </CardContent>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <FadeIn>
            <GlassCard className="p-6">
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <EmptyState icon={FileText} title="No activity recorded" description="Activity will appear here once recorded." />
                ) : (
                  <div className="space-y-4">
                    {activities.map(act => (
                      <div key={act.id} className="flex gap-3">
                        <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div>
                          <p className="text-sm">{act.description ?? `${act.action} on ${act.entity_type}`}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(act.created_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  )
}
