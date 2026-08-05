import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Trash2, Clock, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Agreement } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format, isAfter, addDays, isBefore } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  GlassCard, PageHeader, StatusBadge, FadeIn, EmptyState, PremiumSkeleton
} from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'
import { usePdfExport } from '@/hooks/usePdfExport'
import { motion } from 'framer-motion'

type AgreementWithPartner = Agreement & { partners: { partner_name: string } | null }

const STATUS_VARIANTS: Record<string, 'active' | 'inactive' | 'pending' | 'warning' | 'danger' | 'info' | 'success'> = {
  active: 'active',
  expired: 'danger',
  pending: 'pending',
  terminated: 'inactive',
  draft: 'warning',
}

export default function AgreementsPage() {
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()
  const [agreements, setAgreements] = useState<AgreementWithPartner[]>([])
  const [filtered, setFiltered] = useState<AgreementWithPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { fetchAgreements() }, [])

  useEffect(() => {
    let list = agreements
    if (search) list = list.filter(a => a.agreement_name.toLowerCase().includes(search.toLowerCase()) || a.partners?.partner_name.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter)
    setFiltered(list)
  }, [search, statusFilter, agreements])

  async function fetchAgreements() {
    setLoading(true)
    const { data, error } = await supabase.from('agreements').select('*, partners(partner_name)').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load agreements')
    else setAgreements((data ?? []) as AgreementWithPartner[])
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase.from('agreements').delete().eq('id', deleteId)
    setDeleteId(null)
    if (error) toast.error('Failed to delete')
    else { toast.success('Agreement deleted'); fetchAgreements() }
  }

  const now = new Date()
  const expiringSoon = agreements.filter(a => {
    if (!a.expiry_date || a.status !== 'active') return false
    const d = new Date(a.expiry_date)
    return isAfter(d, now) && isBefore(d, addDays(now, 30))
  })
  const { page, pageSize, total, paginated, onPageChange } = usePagination(filtered, 10)
  const { exportToPdf, exporting } = usePdfExport()

  async function handleExport() {
    try {
      await exportToPdf(`linkit-agreements-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Agreements exported as PDF')
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agreements" description={`${filtered.length} agreements`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />{exporting ? 'Exporting...' : 'Export'}
          </Button>
          {canEdit && <Button asChild className="rounded-xl"><Link to="/agreements/new"><Plus className="size-4" />New Agreement</Link></Button>}
        </div>
      </PageHeader>

      {expiringSoon.length > 0 && (
        <FadeIn>
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-xl">
            <Clock className="size-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Expiry Alert</AlertTitle>
            <AlertDescription className="text-amber-600 dark:text-amber-500">
              {expiringSoon.length} agreement(s) expiring within 30 days.
            </AlertDescription>
          </Alert>
        </FadeIn>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search agreements..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl focus-ring"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FadeIn delay={0.05}>
        <GlassCard accent className="p-0 overflow-hidden">
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm hover:bg-transparent">
                  <TableHead className="w-[28%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Agreement</TableHead>
                  <TableHead className="w-[16%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Partner</TableHead>
                  <TableHead className="w-[14%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
                  <TableHead className="w-[16%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Expiry Date</TableHead>
                  <TableHead className="w-[14%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  <TableHead className="w-[6%] h-11" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 6}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <EmptyState
                        icon={FileText}
                        title="No agreements found"
                        description="Try adjusting your filters or create a new agreement."
                        action={canEdit ? <Button size="sm" className="rounded-xl" asChild><Link to="/agreements/new"><Plus className="size-3" />Create Agreement</Link></Button> : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : paginated.map((a, idx) => {
                  const isExpiringSoon = a.expiry_date && isAfter(new Date(a.expiry_date), now) && isBefore(new Date(a.expiry_date), addDays(now, 30))
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                      className="row-hover group hover:bg-muted/50 border-border/30"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${isExpiringSoon ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'}`}>
                            {isExpiringSoon ? <Clock className="size-4 text-amber-600" /> : <FileText className="size-4 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">{a.agreement_name}</p>
                            {a.agreement_number && <p className="text-xs text-muted-foreground tabular-nums truncate max-w-[200px]">#{a.agreement_number}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm truncate max-w-[200px] py-3">{a.partners?.partner_name ?? '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{a.agreement_type ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell py-3">
                        {a.expiry_date ? (
                          <span className={`text-sm tabular-nums ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                            {format(new Date(a.expiry_date), 'MMM d, yyyy')}
                            {isExpiringSoon && ' ⚠'}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={a.status} variant={STATUS_VARIANTS[a.status] ?? 'info'} />
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && <DropdownMenuItem onClick={() => navigate(`/agreements/${a.id}/edit`)}><Edit className="size-4" />Edit</DropdownMenuItem>}
                            {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </CardContent>
        </GlassCard>
      </FadeIn>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle style={{ fontFamily: 'var(--font-section)' }}>Delete Agreement?</AlertDialogTitle><AlertDialogDescription style={{ fontFamily: 'var(--font-body)' }}>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
