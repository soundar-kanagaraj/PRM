import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  role: 'super_admin' | 'partnership_manager' | 'viewer'
  phone: string | null
  title: string | null
  department: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Partner = {
  id: string
  partner_name: string
  legal_name: string | null
  registration_number: string | null
  website: string | null
  industry: string | null
  category: string | null
  tier: string | null
  partner_type: string | null
  status: 'active' | 'inactive' | 'prospect' | 'suspended'
  primary_contact: string | null
  secondary_contact: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  country: string | null
  state: string | null
  city: string | null
  postal_code: string | null
  territory: string | null
  business_region: string | null
  technology_focus: string | null
  products: string[] | null
  services: string[] | null
  certifications: string[] | null
  competencies: string[] | null
  distributor: string | null
  vendor: string | null
  partnership_owner_id: string | null
  account_manager_id: string | null
  notes: string | null
  tags: string[] | null
  internal_comments: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Agreement = {
  id: string
  partner_id: string
  agreement_name: string
  agreement_type: string | null
  agreement_number: string | null
  start_date: string | null
  end_date: string | null
  expiry_date: string | null
  renewal_date: string | null
  status: 'active' | 'expired' | 'pending' | 'terminated' | 'draft'
  auto_renewal: boolean
  renewal_reminder_days: number
  renewal_frequency: string | null
  agreement_owner_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Opportunity = {
  id: string
  partner_id: string
  opportunity_name: string
  opportunity_ref: string | null
  customer_name: string | null
  industry: string | null
  country: string | null
  estimated_revenue: number
  expected_close_date: string | null
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'closed'
  probability: number
  source: string | null
  product: string | null
  service: string | null
  assigned_owner_id: string | null
  status: 'open' | 'closed' | 'on_hold'
  notes: string | null
  lost_reason: string | null
  currency: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export type RevenueRecord = {
  id: string
  partner_id: string
  revenue_source: string | null
  revenue_type: string | null
  month: number | null
  quarter: number | null
  financial_year: number | null
  currency: string
  amount: number
  margin: number | null
  incentives: number
  rebates: number
  mdf: number
  referral_commission: number
  incentive_received: boolean
  invoice_number: string | null
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  partner_id: string | null
  assigned_to_id: string | null
  created_by: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type Activity = {
  id: string
  entity_type: string
  entity_id: string | null
  action: string
  description: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  user_id: string | null
  partner_id: string | null
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string | null
  type: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  link: string | null
  partner_id: string | null
  created_at: string
}

export type Document = {
  id: string
  partner_id: string | null
  agreement_id: string | null
  name: string
  doc_type: string | null
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  version: number
  tags: string[] | null
  category: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export type Setting = {
  id: string
  category: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
}
