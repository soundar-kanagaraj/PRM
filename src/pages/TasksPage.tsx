import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, SquareCheck as CheckSquare, Trash2, CreditCard as Edit, Check, CircleAlert as AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Task, Partner } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, StaggerContainer, StaggerItem } from '@/components/shared/premium'

type TaskWithPartner = Task & { partners: { partner_name: string } | null }

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.string().default('medium'),
  status: z.string().default('pending'),
  partner_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function TasksPage() {
  useAuth()
  const [tasks, setTasks] = useState<TaskWithPartner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskWithPartner | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusTab, setStatusTab] = useState('all')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { priority: 'medium', status: 'pending' }
  })

  useEffect(() => { fetchTasks(); fetchPartners() }, [])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase.from('tasks').select('*, partners(partner_name)').order('due_date', { ascending: true, nullsFirst: false })
    setTasks((data ?? []) as TaskWithPartner[])
    setLoading(false)
  }

  async function fetchPartners() {
    const { data } = await supabase.from('partners').select('id, partner_name').order('partner_name')
    setPartners((data ?? []) as Partner[])
  }

  function openCreate() { setEditTask(null); reset({ priority: 'medium', status: 'pending' }); setDialogOpen(true) }
  function openEdit(t: TaskWithPartner) { setEditTask(t); reset({ ...t, due_date: t.due_date?.slice(0, 16) ?? '', partner_id: t.partner_id ?? '' } as any); setDialogOpen(true) }

  async function onSubmit(data: FormData) {
    setSaving(true)
    const payload = { ...data, partner_id: data.partner_id || null, due_date: data.due_date || null }
    const { error } = editTask
      ? await supabase.from('tasks').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editTask.id)
      : await supabase.from('tasks').insert(payload)
    setSaving(false)
    if (error) { toast.error('Failed to save task'); return }
    toast.success(editTask ? 'Task updated' : 'Task created')
    setDialogOpen(false)
    fetchTasks()
  }

  async function toggleStatus(task: TaskWithPartner) {
    const next = task.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('tasks').delete().eq('id', deleteId)
    setDeleteId(null)
    toast.success('Task deleted')
    fetchTasks()
  }

  const filtered = statusTab === 'all' ? tasks : tasks.filter(t => t.status === statusTab)
  const counts = { all: tasks.length, pending: tasks.filter(t => t.status === 'pending').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, completed: tasks.filter(t => t.status === 'completed').length }

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description={`${counts.pending} pending · ${counts.in_progress} in progress · ${counts.completed} completed`}>
        <Button onClick={openCreate} className="rounded-xl"><Plus className="size-4" />New Task</Button>
      </PageHeader>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="all">All (<span className="tabular-nums">{counts.all}</span>)</TabsTrigger>
          <TabsTrigger value="pending">Pending (<span className="tabular-nums">{counts.pending}</span>)</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress (<span className="tabular-nums">{counts.in_progress}</span>)</TabsTrigger>
          <TabsTrigger value="completed">Completed (<span className="tabular-nums">{counts.completed}</span>)</TabsTrigger>
        </TabsList>

        <TabsContent value={statusTab} className="mt-4">
          <StaggerContainer className="space-y-3">
            {loading ? Array.from({length: 5}).map((_, i) => <PremiumSkeleton key={i} className="h-16 rounded-2xl" />) :
             filtered.length === 0 ? (
              <GlassCard hover={false}>
                <CardContent className="py-12">
                  <EmptyState icon={CheckSquare} title="No tasks" description="Get started by creating your first task." action={<Button size="sm" className="rounded-xl" onClick={openCreate}><Plus className="size-3" />Create task</Button>} />
                </CardContent>
              </GlassCard>
            ) : filtered.map(task => (
              <StaggerItem key={task.id}>
                <GlassCard className={`transition-opacity ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleStatus(task)} className={`mt-0.5 size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${task.status === 'completed' ? 'bg-primary border-primary' : 'border-input hover:border-primary'}`}>
                        {task.status === 'completed' && <Check className="size-3 text-primary-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                          {task.partners?.partner_name && <Badge variant="outline" className="text-xs">{task.partners.partner_name}</Badge>}
                          {task.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="size-3" />{format(new Date(task.due_date), 'MMM d, yyyy')}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(task)}><Edit className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ fontFamily: 'var(--font-display)' }}>{editTask ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl focus-ring" aria-invalid={!!errors.title} {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea className="rounded-xl focus-ring" {...register('description')} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller name="priority" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>{['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                    <SelectContent>{['pending','in_progress','completed','cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="datetime-local" className="rounded-xl focus-ring" {...register('due_date')} /></div>
            <div className="space-y-1.5">
              <Label>Partner (optional)</Label>
              <Controller name="partner_id" control={control} render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl focus-ring"><SelectValue placeholder="No partner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No partner</SelectItem>
                    {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.partner_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-xl" disabled={saving}>{saving ? 'Saving...' : editTask ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
