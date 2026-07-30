import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Plus, Search, Building2, MoveHorizontal as MoreHorizontal, CreditCard as Edit, Eye, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Partner } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { GlassCard, PageHeader, StatusBadge, EmptyState, PremiumSkeleton } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'
import { motion } from 'framer-motion'

const TIER_STYLES: Record<string, string> = {
  platinum: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  gold: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  silver: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  bronze: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  registered: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
}

export default function PartnersPage() {
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [filtered, setFiltered] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchPartners() }, [])
  useEffect(() => {
    let list = partners
    if (search) list = list.filter(p => p.partner_name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (typeFilter !== 'all') list = list.filter(p => p.partner_type === typeFilter)
    setFiltered(list)
  }, [search, statusFilter, typeFilter, partners])

  async function fetchPartners() {
    setLoading(true)
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false })
    if (error) toast.error('Failed to load partners')
    else setPartners((data ?? []) as Partner[])
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('partners').delete().eq('id', deleteId)
    setDeleting(false); setDeleteId(null)
    if (error) toast.error('Failed to delete')
    else { toast.success('Partner deleted'); fetchPartners() }
  }

  const partnerTypes = [...new Set(partners.map(p => p.partner_type).filter(Boolean))] as string[]
  const { page, pageSize, total, paginated, onPageChange } = usePagination(filtered, 10)

  return (
    <div className="space-y-6">
      <PageHeader title="Partners" description={`${filtered.length} of ${partners.length} partners`}>
        {canEdit && (
          <Button asChild className="btn-gradient text-white rounded-xl">
            <Link to="/partners/new"><Plus className="size-4" />Add Partner</Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="Search partners..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {partnerTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <GlassCard accent className="overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
              <TableHead className="w-[28%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Partner</TableHead>
              <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
              <TableHead className="w-[12%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Tier</TableHead>
              <TableHead className="w-[14%] hidden md:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Country</TableHead>
              <TableHead className="w-[12%] h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead className="w-[14%] hidden lg:table-cell h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</TableHead>
              <TableHead className="w-[6%] h-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length: 6}).map((_, i) => (
              <TableRow key={i}>
                {Array.from({length: 7}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-10 w-full" /></TableCell>)}
              </TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="border-0">
                <EmptyState icon={Building2} title="No partners found" description="Get started by creating your first partner" action={canEdit ? <Button asChild className="btn-gradient text-white rounded-xl"><Link to="/partners/new"><Plus className="size-4" />Add Partner</Link></Button> : undefined} />
              </TableCell></TableRow>
            ) : paginated.map((partner, idx) => (
              <motion.tr
                key={partner.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                className="row-hover group border-border/30 cursor-pointer"
                onClick={() => navigate(`/partners/${partner.id}`)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[200px]">{partner.partner_name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{partner.email ?? partner.website ?? partner.primary_contact ?? ''}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{partner.partner_type ?? '—'}</TableCell>
                <TableCell className="hidden lg:table-cell py-3">
                  {partner.tier ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TIER_STYLES[partner.tier] ?? TIER_STYLES.registered}`}>{partner.tier}</span> : '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px] py-3">{partner.country ?? '—'}</TableCell>
                <TableCell className="py-3"><StatusBadge status={partner.status} variant={partner.status === 'active' ? 'active' : partner.status === 'suspended' ? 'danger' : 'inactive'} /></TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums py-3">{format(new Date(partner.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg hover:bg-muted/50"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate(`/partners/${partner.id}`)}><Eye className="size-4" />View</DropdownMenuItem>
                      {canEdit && <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate(`/partners/${partner.id}/edit`)}><Edit className="size-4" />Edit</DropdownMenuItem>}
                      {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" className="rounded-lg cursor-pointer" onClick={() => setDeleteId(partner.id)}><Trash2 className="size-4" />Delete</DropdownMenuItem></>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      </GlassCard>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle style={{ fontFamily: 'var(--font-section)' }}>Delete Partner?</AlertDialogTitle><AlertDialogDescription style={{ fontFamily: 'var(--font-body)' }}>This will permanently delete the partner and all associated data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">{deleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
