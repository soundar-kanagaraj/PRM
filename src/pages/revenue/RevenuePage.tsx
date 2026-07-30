import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, DollarSign, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, TrendingUp, Clock, CircleAlert as AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RevenueRecord } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { GlassCard, StatCard, PageHeader, StatusBadge, FadeIn, StaggerContainer, StaggerItem, EmptyState, PremiumSkeleton } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'

type RevWithPartner = RevenueRecord & { partners: { partner_name: string } | null }

const PAYMENT_VARIANT: Record<string, 'active' | 'inactive' | 'pending' | 'warning' | 'danger' | 'info' | 'success'> = {
  paid: 'success',
  pending: 'pending',
  overdue: 'danger',
  cancelled: 'inactive',
}

export default function RevenuePage() {
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()
  const [records, setRecords] = useState<RevWithPartner[]>([])
  const [filtered, setFiltered] = useState<RevWithPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { fetchRecords() }, [])
  useEffect(() => {
    let list = records
    if (search) list = list.filter(r => r.partners?.partner_name.toLowerCase().includes(search.toLowerCase()) || r.revenue_source?.toLowerCase().includes(search.toLowerCase()))
    if (yearFilter !== 'all') list = list.filter(r => r.financial_year?.toString() === yearFilter)
    if (paymentFilter !== 'all') list = list.filter(r => r.payment_status === paymentFilter)
    setFiltered(list)
  }, [search, yearFilter, paymentFilter, records])

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase.from('revenue_records').select('*, partners(partner_name)').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load revenue records')
    else setRecords((data ?? []) as RevWithPartner[])
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase.from('revenue_records').delete().eq('id', deleteId)
    setDeleteId(null)
    if (error) toast.error('Failed to delete')
    else { toast.success('Record deleted'); fetchRecords() }
  }

  const totalRevenue = records.reduce((s, r) => s + r.amount, 0)
  const paidRevenue = records.filter(r => r.payment_status === 'paid').reduce((s, r) => s + r.amount, 0)
  const pendingRevenue = records.filter(r => r.payment_status === 'pending').reduce((s, r) => s + r.amount, 0)

  // Monthly chart data
  const currentYear = new Date().getFullYear()
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthlyData = months.map((month, i) => ({
    month,
    revenue: records.filter(r => r.financial_year === currentYear && r.month === i + 1).reduce((s, r) => s + r.amount, 0)
  }))

  // By partner
  const partnerRevMap: Record<string, number> = {}
  records.forEach(r => {
    const name = r.partners?.partner_name ?? 'Unknown'
    partnerRevMap[name] = (partnerRevMap[name] ?? 0) + r.amount
  })
  const partnerRevData = Object.entries(partnerRevMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, revenue]) => ({ name: name.length > 15 ? name.slice(0, 12) + '...' : name, revenue }))

  const years = [...new Set(records.map(r => r.financial_year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0)) as number[]

  const chartConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' } }
  const { page, pageSize, total, paginated, onPageChange } = usePagination(filtered, 10)

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue Management" description={`${filtered.length} records`}>
        {canEdit && <Button asChild className="rounded-xl"><Link to="/revenue/new"><Plus className="size-4" />Add Revenue</Link></Button>}
      </PageHeader>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard title="Total Revenue" value={totalRevenue} format={n => `$${(n/1000).toFixed(1)}K`} icon={DollarSign} color="primary" delay={0} />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Paid" value={paidRevenue} format={n => `$${(n/1000).toFixed(1)}K`} icon={TrendingUp} color="success" delay={0.06} />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Pending" value={pendingRevenue} format={n => `$${(n/1000).toFixed(1)}K`} icon={Clock} color="warning" delay={0.12} />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <GlassCard className="p-0">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Monthly Revenue ({currentYear})</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              <ChartContainer config={chartConfig} className="min-h-[180px] w-full">
                <BarChart data={monthlyData}>
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
        <FadeIn delay={0.15}>
          <GlassCard className="p-0">
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Revenue by Partner</h3>
            </div>
            <CardContent className="pt-0 px-6 pb-6">
              {partnerRevData.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center">
                  <EmptyState icon={AlertCircle} title="No data" description="Revenue by partner will appear here once records exist." />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="min-h-[180px] w-full">
                  <BarChart data={partnerRevData} layout="vertical">
                    <CartesianGrid horizontal={false} className="stroke-border" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={90} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={3} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </GlassCard>
        </FadeIn>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-full sm:w-32 rounded-xl focus-ring"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl focus-ring"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['paid', 'pending', 'overdue', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <FadeIn delay={0.2}>
        <GlassCard accent className="p-0 overflow-hidden">
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm hover:bg-transparent">
                  <TableHead className="w-[22%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Partner</TableHead>
                  <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
                  <TableHead className="w-[14%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Period</TableHead>
                  <TableHead className="w-[16%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Amount</TableHead>
                  <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Invoice</TableHead>
                  <TableHead className="w-[14%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  <TableHead className="w-[6%] h-11" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 7}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <EmptyState
                        icon={DollarSign}
                        title="No revenue records found"
                        description="Try adjusting your filters or add a new revenue record."
                        action={canEdit ? <Button size="sm" asChild className="rounded-xl"><Link to="/revenue/new"><Plus className="size-3" />Add Revenue</Link></Button> : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : paginated.map((r, idx) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                    className="row-hover group hover:bg-muted/50 border-border/30"
                  >
                    <TableCell className="py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">{r.partners?.partner_name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.revenue_source ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{r.revenue_type ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums py-3">
                      {r.financial_year ? `FY${r.financial_year}` : ''} {r.quarter ? `Q${r.quarter}` : ''}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-semibold text-sm tabular-nums">{r.currency} {r.amount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{r.invoice_number ?? '—'}</TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={r.payment_status} variant={PAYMENT_VARIANT[r.payment_status] ?? 'info'} />
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-xl"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && <DropdownMenuItem onClick={() => navigate(`/revenue/${r.id}/edit`)}><Edit className="size-4" />Edit</DropdownMenuItem>}
                          {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </CardContent>
        </GlassCard>
      </FadeIn>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle style={{ fontFamily: 'var(--font-section)' }}>Delete Record?</AlertDialogTitle><AlertDialogDescription style={{ fontFamily: 'var(--font-body)' }}>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
