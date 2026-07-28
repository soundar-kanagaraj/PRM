import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, TrendingUp, DollarSign, Trophy,
  AlertTriangle, Clock, ArrowUpRight, Users, Target, CheckSquare, Sparkles, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip, Area, AreaChart,
} from 'recharts'
import { format, addDays, isAfter, isBefore } from 'date-fns'
import {
  GlassCard, StatCard, StatusBadge, FadeIn, StaggerContainer, StaggerItem,
  EmptyState, PremiumSkeleton, AnimatedCounter,
} from '@/components/shared/premium'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

type Stats = {
  totalPartners: number; activePartners: number; expiredAgreements: number; expiringSoon: number
  totalOpportunities: number; wonOpportunities: number; lostOpportunities: number
  pipelineValue: number; totalRevenue: number; pendingTasks: number
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

// Generate mock sparkline data for demo
function genSpark(base: number, variance: number) {
  return Array.from({ length: 12 }, (_, i) =>
    Math.max(0, base + Math.sin(i * 0.7) * variance + (Math.random() - 0.5) * variance * 0.6)
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPartners: 0, activePartners: 0, expiredAgreements: 0, expiringSoon: 0,
    totalOpportunities: 0, wonOpportunities: 0, lostOpportunities: 0, pipelineValue: 0,
    totalRevenue: 0, pendingTasks: 0,
  })
  const [recentPartners, setRecentPartners] = useState<Array<{ id: string; partner_name: string; status: string; partner_type: string | null; created_at: string }>>([])
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{ id: string; agreement_name: string; expiry_date: string; partners: { partner_name: string } | null }>>([])
  const [recentActivities, setRecentActivities] = useState<Array<{ id: string; description: string | null; action: string; created_at: string; entity_type: string }>>([])
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([])
  const [stageData, setStageData] = useState<Array<{ stage: string; count: number; value: number }>>([])
  const [partnerTypeData, setPartnerTypeData] = useState<Array<{ name: string; value: number }>>([])
  const [topPartners, setTopPartners] = useState<Array<{ id: string; partner_name: string; partner_type: string | null; revenue: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const now = new Date()
      const thirtyDaysFromNow = addDays(now, 30)
      const [partnersRes, agreementsRes, oppsRes, revenueRes, tasksRes, activitiesRes] = await Promise.all([
        supabase.from('partners').select('id, partner_name, status, partner_type, created_at').order('created_at', { ascending: false }),
        supabase.from('agreements').select('id, agreement_name, status, expiry_date, partners(partner_name)'),
        supabase.from('opportunities').select('id, stage, estimated_revenue, partner_id'),
        supabase.from('revenue_records').select('amount, month, financial_year, quarter, partner_id'),
        supabase.from('tasks').select('id, status').eq('status', 'pending'),
        supabase.from('activities').select('id, description, action, created_at, entity_type').order('created_at', { ascending: false }).limit(8),
      ])

      const partners = (partnersRes.data ?? []) as typeof recentPartners
      const agreements = (agreementsRes.data ?? []) as any[]
      const opps = (oppsRes.data ?? []) as any[]
      const revenues = (revenueRes.data ?? []) as any[]

      setStats({
        totalPartners: partners.length,
        activePartners: partners.filter(p => p.status === 'active').length,
        expiredAgreements: agreements.filter(a => a.status === 'expired').length,
        expiringSoon: agreements.filter(a => a.expiry_date && isAfter(new Date(a.expiry_date), now) && isBefore(new Date(a.expiry_date), thirtyDaysFromNow)).length,
        totalOpportunities: opps.length,
        wonOpportunities: opps.filter(o => o.stage === 'won').length,
        lostOpportunities: opps.filter(o => o.stage === 'lost').length,
        pipelineValue: opps.filter(o => !['won', 'lost', 'closed'].includes(o.stage)).reduce((s, o) => s + (o.estimated_revenue ?? 0), 0),
        totalRevenue: revenues.reduce((s, r) => s + (r.amount ?? 0), 0),
        pendingTasks: tasksRes.data?.length ?? 0,
      })

      setRecentPartners(partners.slice(0, 5))
      setUpcomingRenewals(agreements.filter(a => a.expiry_date && isAfter(new Date(a.expiry_date), now) && isBefore(new Date(a.expiry_date), thirtyDaysFromNow)).slice(0, 5) as typeof upcomingRenewals)
      setRecentActivities(activitiesRes.data ?? [])

      // Revenue trend
      const currentYear = now.getFullYear()
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      setRevenueData(monthNames.map((month, i) => ({
        month,
        revenue: revenues.filter(r => r.financial_year === currentYear && r.month === i + 1).reduce((s, r) => s + (r.amount ?? 0), 0),
      })))

      // Pipeline stages
      const stages = ['lead','qualified','proposal','negotiation','won','lost']
      setStageData(stages.map(stage => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: opps.filter(o => o.stage === stage).length,
        value: opps.filter(o => o.stage === stage).reduce((s, o) => s + (o.estimated_revenue ?? 0), 0),
      })))

      // Partner types
      const typeCount: Record<string, number> = {}
      partners.forEach(p => { const t = p.partner_type ?? 'Unknown'; typeCount[t] = (typeCount[t] ?? 0) + 1 })
      setPartnerTypeData(Object.entries(typeCount).map(([name, value]) => ({ name, value })))

      // Top partners by revenue
      const partnerRevenue: Record<string, number> = {}
      revenues.forEach(r => {
        if (r.partner_id) partnerRevenue[r.partner_id] = (partnerRevenue[r.partner_id] ?? 0) + (r.amount ?? 0)
      })
      const top = partners
        .map(p => ({ id: p.id, partner_name: p.partner_name, partner_type: p.partner_type, revenue: partnerRevenue[p.id] ?? 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      setTopPartners(top)
    } finally { setLoading(false) }
  }

  const chartConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' }, count: { label: 'Count', color: 'var(--chart-2)' } }
  const maxRevenue = topPartners[0]?.revenue ?? 1

  return (
    <div className="space-y-6">
      {/* ── Hero ───────────────────────────────────────── */}
      <FadeIn>
        <GlassCard hover={false} className="p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
          {/* Floating orbs */}
          <motion.div
            className="absolute -top-8 -right-8 size-48 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, var(--primary), transparent)' }}
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-12 left-1/3 size-40 rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, var(--secondary), transparent)' }}
            animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="flex items-center justify-center size-7 rounded-lg btn-gradient">
                  <Sparkles className="size-3.5 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Welcome back
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Partnership <span className="text-gradient">Overview</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground mt-2 max-w-md"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Monitor your partnerships, agreements, and pipeline at a glance
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex gap-3"
            >
              <div className="text-center px-5 py-3 rounded-2xl glass border-primary/10">
                <p className="text-3xl font-bold tabular-nums text-gradient">
                  <AnimatedCounter value={stats.activePartners} />
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Active Partners</p>
              </div>
              <div className="text-center px-5 py-3 rounded-2xl glass border-green-500/10">
                <p className="text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
                  <AnimatedCounter value={stats.wonOpportunities} />
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">Won Deals</p>
              </div>
            </motion.div>
          </div>
        </GlassCard>
      </FadeIn>

      {/* ── KPI Row ─────────────────────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StaggerItem><StatCard title="Total Partners" value={stats.totalPartners} icon={Building2} color="primary" trend={12} sparkData={genSpark(20, 5)} delay={0} /></StaggerItem>
        <StaggerItem><StatCard title="Active" value={stats.activePartners} icon={Users} color="success" trend={8} sparkData={genSpark(15, 4)} delay={0.06} /></StaggerItem>
        <StaggerItem><StatCard title="Expiring Soon" value={stats.expiringSoon} icon={Clock} color="warning" trend={-5} sparkData={genSpark(8, 3)} delay={0.12} /></StaggerItem>
        <StaggerItem><StatCard title="Expired" value={stats.expiredAgreements} icon={AlertTriangle} color="destructive" trend={-2} sparkData={genSpark(5, 2)} delay={0.18} /></StaggerItem>
        <StaggerItem><StatCard title="Pending Tasks" value={stats.pendingTasks} icon={CheckSquare} color="accent" trend={15} sparkData={genSpark(10, 4)} delay={0.24} /></StaggerItem>
      </StaggerContainer>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><StatCard title="Pipeline Value" value={stats.pipelineValue} icon={Target} color="primary" format={(n) => `$${(n / 1000).toFixed(0)}K`} trend={22} sparkData={genSpark(50, 15)} delay={0.3} /></StaggerItem>
        <StaggerItem><StatCard title="Won Deals" value={stats.wonOpportunities} icon={Trophy} color="success" trend={18} sparkData={genSpark(12, 4)} delay={0.36} /></StaggerItem>
        <StaggerItem><StatCard title="Total Opps" value={stats.totalOpportunities} icon={TrendingUp} color="secondary" trend={10} sparkData={genSpark(25, 6)} delay={0.42} /></StaggerItem>
        <StaggerItem><StatCard title="Total Revenue" value={stats.totalRevenue} icon={DollarSign} color="success" format={(n) => `$${(n / 1000).toFixed(0)}K`} trend={25} sparkData={genSpark(80, 20)} delay={0.48} /></StaggerItem>
      </StaggerContainer>

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Revenue Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Monthly revenue this year</p>
              </div>
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="size-4 text-primary" />
              </div>
            </div>
            {loading ? <PremiumSkeleton className="h-[240px]" /> : (
              <ChartContainer config={chartConfig} className="min-h-[240px] w-full">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={v => `$${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ChartContainer>
            )}
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.15}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Opportunity Pipeline</h3>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Deals by stage</p>
              </div>
              <div className="size-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-secondary" />
              </div>
            </div>
            {loading ? <PremiumSkeleton className="h-[240px]" /> : (
              <ChartContainer config={chartConfig} className="min-h-[240px] w-full">
                <BarChart data={stageData} layout="vertical">
                  <CartesianGrid horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ChartContainer>
            )}
          </GlassCard>
        </FadeIn>
      </div>

      {/* ── Bottom Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner Types */}
        <FadeIn delay={0.2}>
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-section)' }}>Partner Types</h3>
            {loading ? <PremiumSkeleton className="h-[200px]" /> : partnerTypeData.length === 0 ? (
              <EmptyState icon={Building2} title="No data" />
            ) : (
              <ChartContainer config={{}} className="min-h-[200px] w-full">
                <PieChart>
                  <Pie data={partnerTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {partnerTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            )}
          </GlassCard>
        </FadeIn>

        {/* Recent Partners */}
        <FadeIn delay={0.25}>
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-3">
              <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Recent Partners</h3>
              <Link to="/partners" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="px-2 pb-2">
              {loading ? Array.from({length: 4}).map((_, i) => <PremiumSkeleton key={i} className="h-12 mx-4 my-1" />) :
               recentPartners.length === 0 ? <EmptyState icon={Building2} title="No partners yet" /> :
               recentPartners.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/partners/${p.id}`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/[0.04] transition-colors group">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.partner_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.partner_type ?? 'Partner'}</p>
                    </div>
                    <StatusBadge status={p.status} variant={p.status === 'active' ? 'active' : 'inactive'} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>

        {/* Upcoming Renewals */}
        <FadeIn delay={0.3}>
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-3">
              <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Upcoming Renewals</h3>
              <Link to="/agreements" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="px-2 pb-2">
              {loading ? Array.from({length: 4}).map((_, i) => <PremiumSkeleton key={i} className="h-12 mx-4 my-1" />) :
               upcomingRenewals.length === 0 ? <EmptyState icon={Clock} title="No renewals" /> :
               upcomingRenewals.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to="/agreements" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-amber-500/[0.04] transition-colors group">
                    <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-amber-600 transition-colors">{a.agreement_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.partners?.partner_name}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
                      {a.expiry_date ? format(new Date(a.expiry_date), 'MMM d') : ''}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>
      </div>

      {/* ── Leaderboard + Activity ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partner Leaderboard */}
        <FadeIn delay={0.35}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Partner Performance</h3>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Top partners by revenue</p>
              </div>
              <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="size-4 text-amber-500" />
              </div>
            </div>
            {loading ? <div className="space-y-3">{Array.from({length: 4}).map((_, i) => <PremiumSkeleton key={i} className="h-14" />)}</div> :
             topPartners.length === 0 || topPartners[0].revenue === 0 ? <EmptyState icon={Trophy} title="No revenue data" /> : (
              <div className="space-y-3">
                {topPartners.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      i === 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      i === 1 ? 'bg-slate-400/15 text-slate-500 dark:text-slate-400' :
                      i === 2 ? 'bg-orange-700/15 text-orange-700 dark:text-orange-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <Avatar className="size-9 rounded-xl ring-2 ring-border/50 shrink-0">
                      <AvatarFallback className="text-xs btn-gradient text-white font-semibold">
                        {p.partner_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{p.partner_name}</p>
                        <span className="text-sm font-bold tabular-nums text-green-600 dark:text-green-400 ml-2 shrink-0">
                          ${(p.revenue / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <Progress value={(p.revenue / maxRevenue) * 100} className="h-1.5" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </FadeIn>

        {/* Activity Timeline */}
        <FadeIn delay={0.4}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>Recent Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>Latest actions across the platform</p>
              </div>
              <Link to="/activities" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                View all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {loading ? <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <PremiumSkeleton key={i} className="h-8" />)}</div> :
             recentActivities.length === 0 ? <EmptyState icon={Zap} title="No activity" /> : (
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {recentActivities.map((act, i) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 relative"
                    >
                      <motion.div
                        className="size-3 rounded-full bg-primary ring-4 ring-background shrink-0 mt-1.5 relative z-10"
                        whileHover={{ scale: 1.4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      />
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                          {act.description ?? `${act.action} on ${act.entity_type}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                          {format(new Date(act.created_at), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </FadeIn>
      </div>
    </div>
  )
}
