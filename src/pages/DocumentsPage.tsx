import { useEffect, useState } from 'react'
import { FileStack, Search, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, FadeIn } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'

type DocWithPartner = Document & { partners: { partner_name: string } | null }

export default function DocumentsPage() {
  useAuth()
  const [docs, setDocs] = useState<DocWithPartner[]>([])
  const [filtered, setFiltered] = useState<DocWithPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => { fetchDocs() }, [])
  useEffect(() => {
    let list = docs
    if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.partners?.partner_name.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter !== 'all') list = list.filter(d => d.doc_type === typeFilter)
    setFiltered(list)
  }, [search, typeFilter, docs])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*, partners(partner_name)').order('created_at', { ascending: false })
    setDocs((data ?? []) as DocWithPartner[])
    setLoading(false)
  }

  const { page, pageSize, total, paginated, onPageChange } = usePagination(filtered, 10)
  const docTypes = [...new Set(docs.map(d => d.doc_type).filter(Boolean))] as string[]

  function formatSize(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Document Library" description={`${filtered.length} documents`} />

      <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search documents..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl focus-ring"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {docTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

      <FadeIn>
        <GlassCard accent className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10">
                  <TableHead className="w-[26%]">Document</TableHead>
                  <TableHead className="w-[18%] hidden md:table-cell">Partner</TableHead>
                  <TableHead className="w-[14%] hidden md:table-cell">Type</TableHead>
                  <TableHead className="w-[12%] hidden lg:table-cell">Size</TableHead>
                  <TableHead className="w-[18%] hidden lg:table-cell">Uploaded</TableHead>
                  <TableHead className="w-[6%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 6}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <EmptyState icon={FileStack} title="No documents found" description="Documents are attached to partners and agreements." />
                    </TableCell>
                  </TableRow>
                ) : paginated.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-muted/50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileStack className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5">{doc.tags.slice(0,2).map(t => <Badge key={t} variant="secondary" className="text-xs py-0">{t}</Badge>)}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm"><span className="truncate block max-w-[200px]">{doc.partners?.partner_name ?? '—'}</span></TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.doc_type && <Badge variant="outline" className="text-xs">{doc.doc_type}</Badge>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">{formatSize(doc.file_size)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">{format(new Date(doc.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {doc.file_url && (
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /></a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </CardContent>
        </GlassCard>
      </FadeIn>
    </div>
  )
}
