import { useEffect, useRef, useState } from 'react'
import { FileStack, Search, ExternalLink, Plus, Trash2, Upload, Link as LinkIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Document, Partner } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, FadeIn } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'
import { logActivity } from '@/lib/activity'
import { cn } from '@/lib/utils'

type DocWithPartner = Document & { partners: { partner_name: string } | null }

const DOC_TYPES = ['Contract', 'NDA', 'MOU', 'Proposal', 'Invoice', 'Report', 'Certificate', 'Presentation', 'Specification', 'Other']

export default function DocumentsPage() {
  const { canEdit, user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<DocWithPartner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [filtered, setFiltered] = useState<DocWithPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', doc_type: '', partner_id: '', tags: '', category: '', url: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => { fetchDocs(); fetchPartners() }, [])
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

  async function fetchPartners() {
    const { data } = await supabase.from('partners').select('id, partner_name').order('partner_name')
    setPartners((data ?? []) as Partner[])
  }

  function openDialog() {
    setForm({ name: '', doc_type: '', partner_id: '', tags: '', category: '', url: '' })
    setSelectedFile(null)
    setUploadMode('file')
    setDialogOpen(true)
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    if (!form.name) setForm(f => ({ ...f, name: file.name.replace(/\.[^.]+$/, '') }))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Name is required'); return }
    if (uploadMode === 'file' && !selectedFile) { toast.error('Please select a file'); return }
    if (uploadMode === 'url' && !form.url) { toast.error('Please enter a URL'); return }

    setSaving(true)
    let fileUrl: string | null = form.url || null
    let fileSize: number | null = null
    let mimeType: string | null = null

    if (uploadMode === 'file' && selectedFile) {
      const ext = selectedFile.name.split('.').pop()
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, selectedFile)
      if (uploadError) { toast.error(`Upload failed: ${uploadError.message}`); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
      fileUrl = publicUrl
      fileSize = selectedFile.size
      mimeType = selectedFile.type
    }

    const payload = {
      name: form.name,
      doc_type: form.doc_type || null,
      partner_id: form.partner_id || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      category: form.category || null,
      file_url: fileUrl,
      file_size: fileSize,
      mime_type: mimeType,
    }

    const { data: docData, error } = await supabase.from('documents').insert(payload).select().single()
    setSaving(false)

    if (error) { toast.error(`Failed to save document: ${error.message}`); return }
    await logActivity({ user, entityType: 'document', entityId: docData?.id, action: 'create', description: `Uploaded document "${form.name}"`, partnerId: form.partner_id || null })
    toast.success('Document saved')
    setDialogOpen(false)
    fetchDocs()
  }

  async function handleDelete() {
    if (!deleteId) return
    const doc = docs.find(d => d.id === deleteId)
    if (doc?.file_url?.includes('supabase')) {
      const path = doc.file_url.split('/documents/')[1]
      if (path) await supabase.storage.from('documents').remove([path])
    }
    await supabase.from('documents').delete().eq('id', deleteId)
    if (doc) await logActivity({ user, entityType: 'document', entityId: deleteId, action: 'delete', description: `Deleted document "${doc.name}"`, partnerId: doc.partner_id })
    setDeleteId(null)
    toast.success('Document deleted')
    fetchDocs()
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
      <PageHeader title="Document Library" description={`${filtered.length} documents`}>
        {canEdit && (
          <Button className="rounded-xl" onClick={openDialog}>
            <Plus className="size-4" />Add Document
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
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
                  <TableHead className="w-[30%]">Document</TableHead>
                  <TableHead className="w-[18%] hidden md:table-cell">Partner</TableHead>
                  <TableHead className="w-[12%] hidden md:table-cell">Type</TableHead>
                  <TableHead className="w-[12%] hidden lg:table-cell">Size</TableHead>
                  <TableHead className="w-[16%] hidden lg:table-cell">Uploaded</TableHead>
                  <TableHead className="w-[12%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 6}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <EmptyState icon={FileStack} title="No documents found" description="Upload files or add document URLs to get started." action={canEdit ? <Button size="sm" className="rounded-xl" onClick={openDialog}><Plus className="size-3" />Add Document</Button> : undefined} />
                    </TableCell>
                  </TableRow>
                ) : paginated.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-muted/50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {doc.file_url ? <FileStack className="size-4 text-primary" /> : <LinkIcon className="size-4 text-primary" />}
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
                      <div className="flex items-center gap-1">
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" className="size-7 rounded-lg" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /></a>
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(doc.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </CardContent>
        </GlassCard>
      </FadeIn>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={uploadMode} onValueChange={v => setUploadMode(v as 'file' | 'url')}>
              <TabsList className="w-full">
                <TabsTrigger value="file" className="flex-1"><Upload className="size-3.5 mr-1.5" />Upload File</TabsTrigger>
                <TabsTrigger value="url" className="flex-1"><LinkIcon className="size-3.5 mr-1.5" />Cloud URL</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="mt-3">
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                    dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  )}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileStack className="size-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="size-7 ml-2" onClick={e => { e.stopPropagation(); setSelectedFile(null) }}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Drop a file or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images, and more</p>
                    </>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="url" className="mt-3">
                <div className="space-y-1.5">
                  <Label>Document URL</Label>
                  <Input
                    className="rounded-xl focus-ring"
                    placeholder="https://drive.google.com/... or any cloud URL"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Supports Google Drive, Dropbox, SharePoint, or any direct URL</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-1.5">
              <Label>Document Name <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl focus-ring" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contract Agreement 2024" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
                  <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Type..." /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Partner</Label>
                <Select value={form.partner_id} onValueChange={v => setForm(f => ({ ...f, partner_id: v }))}>
                  <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Partner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No partner</SelectItem>
                    {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.partner_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input className="rounded-xl focus-ring" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Legal, Finance, Technical..." />
            </div>

            <div className="space-y-1.5">
              <Label>Tags <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
              <Input className="rounded-xl focus-ring" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="signed, 2024, reviewed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the document record. If a file was uploaded, it will also be deleted from storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
