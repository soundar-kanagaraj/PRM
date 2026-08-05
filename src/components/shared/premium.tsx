import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── AnimatedCounter ── */
export function AnimatedCounter({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 180, damping: 22 })
  const display = useTransform(spring, (v) => (format ? format(Math.round(v)) : Math.round(v).toString()))

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, value, motionValue])

  return <motion.span ref={ref}>{display}</motion.span>
}

/* ── Sparkline ── */
export function Sparkline({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-8">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── GlassCard → Surface (clean card) ── */
export function GlassCard({ children, className, accent = false, ...props }: {
  children: React.ReactNode
  className?: string
  accent?: boolean
  [key: string]: unknown
}) {
  return (
    <div
      className={cn('surface rounded-md', accent && 'border-l-2 border-l-primary', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/* ── StatCard ── */
const colorMap: Record<string, string> = {
  primary: 'var(--primary)',
  secondary: 'var(--chart-2)',
  accent: 'var(--chart-3)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
}

export function StatCard({ title, value, format, icon: Icon, color = 'primary', sparkData, trend, delay = 0 }: {
  title: string
  value: number
  format?: (n: number) => string
  icon: React.ElementType
  color?: keyof typeof colorMap
  sparkData?: number[]
  trend?: { direction: 'up' | 'down' | 'flat'; value: string } | number
  delay?: number
}) {
  const c = colorMap[color] || colorMap.primary
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: [0.4, 0, 0.2, 1] }}
      className="surface px-4 py-3.5"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon className="size-3.5" style={{ color: c }} />
      </div>
      <div className="text-xl font-semibold text-foreground tabular-nums">
        <AnimatedCounter value={value} format={format} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        {trend != null ? (
          (() => {
            const t = typeof trend === 'number'
              ? { direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat', value: `${Math.abs(trend)}%` }
              : trend
            return (
              <div className="flex items-center gap-1 text-[11px]">
                {t.direction === 'up' && <TrendingUp className="size-3 text-success" />}
                {t.direction === 'down' && <TrendingDown className="size-3 text-destructive" />}
                {t.direction === 'flat' && <Minus className="size-3 text-muted-foreground" />}
                <span className={cn(
                  t.direction === 'up' && 'text-success',
                  t.direction === 'down' && 'text-destructive',
                  t.direction === 'flat' && 'text-muted-foreground'
                )}>
                  {t.value}
                </span>
              </div>
            )
          })()
        ) : <span />}
        {sparkData && (
          <div className="w-16 h-6 opacity-60">
            <Sparkline data={sparkData} color={c} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── PageHeader ── */
export function PageHeader({ title, description, children }: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
      <div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/* ── StatusBadge ── */
const badgeColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
}

export function StatusBadge({ status, label, variant }: { status: string; label?: string; variant?: string }) {
  const key = variant || status
  const cls = badgeColors[key] || badgeColors.inactive
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border', cls)}>
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {label || status}
    </span>
  )
}

/* ── FadeIn ── */
export function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── StaggerContainer ── */
export function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── StaggerItem ── */
export function StaggerItem({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, delay, ease: [0.4, 0, 0.2, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── EmptyState ── */
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="size-4.5 text-muted-foreground" />
      </div>
      <h3 className="text-[13px] font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── PremiumSkeleton → Skeleton ── */
export function PremiumSkeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md', className)} />
}
