import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Target, TrendingUp, Trophy, Percent } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Opportunity } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { GlassCard, StatCard, PageHeader, StatusBadge, FadeIn, StaggerContainer, StaggerItem, EmptyState, PremiumSkeleton } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'

type OppWithPartner = Opportunity & { partners: { partner_name: string } | null }

const STAGE_VARIANT: Record<string, 'info' | 'active' | 'pending' | 'warning' | 'success' | 'danger' | 'inactive'> = {
  lead: 'info',
  qualified: 'info',
  proposal: 'pending',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
  closed: 'inactive',
}

export default function OpportunitiesPage() {
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()
  const [opps, setOpps] = useState<OppWithPartner[]>([])
  const [filtered, setFiltered] = useState<OppWithPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { fetchOpps() }, [])
  useEffect(() => {
    let list = opps
    if (search) list = list.filter(o => o.opportunity_name.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase()))
    if (stageFilter !== 'all') list = list.filter(o => o.stage === stageFilter)
    setFiltered(list)
  }, [search, stageFilter, opps])

  async function fetchOpps() {
    setLoading(true)
    const { data, error } = await supabase.from('opportunities').select('*, partners(partner_name)').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load opportunities')
    else setOpps((data ?? []) as OppWithPartner[])
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase.from('opportunities').delete().eq('id', deleteId)
    setDeleteId(null)
    if (error) toast.error('Failed to delete')
    else { toast.success('Opportunity deleted'); fetchOpps() }
  }

  const pipelineValue = opps.filter(o => !['won', 'lost', 'closed'].includes(o.stage)).reduce((s, o) => s + o.estimated_revenue, 0)
  const wonValue = opps.filter(o => o.stage === 'won').reduce((s, o) => s + o.estimated_revenue, 0)
  const winRate = opps.length > 0 ? Math.round((opps.filter(o => o.stage === 'won').length / opps.filter(o => ['won', 'lost'].includes(o.stage)).length) * 100) || 0 : 0
  const { page, pageSize, total, paginated, onPageChange } = usePagination(filtered, 10)

  return (
    <div className="space-y-6">
      <PageHeader title="Opportunities" description={`${filtered.length} opportunities`}>
        {canEdit && <Button asChild className="rounded-xl"><Link to="/opportunities/new"><Plus className="size-4" />New Opportunity</Link></Button>}
      </PageHeader>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <StatCard title="Pipeline Value" value={pipelineValue} format={n => `$${(n/1000).toFixed(0)}K`} icon={TrendingUp} color="accent" delay={0} />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Won Revenue" value={wonValue} format={n => `$${(n/1000).toFixed(0)}K`} icon={Trophy} color="success" delay={0.06} />
        </StaggerItem>
        <StaggerItem>
          <StatCard title="Win Rate" value={winRate} format={n => `${n}%`} icon={Percent} color="warning" delay={0.12} />
        </StaggerItem>
      </StaggerContainer>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search opportunities..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl focus-ring"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'closed'].map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      <FadeIn delay={0.15}>
        <GlassCard accent className="p-0 overflow-hidden">
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm hover:bg-transparent">
                  <TableHead className="w-[24%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Opportunity</TableHead>
                  <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Partner</TableHead>
                  <TableHead className="w-[14%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Customer</TableHead>
                  <TableHead className="w-[12%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stage</TableHead>
                  <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Revenue</TableHead>
                  <TableHead className="w-[12%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Probability</TableHead>
                  <TableHead className="w-[14%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Close Date</TableHead>
                  <TableHead className="w-[6%] h-11" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 8}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <EmptyState
                        icon={Target}
                        title="No opportunities found"
                        description="Create your first opportunity to start tracking your pipeline."
                        action={canEdit ? <Button size="sm" asChild className="rounded-xl"><Link to="/opportunities/new"><Plus className="size-3" />Add Opportunity</Link></Button> : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : paginated.map((o, idx) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                    className="row-hover group hover:bg-muted/50 border-border/30"
                  >
                    <TableCell className="py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">{o.opportunity_name}</p>
                        {o.opportunity_ref && <p className="text-xs text-muted-foreground truncate max-w-[200px]">#{o.opportunity_ref}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm truncate max-w-[200px] py-3">{o.partners?.partner_name ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{o.customer_name ?? '—'}</TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={o.stage} variant={STAGE_VARIANT[o.stage]} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3">
                      <span className="text-sm font-medium tabular-nums truncate max-w-[200px] inline-block">{o.currency} {o.estimated_revenue?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={o.probability} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground tabular-nums">{o.probability}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums truncate max-w-[200px] py-3">
                      {o.expected_close_date ? format(new Date(o.expected_close_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-xl"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && <DropdownMenuItem onClick={() => navigate(`/opportunities/${o.id}/edit`)}><Edit className="size-4" />Edit</DropdownMenuItem>}
                          {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}
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
          <AlertDialogHeader><AlertDialogTitle style={{ fontFamily: 'var(--font-section)' }}>Delete Opportunity?</AlertDialogTitle><AlertDialogDescription style={{ fontFamily: 'var(--font-body)' }}>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
