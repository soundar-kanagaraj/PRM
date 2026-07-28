
/*
# PRM Core Schema - Partnership Relationship Management

## Summary
This migration creates the full database schema for an enterprise PRM application.

## Tables Created

1. **profiles** - Extended user profiles linked to auth.users
   - id, full_name, avatar_url, role (super_admin/partnership_manager/viewer), phone, title, department, is_active

2. **partners** - Core partner records
   - Basic info: name, legal_name, registration_number, website, industry, category, tier, type, status
   - Contact: primary_contact, secondary_contact, email, phone, mobile, address fields
   - Business: territory, region, technology_focus, products, services, certifications, competencies, distributor, vendor
   - Internal: partnership_owner_id, account_manager_id, notes, tags, internal_comments

3. **agreements** - Partner agreements (1+ per partner)
   - name, type, number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, reminder_days, frequency
   - agreement_owner_id, partner_id

4. **documents** - File references for agreements and partners
   - name, type, file_url, file_size, mime_type, version, tags, category
   - partner_id, agreement_id, uploaded_by

5. **opportunities** - Sales opportunities per partner
   - name, opportunity_id, customer_name, industry, country, estimated_revenue, close_date, stage, probability
   - source, product, service, assigned_owner_id, status, notes, partner_id

6. **revenue_records** - Revenue tracking per partner
   - source, type, month, quarter, financial_year, currency, amount, margin
   - incentives, rebates, mdf, referral_commission, incentive_received, invoice_number, payment_status, partner_id

7. **tasks** - Task management
   - title, description, due_date, priority, status, comments, partner_id, assigned_to_id, created_by_id

8. **activities** - Activity timeline / audit log
   - entity_type, entity_id, action, description, old_value, new_value, ip_address, user_id, partner_id

9. **notifications** - User notifications
   - title, message, type, is_read, link, user_id, partner_id

10. **partner_kpis** - KPI tracking per partner
    - metric_name, metric_value, period, target_value, notes, partner_id

11. **playbook_entries** - Knowledge repository entries
    - title, content, category, tags, is_published, author_id

12. **settings** - Configurable dropdown values
    - category, value, label, sort_order, is_active

## Security
- RLS enabled on all tables
- Authenticated-only access with ownership/role checks
- Profiles created automatically on auth.users insert
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'partnership_manager', 'viewer')),
  phone text,
  title text,
  department text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Settings table (configurable dropdowns)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  value text NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert" ON settings;
CREATE POLICY "settings_insert" ON settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

DROP POLICY IF EXISTS "settings_delete" ON settings;
CREATE POLICY "settings_delete" ON settings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  legal_name text,
  registration_number text,
  website text,
  industry text,
  category text,
  tier text,
  partner_type text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'suspended')),
  primary_contact text,
  secondary_contact text,
  email text,
  phone text,
  mobile text,
  address text,
  country text,
  state text,
  city text,
  postal_code text,
  territory text,
  business_region text,
  technology_focus text,
  products text[],
  services text[],
  certifications text[],
  competencies text[],
  distributor text,
  vendor text,
  partnership_owner_id uuid REFERENCES profiles(id),
  account_manager_id uuid REFERENCES profiles(id),
  notes text,
  tags text[],
  internal_comments text,
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_select" ON partners;
CREATE POLICY "partners_select" ON partners FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "partners_insert" ON partners;
CREATE POLICY "partners_insert" ON partners FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "partners_update" ON partners;
CREATE POLICY "partners_update" ON partners FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "partners_delete" ON partners;
CREATE POLICY "partners_delete" ON partners FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  agreement_name text NOT NULL,
  agreement_type text,
  agreement_number text,
  start_date date,
  end_date date,
  expiry_date date,
  renewal_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'terminated', 'draft')),
  auto_renewal boolean DEFAULT false,
  renewal_reminder_days integer DEFAULT 30,
  renewal_frequency text,
  agreement_owner_id uuid REFERENCES profiles(id),
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agreements_select" ON agreements;
CREATE POLICY "agreements_select" ON agreements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "agreements_insert" ON agreements;
CREATE POLICY "agreements_insert" ON agreements FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "agreements_update" ON agreements;
CREATE POLICY "agreements_update" ON agreements FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "agreements_delete" ON agreements;
CREATE POLICY "agreements_delete" ON agreements FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL,
  name text NOT NULL,
  doc_type text,
  file_url text,
  file_size bigint,
  mime_type text,
  version integer DEFAULT 1,
  tags text[],
  category text,
  uploaded_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "documents_insert" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  opportunity_name text NOT NULL,
  opportunity_ref text,
  customer_name text,
  industry text,
  country text,
  estimated_revenue numeric(15,2) DEFAULT 0,
  expected_close_date date,
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'closed')),
  probability integer DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  source text,
  product text,
  service text,
  assigned_owner_id uuid REFERENCES profiles(id),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'on_hold')),
  notes text,
  lost_reason text,
  currency text DEFAULT 'USD',
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunities_select" ON opportunities;
CREATE POLICY "opportunities_select" ON opportunities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "opportunities_insert" ON opportunities;
CREATE POLICY "opportunities_insert" ON opportunities FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "opportunities_update" ON opportunities;
CREATE POLICY "opportunities_update" ON opportunities FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "opportunities_delete" ON opportunities;
CREATE POLICY "opportunities_delete" ON opportunities FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Revenue records table
CREATE TABLE IF NOT EXISTS revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  revenue_source text,
  revenue_type text,
  month integer CHECK (month >= 1 AND month <= 12),
  quarter integer CHECK (quarter >= 1 AND quarter <= 4),
  financial_year integer,
  currency text DEFAULT 'USD',
  amount numeric(15,2) DEFAULT 0,
  margin numeric(5,2),
  incentives numeric(15,2) DEFAULT 0,
  rebates numeric(15,2) DEFAULT 0,
  mdf numeric(15,2) DEFAULT 0,
  referral_commission numeric(15,2) DEFAULT 0,
  incentive_received boolean DEFAULT false,
  invoice_number text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes text,
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenue_records_select" ON revenue_records;
CREATE POLICY "revenue_records_select" ON revenue_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "revenue_records_insert" ON revenue_records;
CREATE POLICY "revenue_records_insert" ON revenue_records FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "revenue_records_update" ON revenue_records;
CREATE POLICY "revenue_records_update" ON revenue_records FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "revenue_records_delete" ON revenue_records;
CREATE POLICY "revenue_records_delete" ON revenue_records FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  assigned_to_id uuid REFERENCES profiles(id),
  created_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON tasks;
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Activities table (audit/timeline)
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  description text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_id uuid REFERENCES profiles(id),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select" ON activities;
CREATE POLICY "activities_select" ON activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activities_insert" ON activities;
CREATE POLICY "activities_insert" ON activities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activities_delete" ON activities;
CREATE POLICY "activities_delete" ON activities FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read boolean DEFAULT false,
  link text,
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Partner KPIs table
CREATE TABLE IF NOT EXISTS partner_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric(15,2),
  period text,
  target_value numeric(15,2),
  unit text,
  notes text,
  recorded_by uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_kpis_select" ON partner_kpis;
CREATE POLICY "partner_kpis_select" ON partner_kpis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "partner_kpis_insert" ON partner_kpis;
CREATE POLICY "partner_kpis_insert" ON partner_kpis FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "partner_kpis_update" ON partner_kpis;
CREATE POLICY "partner_kpis_update" ON partner_kpis FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "partner_kpis_delete" ON partner_kpis;
CREATE POLICY "partner_kpis_delete" ON partner_kpis FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Playbook entries table
CREATE TABLE IF NOT EXISTS playbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text,
  tags text[],
  is_published boolean DEFAULT false,
  author_id uuid DEFAULT auth.uid() REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playbook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playbook_select" ON playbook_entries;
CREATE POLICY "playbook_select" ON playbook_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "playbook_insert" ON playbook_entries;
CREATE POLICY "playbook_insert" ON playbook_entries FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "playbook_update" ON playbook_entries;
CREATE POLICY "playbook_update" ON playbook_entries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'partnership_manager')));

DROP POLICY IF EXISTS "playbook_delete" ON playbook_entries;
CREATE POLICY "playbook_delete" ON playbook_entries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Seed default settings
INSERT INTO settings (category, value, label, sort_order) VALUES
  ('partner_type', 'reseller', 'Reseller', 1),
  ('partner_type', 'distributor', 'Distributor', 2),
  ('partner_type', 'referral', 'Referral Partner', 3),
  ('partner_type', 'technology', 'Technology Partner', 4),
  ('partner_type', 'alliance', 'Strategic Alliance', 5),
  ('partner_type', 'oem', 'OEM Partner', 6),
  ('partner_tier', 'platinum', 'Platinum', 1),
  ('partner_tier', 'gold', 'Gold', 2),
  ('partner_tier', 'silver', 'Silver', 3),
  ('partner_tier', 'bronze', 'Bronze', 4),
  ('partner_tier', 'registered', 'Registered', 5),
  ('partner_category', 'strategic', 'Strategic', 1),
  ('partner_category', 'preferred', 'Preferred', 2),
  ('partner_category', 'standard', 'Standard', 3),
  ('agreement_type', 'partnership', 'Partnership Agreement', 1),
  ('agreement_type', 'reseller', 'Reseller Agreement', 2),
  ('agreement_type', 'nda', 'NDA', 3),
  ('agreement_type', 'mou', 'MOU', 4),
  ('agreement_type', 'sla', 'SLA', 5),
  ('agreement_type', 'distribution', 'Distribution Agreement', 6),
  ('industry', 'technology', 'Technology', 1),
  ('industry', 'finance', 'Finance & Banking', 2),
  ('industry', 'healthcare', 'Healthcare', 3),
  ('industry', 'manufacturing', 'Manufacturing', 4),
  ('industry', 'retail', 'Retail & E-commerce', 5),
  ('industry', 'telecom', 'Telecommunications', 6),
  ('industry', 'government', 'Government', 7),
  ('industry', 'education', 'Education', 8),
  ('industry', 'energy', 'Energy & Utilities', 9),
  ('revenue_type', 'recurring', 'Recurring Revenue', 1),
  ('revenue_type', 'one_time', 'One-Time Revenue', 2),
  ('revenue_type', 'mdf', 'Market Development Funds', 3),
  ('revenue_type', 'referral', 'Referral Commission', 4),
  ('revenue_type', 'rebate', 'Rebate', 5),
  ('currency', 'USD', 'US Dollar (USD)', 1),
  ('currency', 'EUR', 'Euro (EUR)', 2),
  ('currency', 'GBP', 'British Pound (GBP)', 3),
  ('currency', 'AED', 'UAE Dirham (AED)', 4),
  ('currency', 'SAR', 'Saudi Riyal (SAR)', 5),
  ('currency', 'SGD', 'Singapore Dollar (SGD)', 6),
  ('region', 'north_america', 'North America', 1),
  ('region', 'emea', 'EMEA', 2),
  ('region', 'apac', 'Asia Pacific', 3),
  ('region', 'latam', 'Latin America', 4),
  ('region', 'mena', 'Middle East & Africa', 5)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_agreements_partner ON agreements(partner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_expiry ON agreements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_partner ON opportunities(partner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_revenue_partner ON revenue_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_revenue_year ON revenue_records(financial_year);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_partner ON activities(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
