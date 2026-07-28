import { useEffect, useState } from 'react'
import { Activity as ActivityIcon, Building2, FileText, TrendingUp, DollarSign, User, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/lib/supabase'
import { format } from 'date-fns'
import { CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader, GlassCard, EmptyState, PremiumSkeleton, StaggerContainer, StaggerItem } from '@/components/shared/premium'

const ENTITY_ICONS: Record<string, React.ElementType> = {
  partner: Building2, agreement: FileText, opportunity: TrendingUp,
  revenue: DollarSign, user: User, settings: Settings,
}

const ENTITY_COLORS: Record<string, string> = {
  partner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  agreement: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  opportunity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  revenue: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

type ActivityWithProfile = Activity & { profiles: { full_name: string } | null }

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => { fetchActivities() }, [])

  async function fetchActivities() {
    setLoading(true)
    const { data } = await supabase
      .from('activities')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setActivities((data ?? []) as ActivityWithProfile[])
    setLoading(false)
  }

  const filtered = entityFilter === 'all' ? activities : activities.filter(a => a.entity_type === entityFilter)
  const entityTypes = [...new Set(activities.map(a => a.entity_type))]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Activity Log" description="System-wide activity history">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40 rounded-xl focus-ring"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <GlassCard>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">{Array.from({length: 8}).map((_, i) => <PremiumSkeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activities recorded" description="Activity will appear here as users interact with the system." />
          ) : (
            <StaggerContainer>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {filtered.map(act => {
                    const Icon = ENTITY_ICONS[act.entity_type] ?? ActivityIcon
                    return (
                      <StaggerItem key={act.id}>
                        <div className="flex gap-4 relative">
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 z-10 ${ENTITY_COLORS[act.entity_type] ?? 'bg-muted text-muted-foreground'}`}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0 pb-0">
                            <p className="text-sm">{act.description ?? `${act.action} on ${act.entity_type}`}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground tabular-nums">{format(new Date(act.created_at), 'MMM d, yyyy h:mm a')}</span>
                              {act.profiles?.full_name && <span className="text-xs text-muted-foreground">· {act.profiles.full_name}</span>}
                              <Badge variant="outline" className="text-xs capitalize">{act.entity_type}</Badge>
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    )
                  })}
                </div>
              </div>
            </StaggerContainer>
          )}
        </CardContent>
      </GlassCard>
    </div>
  )
}
