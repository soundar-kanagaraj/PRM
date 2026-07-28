import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

/* ── Animated counter ──────────────────────────────── */
export function AnimatedCounter({ value, format, className }: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: 1400, bounce: 0 })
  const display = useTransform(springValue, (v) => format ? format(v) : Math.round(v).toLocaleString())

  useEffect(() => { if (isInView) motionValue.set(value) }, [isInView, value, motionValue])

  return <motion.span ref={ref} className={cn('tabular-nums', className)}>{display}</motion.span>
}

/* ── Sparkline ──────────────────────────────────────── */
export function Sparkline({ data, color = 'var(--primary)' }: {
  data: number[]
  color?: string
}) {
  const chartData = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={1200}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ── Glass card ─────────────────────────────────────── */
export function GlassCard({ className, children, hover = true, accent = false }: React.ComponentProps<'div'> & { hover?: boolean; accent?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'glass rounded-2xl relative overflow-hidden',
        hover && 'card-hover cursor-default',
        accent && 'card-accent-strip',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/* ── KPI Stat Card with sparkline ───────────────────── */
export function StatCard({ title, value, icon: Icon, format, trend, sparkData, color = 'primary', delay = 0 }: {
  title: string
  value: number
  icon: React.ElementType
  format?: (n: number) => string
  trend?: number
  sparkData?: number[]
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent' | 'secondary'
  delay?: number
}) {
  const palette = {
    primary:     { from: 'from-indigo-500/12', to: 'to-indigo-500/4', icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', spark: 'var(--chart-1)', glow: 'oklch(0.516 0.231 265 / 0.2)' },
    secondary:   { from: 'from-violet-500/12', to: 'to-violet-500/4', icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', spark: 'var(--chart-3)', glow: 'oklch(0.454 0.244 292 / 0.2)' },
    accent:      { from: 'from-cyan-500/12',   to: 'to-cyan-500/4',   icon: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',       spark: 'var(--chart-5)', glow: 'oklch(0.710 0.143 210 / 0.2)' },
    success:     { from: 'from-green-500/12',  to: 'to-green-500/4',  icon: 'bg-green-500/10 text-green-600 dark:text-green-400',    spark: 'var(--chart-2)', glow: 'oklch(0.698 0.173 151 / 0.2)' },
    warning:     { from: 'from-amber-500/12',  to: 'to-amber-500/4',  icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',    spark: 'var(--chart-4)', glow: 'oklch(0.779 0.167 71 / 0.2)' },
    destructive: { from: 'from-red-500/12',    to: 'to-red-500/4',    icon: 'bg-red-500/10 text-red-600 dark:text-red-400',          spark: 'var(--chart-5)', glow: 'oklch(0.620 0.218 24 / 0.2)' },
  }
  const p = palette[color]
  const hasTrend = trend !== undefined
  const trendPositive = (trend ?? 0) > 0
  const trendFlat = trend === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <GlassCard accent className="p-5 group" hover>
        {/* Subtle color wash */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none', p.from, p.to)} />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1.5">
                {title}
              </p>
              <div className="text-2xl font-bold tracking-tight">
                <AnimatedCounter value={value} format={format} />
              </div>
            </div>
            <motion.div
              className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', p.icon)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Icon className="size-5" />
            </motion.div>
          </div>

          {/* Sparkline */}
          {sparkData && sparkData.length > 0 && (
            <div className="mb-2 -mx-1">
              <Sparkline data={sparkData} color={p.spark} />
            </div>
          )}

          {/* Trend indicator */}
          {hasTrend && (
            <div className="flex items-center gap-1.5 mt-1">
              {trendFlat ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 font-medium">
                  <Minus className="size-3" /> No change
                </span>
              ) : trendPositive ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                  <TrendingUp className="size-3" /> +{trend}% vs last period
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400 font-semibold">
                  <TrendingDown className="size-3" /> {trend}% vs last period
                </span>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

/* ── Page header ─────────────────────────────────────── */
export function PageHeader({ title, description, children, section }: {
  title: string
  description?: string
  children?: React.ReactNode
  section?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: section ? 'var(--font-section)' : 'var(--font-display)' }}
        >
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </motion.div>
  )
}

/* ── Status badge ────────────────────────────────────── */
export function StatusBadge({ status, variant }: {
  status: string
  variant?: 'active' | 'inactive' | 'pending' | 'warning' | 'danger' | 'info' | 'success'
}) {
  const styles = {
    active:   'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/25',
    success:  'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/25',
    inactive: 'bg-slate-400/10 text-slate-600 dark:text-slate-400 border-slate-400/25',
    pending:  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    warning:  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    danger:   'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
    info:     'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25',
  }
  const dots = {
    active: 'bg-green-500', success: 'bg-green-500', inactive: 'bg-slate-400',
    pending: 'bg-amber-500', warning: 'bg-amber-500', danger: 'bg-red-500', info: 'bg-indigo-500',
  }
  const v = variant ?? 'info'
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide', styles[v])}>
      <span className={cn('size-1.5 rounded-full shrink-0', dots[v])} />
      <span className="capitalize">{status}</span>
    </span>
  )
}

/* ── Fade-in wrapper ─────────────────────────────────── */
export function FadeIn({ children, delay = 0, className }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Stagger container / item ────────────────────────── */
export function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Empty state ─────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-3xl rounded-full opacity-20 bg-primary scale-150" />
        <div className="relative size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10">
          <Icon className="size-7 text-muted-foreground/50" />
        </div>
      </div>
      <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-section)' }}>{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-xs" style={{ fontFamily: 'var(--font-body)' }}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

/* ── Skeleton ────────────────────────────────────────── */
export function PremiumSkeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-xl', className)} />
}
