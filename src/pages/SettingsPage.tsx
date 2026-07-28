import { useEffect, useState } from 'react'
import { Settings, Plus, Trash2, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Setting } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { PageHeader, EmptyState, PremiumSkeleton, FadeIn } from '@/components/shared/premium'

const SETTING_CATEGORIES = [
  { key: 'partner_type', label: 'Partner Types' },
  { key: 'partner_tier', label: 'Partner Tiers' },
  { key: 'partner_category', label: 'Partner Categories' },
  { key: 'agreement_type', label: 'Agreement Types' },
  { key: 'industry', label: 'Industries' },
  { key: 'region', label: 'Regions' },
  { key: 'revenue_type', label: 'Revenue Types' },
  { key: 'currency', label: 'Currencies' },
]

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSetting, setEditSetting] = useState<Setting | null>(null)
  const [activeCategory, setActiveCategory] = useState('partner_type')
  const [form, setForm] = useState({ label: '', value: '', sort_order: 0 })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*').order('category').order('sort_order')
    setSettings((data ?? []) as Setting[])
    setLoading(false)
  }

  function openCreate() {
    setEditSetting(null)
    setForm({ label: '', value: '', sort_order: 0 })
    setDialogOpen(true)
  }

  function openEdit(s: Setting) {
    setEditSetting(s)
    setForm({ label: s.label, value: s.value, sort_order: s.sort_order })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.label || !form.value) return
    setSaving(true)
    const payload = { ...form, category: activeCategory }
    const { error } = editSetting
      ? await supabase.from('settings').update(payload).eq('id', editSetting.id)
      : await supabase.from('settings').insert(payload)
    setSaving(false)
    if (error) { toast.error('Failed to save'); return }
    toast.success('Saved')
    setDialogOpen(false)
    fetchSettings()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('settings').delete().eq('id', deleteId)
    setDeleteId(null)
    toast.success('Deleted')
    fetchSettings()
  }

  async function toggleActive(s: Setting) {
    await supabase.from('settings').update({ is_active: !s.is_active }).eq('id', s.id)
    setSettings(prev => prev.map(item => item.id === s.id ? { ...item, is_active: !item.is_active } : item))
  }

  const catSettings = settings.filter(s => s.category === activeCategory)

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Settings className="size-12 opacity-30" />
      <p className="font-medium">Super Admin access required</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Settings" description="Configure dropdown values and system settings" />

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {SETTING_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs">
              {cat.label}
              <Badge variant="secondary" className="ml-1.5 text-xs tabular-nums">{settings.filter(s => s.category === cat.key).length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {SETTING_CATEGORIES.map(cat => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <FadeIn>
              <Card className="glass rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-base" style={{ fontFamily: 'var(--font-display)' }}>{cat.label}</CardTitle>
                    <CardDescription>Manage {cat.label.toLowerCase()} options</CardDescription>
                  </div>
                  <Button size="sm" className="rounded-xl" onClick={openCreate}><Plus className="size-4" />Add</Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">{Array.from({length: 4}).map((_, i) => <PremiumSkeleton key={i} className="h-10 rounded-xl" />)}</div>
                  ) : catSettings.length === 0 ? (
                    <EmptyState icon={Settings} title={`No ${cat.label.toLowerCase()} configured`} description="Add your first option to get started." />
                  ) : (
                    <div className="space-y-2">
                      {catSettings.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-xs text-muted-foreground">Value: {s.value} · Order: <span className="tabular-nums">{s.sort_order}</span></p>
                          </div>
                          <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                          <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(s)}><Edit className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="size-3.5" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ fontFamily: 'var(--font-display)' }}>{editSetting ? 'Edit Setting' : 'Add Setting'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Label (Display Name)</Label><Input className="rounded-xl focus-ring" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Value (Internal Key)</Label><Input className="rounded-xl focus-ring" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} /></div>
            <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" className="rounded-xl focus-ring" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving || !form.label || !form.value}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Setting?</AlertDialogTitle><AlertDialogDescription>This may affect existing records using this value.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
