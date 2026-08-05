import { useEffect, useState } from 'react'
import { Plus, Edit, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, StatusBadge, EmptyState, PremiumSkeleton, FadeIn, GlassCard } from '@/components/shared/premium'
import { Pagination, usePagination } from '@/components/shared/pagination'

const ROLE_VARIANTS: Record<string, 'active' | 'info' | 'inactive'> = {
  super_admin: 'active', partnership_manager: 'info', viewer: 'inactive',
}

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'viewer' as Profile['role'], password: '' })
  const [saving, setSaving] = useState(false)
  const [_deleteId, _setDeleteId] = useState<string | null>(null)
  const { page, pageSize, total, paginated, onPageChange } = usePagination(profiles, 10)

  useEffect(() => { fetchProfiles() }, [])

  async function fetchProfiles() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles((data ?? []) as Profile[])
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.password || !inviteForm.full_name) return
    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: inviteForm.email,
          password: inviteForm.password,
          full_name: inviteForm.full_name,
          role: inviteForm.role,
        }),
      })
      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error('Failed to create user: ' + (result.error || res.statusText))
        setSaving(false)
        return
      }
      toast.success('User created successfully')
      setInviteOpen(false)
      fetchProfiles()
    } catch {
      toast.error('Failed to create user')
    }
    setSaving(false)
  }

  async function handleUpdateRole() {
    if (!editProfile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ role: editProfile.role, is_active: editProfile.is_active }).eq('id', editProfile.id)
    setSaving(false)
    if (error) { toast.error('Failed to update'); return }
    toast.success('User updated')
    setEditProfile(null)
    fetchProfiles()
  }

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Shield className="size-12 opacity-30" />
      <p className="font-medium">Super Admin access required</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description={`${profiles.length} users`}>
        <Button onClick={() => setInviteOpen(true)} className="rounded-xl"><Plus className="size-4" />Add User</Button>
      </PageHeader>

      <FadeIn>
        <GlassCard accent className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10">
                  <TableHead className="w-[28%]">User</TableHead>
                  <TableHead className="w-[16%]">Role</TableHead>
                  <TableHead className="w-[18%] hidden md:table-cell">Department</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[18%] hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-[6%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 4}).map((_, i) => (
                  <TableRow key={i}>{Array.from({length: 6}).map((_, j) => <TableCell key={j}><PremiumSkeleton className="h-5" /></TableCell>)}</TableRow>
                )) : profiles.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12"><EmptyState icon={Shield} title="No users" /></TableCell></TableRow>
                ) : paginated.map(profile => (
                  <TableRow key={profile.id} className="hover:bg-muted/50 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {profile.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-sm truncate">{profile.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={profile.role.replace('_', ' ')} variant={ROLE_VARIANTS[profile.role] ?? 'info'} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground"><span className="truncate block max-w-[200px]">{profile.department ?? '—'}</span></TableCell>
                    <TableCell>
                      <StatusBadge status={profile.is_active ? 'Active' : 'Inactive'} variant={profile.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {profile.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => setEditProfile(profile)}>
                          <Edit className="size-3.5" />
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

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Full Name</Label><Input className="rounded-xl focus-ring" value={inviteForm.full_name} onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" className="rounded-xl focus-ring" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" className="rounded-xl focus-ring" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v as Profile['role'] }))}>
                <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="partnership_manager">Partnership Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleInvite} disabled={saving || !inviteForm.email || !inviteForm.password}>{saving ? 'Creating...' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Edit User</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{editProfile.full_name}</p>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editProfile.role} onValueChange={v => setEditProfile(p => p ? { ...p, role: v as Profile['role'] } : null)}>
                  <SelectTrigger className="rounded-xl focus-ring"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="partnership_manager">Partnership Manager</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={editProfile.is_active} onChange={e => setEditProfile(p => p ? { ...p, is_active: e.target.checked } : null)} className="size-4 rounded" />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditProfile(null)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleUpdateRole} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
