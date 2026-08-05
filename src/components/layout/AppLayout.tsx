import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, TrendingUp, DollarSign,
  SquareCheck as CheckSquare, Bell, Settings, LogOut, ChevronDown,
  BookOpen, Activity, ChartBar as BarChart3, FileStack, UserCog,
  Moon, Sun, Search, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/theme-provider'
import { useThemeColor, themeColors, type ThemeColor } from '@/contexts/ThemeContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, useSidebar,
} from '@/components/ui/sidebar'
import { Kbd } from '@/components/ui/kbd'

const navGroups = [
  {
    label: 'General',
    items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Partnership',
    items: [
      { title: 'Partners', href: '/partners', icon: LayoutDashboard },
      { title: 'Agreements', href: '/agreements', icon: FileText },
      { title: 'Opportunities', href: '/opportunities', icon: TrendingUp },
      { title: 'Revenue', href: '/revenue', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Tasks', href: '/tasks', icon: CheckSquare },
      { title: 'Documents', href: '/documents', icon: FileStack },
      { title: 'Playbook', href: '/playbook', icon: BookOpen },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Reports', href: '/reports', icon: BarChart3 },
      { title: 'Activities', href: '/activities', icon: Activity },
    ],
  },
]

const adminItems = [
  { title: 'Users', href: '/users', icon: UserCog },
  { title: 'Settings', href: '/settings', icon: Settings },
]

const allNavItems = [...navGroups.flatMap(g => g.items), ...adminItems]

function NavItem({ item, active }: { item: { title: string; href: string; icon: React.ElementType }; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        className={cn(
          'rounded-md h-9 text-[13px] px-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
          active ? 'bg-accent/70' : 'hover:bg-accent/70'
        )}
      >
        <Link to={item.href} className="w-full flex items-center gap-2.5">
          <item.icon className={cn(
            'size-4 shrink-0 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground'
          )} />
          <span className={cn(
            'truncate group-data-[collapsible=icon]:hidden',
            active ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}>
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-start min-w-0">
      <div className="min-w-0">
        <div className="logo-text leading-none">LinkIt</div>
        {!compact && (
          <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
            PRM
          </div>
        )}
      </div>
    </div>
  )
}

function AppSidebar() {
  const location = useLocation()
  const { profile, isAdmin } = useAuth()

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon" className="left-0 top-0 bottom-0 h-full rounded-none border-r border-border/70 bg-sidebar text-sidebar-foreground shadow-none">
      <SidebarHeader className="flex items-center justify-start px-3 py-3 border-b border-sidebar-border/70">
        <Link to="/" className="flex items-center justify-start w-full group-data-[collapsible=icon]:hidden">
          <AppLogo />
        </Link>
        <Link to="/" className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <AppLogo compact />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 scrollbar-thin group-data-[collapsible=icon]:px-1.5">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <div className="px-2.5 pb-1 pt-1.5 group-data-[collapsible=icon]:hidden">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdmin && (
          <SidebarGroup className="py-1">
            <div className="px-2.5 pb-1 pt-1.5 group-data-[collapsible=icon]:hidden">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Admin
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <NavItem key={item.href} item={item} active={isActive(item.href)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 py-2 border-t border-sidebar-border/70">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors group-data-[collapsible=icon]:justify-center"
        >
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-medium">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium text-foreground truncate">{profile?.full_name || 'User'}</span>
            <span className="text-[10px] text-muted-foreground truncate capitalize">{profile?.role?.replace('_', ' ')}</span>
          </div>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ThemeMenu() {
  const { theme, setTheme } = useTheme()
  const { color, setColor } = useThemeColor()
  const [siteScale, setSiteScale] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem('linkit-ui-scale')
    if (saved === '1.5' || saved === '2') {
      setSiteScale(Number(saved))
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-ui-scale', siteScale.toString())
    localStorage.setItem('linkit-ui-scale', siteScale.toString())
  }, [siteScale])

  const sizeOptions = [
    { label: 'Normal', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
          <span className="size-3.5 rounded-full" style={{ background: 'var(--primary)' }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1.5 py-1.5">
          Accent Color
        </DropdownMenuLabel>
        <div className="grid grid-cols-1 gap-0.5 px-0.5 pb-1">
          {themeColors.map((t) => (
            <button
              key={t.id}
              onClick={() => setColor(t.id as ThemeColor)}
              className={cn(
                'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors',
                color === t.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <span className="size-3.5 rounded-full shrink-0" style={{ background: t.swatch }} />
              <span className="flex-1 text-left">{t.label}</span>
              {color === t.id && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1.5 py-1.5">
          Site size
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-0.5 pb-1">
          {sizeOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => setSiteScale(option.value)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-[12px] transition-colors',
                siteScale === option.value ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="rounded-md text-[13px] cursor-pointer"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const results = query
    ? allNavItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    : allNavItems

  function go(href: string) { onClose(); navigate(href) }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/20" />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-md surface-raised rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-border">
              <Search className="size-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages..."
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
                onKeyDown={e => { if (e.key === 'Enter' && results.length > 0) go(results[0].href) }}
              />
              <Kbd className="text-[10px] px-1 py-0.5">ESC</Kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-1">
              {results.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-6">No results found</p>
              ) : (
                <div className="space-y-0.5">
                  {results.map(item => (
                    <button key={item.href} onClick={() => go(item.href)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-left group"
                    >
                      <item.icon className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] text-foreground">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const { toggleSidebar, open } = useSidebar()
  const [searchOpen, setSearchOpen] = useState(false)

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard', '/partners': 'Partners', '/agreements': 'Agreements',
    '/opportunities': 'Opportunities', '/revenue': 'Revenue', '/tasks': 'Tasks',
    '/documents': 'Documents', '/playbook': 'Playbook', '/reports': 'Reports',
    '/activities': 'Activity Log', '/notifications': 'Notifications', '/settings': 'Settings',
    '/users': 'User Management', '/profile': 'My Profile',
  }
  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'LinkIt'

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="h-12 flex items-center px-4 gap-3 sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border/60">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-md shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={toggleSidebar}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </Button>
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentTitle}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="text-[13px] font-medium text-foreground hidden sm:block"
          >
            {currentTitle}
          </motion.h1>
        </AnimatePresence>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground border border-border transition-colors cursor-pointer"
        >
          <Search className="size-3.5" />
          <span className="text-xs">Search...</span>
          <Kbd className="text-[10px] px-1 py-0 ml-2">⌘K</Kbd>
        </button>

        <div className="flex items-center gap-0.5">
          <ThemeMenu />

          <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="size-3.5" />
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-7 pl-1 pr-1.5 rounded-md hover:bg-accent text-foreground">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-medium">
                    {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium hidden sm:block max-w-[100px] truncate">
                  {profile?.full_name || 'User'}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[13px] font-medium leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-[11px] leading-none text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-md text-[13px] cursor-pointer" onClick={() => navigate('/profile')}>
                <UserCog className="size-3.5" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md text-[13px] cursor-pointer" onClick={() => navigate('/notifications')}>
                <Bell className="size-3.5" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="rounded-md text-[13px] cursor-pointer" onClick={handleSignOut}>
                <LogOut className="size-3.5" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export default function AppLayout() {
  const location = useLocation()
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background p-2 sm:p-3">
        <div className="flex min-h-screen w-full overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
            <TopBar />
            <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-auto scrollbar-thin">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <div data-export-root className="min-h-full">
                    <Outlet />
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
