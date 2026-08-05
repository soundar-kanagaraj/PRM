import { Check } from 'lucide-react'
import { useThemeColor, themeColors, type ThemeColor } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { color, setColor } = useThemeColor()

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {themeColors.map((t) => (
          <button
            key={t.id}
            onClick={() => setColor(t.id as ThemeColor)}
            className={cn(
              'size-5 rounded-full ring-1 transition-all',
              color === t.id ? 'ring-2 ring-foreground/20 scale-110' : 'ring-border hover:scale-105'
            )}
            style={{ background: t.swatch }}
            title={t.label}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {themeColors.map((t) => (
        <button
          key={t.id}
          onClick={() => setColor(t.id as ThemeColor)}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-colors text-[13px]',
            color === t.id
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span className="size-3.5 rounded-full shrink-0" style={{ background: t.swatch }} />
          <span className="flex-1 text-left">{t.label}</span>
          {color === t.id && <Check className="size-3 text-primary" />}
        </button>
      ))}
    </div>
  )
}
