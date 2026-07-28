import { useEffect, useState } from 'react'
import { BookOpen, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/premium'

const CATEGORIES = ['Onboarding Guide', 'Sales Process', 'Technical Enablement', 'Certification Guide', 'Marketing Assets', 'Partner Benefits', 'Escalation Process', 'Best Practices', 'FAQs', 'Documentation']

type Entry = { id: string; title: string; content: string | null; category: string | null; tags: string[] | null; is_published: boolean; created_at: string }

export default function PlaybookPage() {
  const { canEdit } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', category: '', is_published: false })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchEntries() }, [])

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase.from('playbook_entries').select('*').order('created_at', { ascending: false })
    setEntries((data ?? []) as Entry[])
    setLoading(false)
  }

  function openCreate() { setEditEntry(null); setForm({ title: '', content: '', category: '', is_published: false }); setDialogOpen(true) }
  function openEdit(e: Entry) { setEditEntry(e); setForm({ title: e.title, content: e.content ?? '', category: e.category ?? '', is_published: e.is_published }); setDialogOpen(true) }

  async function handleSave() {
    if (!form.title) return
    setSaving(true)
    const { error } = editEntry
      ? await supabase.from('playbook_entries').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editEntry.id)
      : await supabase.from('playbook_entries').insert(form)
    setSaving(false)
    if (error) { toast.error('Failed to save'); return }
    toast.success('Saved')
    setDialogOpen(false)
    fetchEntries()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('playbook_entries').delete().eq('id', deleteId)
    setDeleteId(null)
    toast.success('Deleted')
    fetchEntries()
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || e.category === catFilter
    return matchSearch && matchCat
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Entry[]>)
  const uncategorized = filtered.filter(e => !e.category || !CATEGORIES.includes(e.category))
  if (uncategorized.length > 0) grouped['Other'] = uncategorized

  return (
    <div className="space-y-6">
      <PageHeader title="Partnership Playbook" description="Knowledge repository for partnership teams">
        {canEdit && <Button onClick={openCreate} className="rounded-xl"><Plus className="size-4" />Add Entry</Button>}
      </PageHeader>

      <FadeIn>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search playbook..." className="pl-9 rounded-xl focus-ring" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-48 rounded-xl focus-ring"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">{Array.from({length: 4}).map((_, i) => <PremiumSkeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <GlassCard hover={false}>
          <CardContent className="py-12">
            <EmptyState icon={BookOpen} title="No playbook entries yet" description="Create your first playbook entry to get started." action={canEdit && <Button size="sm" className="rounded-xl" onClick={openCreate}><Plus className="size-3" />Add entry</Button>} />
          </CardContent>
        </GlassCard>
      ) : Object.entries(grouped).map(([cat, items]) => (
        <FadeIn key={cat}>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>{cat}</h3>
            <StaggerContainer className="grid gap-3">
              {items.map(entry => (
                <StaggerItem key={entry.id}>
                  <Card className="glass rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="size-4 text-muted-foreground shrink-0" />
                          <CardTitle className="text-sm font-medium">{entry.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!entry.is_published && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                          <Badge variant="outline" className="text-xs">{entry.category ?? 'Other'}</Badge>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="icon" className="size-6 rounded-lg" onClick={e => { e.stopPropagation(); openEdit(entry) }}><Edit className="size-3" /></Button>
                              <Button variant="ghost" size="icon" className="size-6 rounded-lg text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(entry.id) }}><Trash2 className="size-3" /></Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {expandedId === entry.id && entry.content && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                      </CardContent>
                    )}
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle style={{ fontFamily: 'var(--font-display)' }}>{editEntry ? 'Edit Entry' : 'New Playbook Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Title</Label><Input className="rounded-xl focus-ring" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea className="rounded-xl focus-ring" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} placeholder="Write the content..." /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} id="pub" />
              <Label htmlFor="pub">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving || !form.title}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Entry?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
