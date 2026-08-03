import { useEffect, useState } from 'react'
import { Download, TrendingUp, Users, FileText, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, StatCard, EmptyState, FadeIn, StaggerContainer, StaggerItem, GlassCard } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'
import { usePdfExport } from '@/hooks/usePdfExport'
import { toast } from 'sonner'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    partners: [] as Array<{ id: string; partner_name: string; status: string; partner_type: string | null; country: string | null; created_at: string }>,
    agreements: [] as Array<{ status: string; agreement_type: string | null; expiry_date: string | null }>,
    opportunities: [] as Array<{ stage: string; estimated_revenue: number; expected_close_date: string | null; currency: string }>,
    revenue: [] as Array<{ amount: number; month: number | null; financial_year: number | null; partner_id: string; currency: string }>,
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, a, o, r] = await Promise.all([
      supabase.from('partners').select('id, partner_name, status, partner_type, country, created_at'),
      supabase.from('agreements').select('status, agreement_type, expiry_date'),
      supabase.from('opportunities').select('stage, estimated_revenue, expected_close_date, currency'),
      supabase.from('revenue_records').select('amount, month, financial_year, partner_id, currency'),
    ])
    setData({ partners: p.data ?? [], agreements: a.data ?? [], opportunities: o.data ?? [], revenue: r.data ?? [] })
    setLoading(false)
  }

  const chartConfig = {
    revenue: { label: 'Revenue', color: 'var(--chart-1)' },
    count: { label: 'Count', color: 'var(--chart-2)' },
    value: { label: 'Value', color: 'var(--chart-3)' },
  }

  const statusDist = ['active', 'inactive', 'prospect', 'suspended'].map(s => ({
    name: s, value: data.partners.filter(p => p.status === s).length
  })).filter(s => s.value > 0)

  const aggStatusDist = ['active', 'expired', 'pending', 'draft', 'terminated'].map(s => ({
    name: s, value: data.agreements.filter(a => a.status === s).length
  })).filter(s => s.value > 0)

  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
  const oppFunnel = stages.map(stage => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: data.opportunities.filter(o => o.stage === stage).length,
    value: data.opportunities.filter(o => o.stage === stage).reduce((s, o) => s + o.estimated_revenue, 0),
  }))

  const currentYear = new Date().getFullYear()
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyRevenue = months.map((month, i) => ({
    month,
    revenue: data.revenue.filter(r => r.financial_year === currentYear && r.month === i + 1).reduce((s, r) => s + r.amount, 0)
  }))

  const partnerRevMap: Record<string, { name: string; revenue: number }> = {}
  data.revenue.forEach(r => {
    const p = data.partners.find(p => p.id === r.partner_id)
    const name = p?.partner_name ?? 'Unknown'
    if (!partnerRevMap[name]) partnerRevMap[name] = { name, revenue: 0 }
    partnerRevMap[name].revenue += r.amount
  })
  const topPartners = Object.values(partnerRevMap).sort((a, b) => b.revenue - a.revenue)
  const { page, pageSize, total, paginated, onPageChange } = usePagination(topPartners, 10)
  const { exportToPdf, exporting } = usePdfExport()

  async function handleExport() {
    try {
      await exportToPdf(`linkit-reports-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Report exported as PDF')
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Partnership performance insights">
        <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport} disabled={exporting}>
          <Download className="size-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </PageHeader>

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><StatCard title="Total Partners" value={data.partners.length} icon={Users} color="primary" /></StaggerItem>
        <StaggerItem><StatCard title="Active Agreements" value={data.agreements.filter(a => a.status === 'active').length} icon={FileText} color="success" delay={0.06} /></StaggerItem>
        <StaggerItem><StatCard title="Total Opportunities" value={data.opportunities.length} icon={TrendingUp} color="accent" delay={0.12} /></StaggerItem>
        <StaggerItem><StatCard title="Total Revenue" value={data.revenue.reduce((s, r) => s + r.amount, 0)} format={n => `$${(n/1000).toFixed(0)}K`} icon={DollarSign} color="warning" delay={0.18} /></StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn>
          <GlassCard accent className="overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Monthly Revenue ({currentYear})</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid vertical={false} className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={3} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.06}>
          <GlassCard accent className="overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Opportunity Pipeline</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart data={oppFunnel} layout="vertical">
                  <CartesianGrid horizontal={false} className="stroke-border" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={75} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={3} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.12}>
          <GlassCard accent className="overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Partner Status Distribution</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              {statusDist.length === 0 ? <EmptyState icon={Users} title="No data" /> : (
                <ChartContainer config={{}} className="min-h-[200px] w-full">
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.18}>
          <GlassCard accent className="overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Agreement Status</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              {aggStatusDist.length === 0 ? <EmptyState icon={FileText} title="No data" /> : (
                <ChartContainer config={{}} className="min-h-[200px] w-full">
                  <PieChart>
                    <Pie data={aggStatusDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {aggStatusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </GlassCard>
        </FadeIn>
      </div>

      <FadeIn delay={0.24}>
        <GlassCard accent className="overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Partner Revenue Ranking</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top partners by total revenue generated</p>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10">
                  <TableHead className="w-[6%]">#</TableHead>
                  <TableHead className="w-[34%]">Partner</TableHead>
                  <TableHead className="w-[24%]">Revenue</TableHead>
                  <TableHead className="w-[30%] hidden md:table-cell">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><div className="shimmer rounded-lg h-5" /></TableCell></TableRow>)
                 : paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><EmptyState icon={DollarSign} title="No revenue data" /></TableCell></TableRow>
                 ) : paginated.map((p, i) => {
                  const total = topPartners.reduce((s, t) => s + t.revenue, 0)
                  const share = total > 0 ? Math.round((p.revenue / total) * 100) : 0
                  return (
                    <TableRow key={p.name} className="group">
                      <TableCell className="text-muted-foreground font-medium tabular-nums">{(page - 1) * pageSize + i + 1}</TableCell>
                      <TableCell className="font-medium"><span className="truncate block max-w-[200px]">{p.name}</span></TableCell>
                      <TableCell className="font-semibold tabular-nums">${p.revenue.toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-primary/20 rounded-full flex-1 max-w-24">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">{share}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </CardContent>
        </GlassCard>
      </FadeIn>
    </div>
  )
}
