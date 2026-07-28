import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, StaggerContainer, StaggerItem } from '@/components/shared/premium'

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info, warning: AlertTriangle, error: AlertCircle, success: CheckCircle,
}
const TYPE_COLORS: Record<string, string> = {
  info: 'text-blue-500', warning: 'text-amber-500', error: 'text-red-500', success: 'text-emerald-500',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchNotifications() }, [user])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    setNotifications((data ?? []) as Notification[])
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('All notifications marked as read')
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Notifications" description={unread > 0 ? `${unread} unread` : undefined}>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={markAllRead}><CheckCheck className="size-4" />Mark all read</Button>
        )}
      </PageHeader>

      <StaggerContainer className="space-y-3">
        {loading ? Array.from({length: 5}).map((_, i) => <PremiumSkeleton key={i} className="h-16 rounded-2xl" />) :
         notifications.length === 0 ? (
          <StaggerItem>
            <GlassCard hover={false}>
              <div className="py-12">
                <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
              </div>
            </GlassCard>
          </StaggerItem>
        ) : notifications.map(n => {
          const Icon = TYPE_ICONS[n.type] ?? Info
          return (
            <StaggerItem key={n.id}>
              <GlassCard className={`transition-colors ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
                <div className="py-4 px-5">
                  <div className="flex items-start gap-4">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 bg-muted/50`}>
                      <Icon className={`size-4 ${TYPE_COLORS[n.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">{format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-lg" onClick={() => markAsRead(n.id)}>
                        <Check className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </div>
  )
}
