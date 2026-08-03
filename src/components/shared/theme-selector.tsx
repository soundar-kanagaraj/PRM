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
              'size-6 rounded-full ring-2 transition-all hover:scale-110',
              color === t.id ? 'ring-foreground/40 scale-110' : 'ring-transparent'
            )}
            style={{ background: t.swatch }}
            title={t.label}
          >
            {color === t.id && (
              <Check className="size-3 text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {themeColors.map((t) => (
        <button
          key={t.id}
          onClick={() => setColor(t.id as ThemeColor)}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all',
            color === t.id
              ? 'border-primary/40 bg-primary/5'
              : 'border-border hover:bg-muted/50'
          )}
        >
          <span
            className="size-5 rounded-full shrink-0 ring-1 ring-black/5"
            style={{ background: t.swatch }}
          />
          <span className="text-sm font-medium">{t.label}</span>
          {color === t.id && <Check className="size-3.5 text-primary ml-auto" />}
        </button>
      ))}
    </div>
  )
}
