import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, TrendingUp, DollarSign,
  SquareCheck as CheckSquare, Bell, Settings, LogOut, ChevronDown,
  BookOpen, Activity, ChartBar as BarChart3, FileStack, UserCog, Moon, Sun, Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/theme-provider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarRail,
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

function AppSidebar() {
  const location = useLocation()
  const { profile, isAdmin } = useAuth()

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-5 py-5 border-b border-sidebar-border/50">
        <Link to="/" className="flex items-center group-data-[collapsible=icon]:justify-center">
          <span className="logo-text text-2xl leading-none">Linkit</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 scrollbar-premium">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            <div className="px-3 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
                {group.label}
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="rounded-lg h-9 relative"
                      >
                        <Link to={item.href}>
                          {active && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg"
                              style={{ background: 'var(--sidebar-accent)' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <item.icon className={cn(
                            'size-4 relative z-10 shrink-0 transition-colors',
                            active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80'
                          )} />
                          <span className={cn(
                            'relative z-10 text-sm transition-colors',
                            active ? 'font-semibold text-sidebar-primary' : 'font-medium text-sidebar-foreground/65 group-hover:text-sidebar-foreground'
                          )}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isAdmin && (
          <SidebarGroup className="py-1.5">
            <div className="px-3 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
                Admin
              </span>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="rounded-lg h-9 relative">
                        <Link to={item.href}>
                          {active && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg"
                              style={{ background: 'var(--sidebar-accent)' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <item.icon className={cn('size-4 relative z-10 shrink-0', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80')} />
                          <span className={cn('relative z-10 text-sm', active ? 'font-semibold text-sidebar-primary' : 'font-medium text-sidebar-foreground/65 group-hover:text-sidebar-foreground')}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border/50">
        <Link to="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8 shrink-0 ring-2 ring-sidebar-border/40">
            <AvatarFallback className="text-xs btn-gradient text-white font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.full_name || 'User'}</span>
            <span className="text-[10px] text-sidebar-foreground/45 truncate capitalize">{profile?.role?.replace('_', ' ')}</span>
          </div>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
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
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-lg glass rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                onKeyDown={e => { if (e.key === 'Enter' && results.length > 0) go(results[0].href) }}
              />
              <Kbd className="text-[10px] px-1.5 py-0.5">ESC</Kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto scrollbar-premium p-2">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
              ) : (
                <div className="space-y-0.5">
                  {results.map(item => (
                    <button key={item.href} onClick={() => go(item.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                    >
                      <div className="size-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <item.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
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
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard', '/partners': 'Partners', '/agreements': 'Agreements',
    '/opportunities': 'Opportunities', '/revenue': 'Revenue', '/tasks': 'Tasks',
    '/documents': 'Documents', '/playbook': 'Partnership Playbook', '/reports': 'Reports',
    '/activities': 'Activity Log', '/notifications': 'Notifications', '/settings': 'Settings',
    '/users': 'User Management', '/profile': 'My Profile',
  }
  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'Linkit'

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
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
      <header
        className="h-14 flex items-center px-4 gap-3 sticky top-0 z-40 border-b border-sidebar-border/50"
        style={{ background: 'var(--sidebar)' }}
      >
        <SidebarTrigger className="shrink-0 hover:bg-sidebar-accent/50 rounded-lg size-8" />
        <Separator orientation="vertical" className="h-5 bg-sidebar-border/50" />

        <motion.h1
          key={currentTitle}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-semibold hidden sm:block text-sidebar-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {currentTitle}
        </motion.h1>

        <div className="flex-1" />

        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground/50 border border-sidebar-border/40 cursor-pointer"
        >
          <Search className="size-3.5" />
          <span className="text-xs">Search...</span>
          <Kbd className="text-[10px] px-1 py-0 ml-3">⌘K</Kbd>
        </button>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <AnimatePresence mode="wait">
              <motion.div key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
              >
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </motion.div>
            </AnimatePresence>
          </Button>

          <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground">
                <Avatar className="size-7 ring-2 ring-sidebar-border/40">
                  <AvatarFallback className="text-xs btn-gradient text-white font-semibold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                  {profile?.full_name || 'User'}
                </span>
                <ChevronDown className="size-3 text-sidebar-foreground/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl glass">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate('/profile')}>
                <UserCog className="size-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => navigate('/notifications')}>
                <Bell className="size-4" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="rounded-lg cursor-pointer" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
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
      <div className="flex min-h-screen w-full gradient-mesh">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-auto scrollbar-premium">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
