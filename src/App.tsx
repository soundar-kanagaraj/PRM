import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as ColorThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from '@/components/ui/sonner'

import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import PartnersPage from '@/pages/partners/PartnersPage'
import PartnerDetailPage from '@/pages/partners/PartnerDetailPage'
import PartnerFormPage from '@/pages/partners/PartnerFormPage'
import AgreementsPage from '@/pages/agreements/AgreementsPage'
import AgreementFormPage from '@/pages/agreements/AgreementFormPage'
import OpportunitiesPage from '@/pages/opportunities/OpportunitiesPage'
import OpportunityFormPage from '@/pages/opportunities/OpportunityFormPage'
import RevenuePage from '@/pages/revenue/RevenuePage'
import RevenueFormPage from '@/pages/revenue/RevenueFormPage'
import TasksPage from '@/pages/TasksPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ActivitiesPage from '@/pages/ActivitiesPage'
import DocumentsPage from '@/pages/DocumentsPage'
import PlaybookPage from '@/pages/PlaybookPage'
import SettingsPage from '@/pages/SettingsPage'
import ProfilePage from '@/pages/ProfilePage'
import ReportsPage from '@/pages/ReportsPage'
import UsersPage from '@/pages/UsersPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="prm-theme">
      <ColorThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="partners/new" element={<PartnerFormPage />} />
              <Route path="partners/:id" element={<PartnerDetailPage />} />
              <Route path="partners/:id/edit" element={<PartnerFormPage />} />
              <Route path="agreements" element={<AgreementsPage />} />
              <Route path="agreements/new" element={<AgreementFormPage />} />
              <Route path="agreements/:id/edit" element={<AgreementFormPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="opportunities/new" element={<OpportunityFormPage />} />
              <Route path="opportunities/:id/edit" element={<OpportunityFormPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="revenue/new" element={<RevenueFormPage />} />
              <Route path="revenue/:id/edit" element={<RevenueFormPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="playbook" element={<PlaybookPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  )
}
