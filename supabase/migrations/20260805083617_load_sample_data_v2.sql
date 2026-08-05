/*
# Load Sample Data

## Summary
Populates all tables with realistic sample data for a PRM application.
Data includes: 12 partners, 15 agreements, 18 opportunities, 24 revenue records,
12 tasks, 15 activities, 8 notifications, 10 documents, 6 playbook entries, 12 partner KPIs.

## Approach
Uses a DO block to insert partners with gen_random_uuid() and stores their IDs in variables
for foreign key references in subsequent inserts.
*/

DO $$
DECLARE
  v_admin uuid;
  v_manager uuid;
  v_p1 uuid; v_p2 uuid; v_p3 uuid; v_p4 uuid; v_p5 uuid; v_p6 uuid;
  v_p7 uuid; v_p8 uuid; v_p9 uuid; v_p10 uuid; v_p11 uuid; v_p12 uuid;
  v_a1 uuid; v_a2 uuid; v_a3 uuid; v_a4 uuid; v_a5 uuid; v_a6 uuid;
  v_a7 uuid; v_a8 uuid; v_a9 uuid; v_a10 uuid; v_a11 uuid; v_a12 uuid;
  v_a13 uuid; v_a14 uuid; v_a15 uuid;
BEGIN
  SELECT id INTO v_admin FROM profiles WHERE role = 'super_admin' LIMIT 1;
  SELECT id INTO v_manager FROM profiles WHERE role = 'partnership_manager' LIMIT 1;

  -- ============ PARTNERS (12) ============
  INSERT INTO partners (
    partner_name, legal_name, registration_number, website, industry, category, tier, partner_type,
    status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city,
    postal_code, territory, business_region, technology_focus, products, services, certifications,
    competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags
  ) VALUES
  (
    'TechFlow Systems', 'TechFlow Systems Inc.', 'TF-2018-44120',
    'https://techflow-systems.com', 'technology', 'strategic', 'platinum', 'reseller',
    'active', 'Michael Rodriguez', 'Jennifer Park', 'partnerships@techflow-systems.com',
    '+1-512-555-0142', '+1-512-555-0188', '4200 Congress Ave, Suite 300', 'United States',
    'Texas', 'Austin', '78701', 'North America', 'north_america',
    'Cloud Infrastructure, DevOps, Kubernetes',
    ARRAY['CloudSync Pro', 'DataFlow Analytics', 'SecureGate VPN'],
    ARRAY['Managed Services', 'Cloud Migration', 'DevOps Consulting'],
    ARRAY['AWS Advanced Tier', 'Kubernetes Certified', 'ISO 27001'],
    ARRAY['Cloud Architecture', 'DevOps Automation'],
    'TechFlow Distribution LLC', 'TechFlow Systems',
    v_admin, v_manager,
    'Top-performing partner with strong technical capabilities. Key ally in cloud transformation deals.',
    ARRAY['priority', 'cloud-expert', 'high-revenue']
  )
  RETURNING id INTO v_p1;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Nexus Digital Solutions', 'Nexus Digital Solutions Ltd.', 'NX-2019-33810', 'https://nexusdigital.io', 'technology', 'preferred', 'gold', 'technology', 'active', 'David Kim', 'Amanda Foster', 'partnerships@nexusdigital.io', '+44-20-7946-0123', '+44-20-7946-0199', '71 Fenchurch Street', 'United Kingdom', 'England', 'London', 'EC3M 4BS', 'EMEA', 'emea', 'AI/ML, Data Analytics, Enterprise Software', ARRAY['NexusAI Platform', 'DataLake Enterprise', 'InsightHub BI'], ARRAY['AI Implementation', 'Data Engineering', 'BI Consulting'], ARRAY['Microsoft Gold Partner', 'Google Cloud Partner'], ARRAY['AI/ML Solutions', 'Data Analytics'], NULL, 'Nexus Digital Solutions', v_manager, v_manager, 'Strong EMEA presence. Expanding AI practice rapidly.', ARRAY['emea', 'ai-ml', 'growing'])
  RETURNING id INTO v_p2;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Helix Healthcare Partners', 'Helix Healthcare Partners LLC', 'HX-2020-55120', 'https://helixhealthpartners.com', 'healthcare', 'preferred', 'gold', 'referral', 'active', 'Dr. Emily Watson', 'Robert Chen', 'partners@helixhealthpartners.com', '+1-617-555-0234', '+1-617-555-0278', '200 Longwood Medical Area', 'United States', 'Massachusetts', 'Boston', '02115', 'North America', 'north_america', 'Healthcare IT, Medical Devices, Telemedicine', ARRAY['HelixConnect', 'MedFlow EHR', 'TeleHealth Pro'], ARRAY['Healthcare IT Consulting', 'HIPAA Compliance', 'Telemedicine Setup'], ARRAY['HIPAA Certified', 'HL7 FHIR Expert'], ARRAY['Healthcare IT', 'Medical Device Integration'], NULL, 'Helix Healthcare Partners', v_admin, v_admin, 'Specialized healthcare partner. Strong relationships with hospital networks.', ARRAY['healthcare', 'compliance-expert'])
  RETURNING id INTO v_p3;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Quantum Financial Services', 'Quantum Financial Services Pvt Ltd', 'QF-2017-88230', 'https://quantumfin.in', 'finance', 'strategic', 'platinum', 'distributor', 'active', 'Priya Sharma', 'Rajesh Kumar', 'partnerships@quantumfin.in', '+91-80-4567-8900', '+91-80-4567-8999', 'Prestige Tech Park, Marathahalli', 'India', 'Karnataka', 'Bengaluru', '560103', 'Asia Pacific', 'apac', 'FinTech, Payment Processing, Banking Software', ARRAY['QuantumPay', 'BankSphere Core', 'FinFlow Analytics'], ARRAY['Payment Gateway Integration', 'Banking Software Implementation'], ARRAY['PCI DSS Certified', 'RBI Approved', 'ISO 27001'], ARRAY['FinTech Solutions', 'Payment Systems'], 'Quantum Distribution', 'Quantum Financial Services', v_admin, v_manager, 'Largest distributor in APAC. Critical for fintech market penetration.', ARRAY['apac', 'fintech', 'distributor', 'high-revenue'])
  RETURNING id INTO v_p4;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Apex Manufacturing Group', 'Apex Manufacturing Group GmbH', 'AM-2016-77120', 'https://apex-mfg.de', 'manufacturing', 'standard', 'silver', 'technology', 'active', 'Hans Mueller', 'Katrin Weber', 'partners@apex-mfg.de', '+49-30-123456-00', '+49-30-123456-99', 'Friedrichstrasse 68', 'Germany', 'Berlin', 'Berlin', '10117', 'EMEA', 'emea', 'IoT, Industrial Automation, Industry 4.0', ARRAY['ApexIoT Platform', 'FactorySync', 'Predictive Maintenance Pro'], ARRAY['IoT Implementation', 'Industry 4.0 Consulting'], ARRAY['ISO 9001', 'IEC 62443'], ARRAY['Industrial IoT', 'Automation'], NULL, 'Apex Manufacturing Group', v_manager, v_manager, 'Industrial IoT specialist. Growing pipeline in manufacturing sector.', ARRAY['emea', 'iot', 'industrial'])
  RETURNING id INTO v_p5;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('CloudPeak Solutions', 'CloudPeak Solutions Inc.', 'CP-2021-22980', 'https://cloudpeak.io', 'technology', 'preferred', 'gold', 'reseller', 'active', 'Alex Thompson', 'Maria Garcia', 'partners@cloudpeak.io', '+1-415-555-0345', '+1-415-555-0399', '535 Mission Street, Floor 14', 'United States', 'California', 'San Francisco', '94105', 'North America', 'north_america', 'Cloud Migration, Serverless, Cloud Security', ARRAY['CloudPeak Migrate', 'ServerlessKit', 'SecureCloud Suite'], ARRAY['Cloud Migration Services', 'Serverless Architecture', 'Security Audits'], ARRAY['AWS Solutions Provider', 'Azure Expert'], ARRAY['Cloud Migration', 'Serverless'], NULL, 'CloudPeak Solutions', v_admin, v_manager, 'Fast-growing cloud partner. Excellent at closing mid-market deals.', ARRAY['priority', 'cloud', 'fast-growing'])
  RETURNING id INTO v_p6;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Verde Energy Solutions', 'Verde Energy Solutions Ltd.', 'VE-2019-99450', 'https://verde-energy.com', 'energy', 'standard', 'silver', 'referral', 'active', 'Carlos Mendez', 'Isabella Silva', 'partners@verde-energy.com', '+55-11-3456-7890', '+55-11-3456-7899', 'Av. Paulista 1578', 'Brazil', 'Sao Paulo', 'Sao Paulo', '01310-200', 'Latin America', 'latam', 'Smart Grid, Renewable Energy Tech, Energy Analytics', ARRAY['VerdeGrid', 'SolarTrack', 'EnergyFlow BI'], ARRAY['Smart Grid Implementation', 'Energy Consulting'], ARRAY['ISO 50001'], ARRAY['Smart Grid', 'Renewable Energy'], NULL, 'Verde Energy Solutions', v_manager, v_manager, 'Key partner for LATAM energy sector expansion.', ARRAY['latam', 'energy', 'renewable'])
  RETURNING id INTO v_p7;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Skyline Telecom Partners', 'Skyline Telecom Partners LLC', 'ST-2015-66780', 'https://skylinetelecom.com', 'telecom', 'strategic', 'platinum', 'alliance', 'active', 'James OBrien', 'Sophie Martin', 'alliance@skylinetelecom.com', '+1-972-555-0456', '+1-972-555-0499', '2200 Ross Avenue, Suite 4000', 'United States', 'Texas', 'Dallas', '75201', 'North America', 'north_america', '5G, Network Infrastructure, Edge Computing', ARRAY['SkylineEdge', '5GConnect', 'NetworkFlow'], ARRAY['Network Deployment', '5G Consulting', 'Edge Computing Setup'], ARRAY['Cisco Gold', 'Nokia Partner'], ARRAY['5G Networks', 'Edge Computing'], NULL, 'Skyline Telecom Partners', v_admin, v_admin, 'Strategic alliance partner for telecom infrastructure. Multi-year agreements in place.', ARRAY['priority', 'telecom', 'alliance', 'high-revenue'])
  RETURNING id INTO v_p8;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('BrightPath Education', 'BrightPath Education Technologies Ltd.', 'BP-2022-11230', 'https://brightpath-edu.com', 'education', 'standard', 'bronze', 'technology', 'active', 'Lisa Anderson', 'Tom Wright', 'partners@brightpath-edu.com', '+61-2-8765-4321', '+61-2-8765-4399', '1 Market Street, Level 12', 'Australia', 'NSW', 'Sydney', '2000', 'Asia Pacific', 'apac', 'EdTech, Learning Management Systems, E-Learning', ARRAY['BrightPath LMS', 'LearnSphere', 'EduAnalytics'], ARRAY['LMS Implementation', 'E-Learning Content Development'], ARRAY['SCORM Compliant'], ARRAY['EdTech', 'E-Learning'], NULL, 'BrightPath Education', v_manager, v_manager, 'Newer partner in APAC education sector. Building pipeline.', ARRAY['apac', 'education', 'new'])
  RETURNING id INTO v_p9;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('DataBridge Analytics', 'DataBridge Analytics Inc.', 'DB-2020-33450', 'https://databridge.ai', 'technology', 'preferred', 'gold', 'technology', 'active', 'Kevin Zhang', 'Rachel Cohen', 'partners@databridge.ai', '+1-206-555-0567', '+1-206-555-0599', '1201 Third Avenue, Floor 25', 'United States', 'Washington', 'Seattle', '98101', 'North America', 'north_america', 'Data Engineering, BI, Predictive Analytics', ARRAY['DataBridge Platform', 'PredictAI', 'BIHub Enterprise'], ARRAY['Data Strategy Consulting', 'BI Implementation', 'ML Model Development'], ARRAY['Snowflake Partner', 'Databricks Partner'], ARRAY['Data Engineering', 'Predictive Analytics'], NULL, 'DataBridge Analytics', v_admin, v_manager, 'Strong data/analytics practice. Co-sell motion is maturing well.', ARRAY['priority', 'data', 'analytics'])
  RETURNING id INTO v_p10;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('GlobalRetail Connect', 'GlobalRetail Connect FZ-LLC', 'GR-2018-77890', 'https://globalretailconnect.com', 'retail', 'standard', 'silver', 'distributor', 'inactive', 'Ahmed Al-Rashid', 'Fatima Al-Zahra', 'partners@globalretailconnect.com', '+971-4-123-4567', '+971-4-123-4599', 'Dubai Internet City, Building 12', 'United Arab Emirates', 'Dubai', 'Dubai', '500001', 'Middle East & Africa', 'mena', 'E-commerce, POS Systems, Retail Analytics', ARRAY['RetailSync', 'POSFlow', 'CommerceAnalytics'], ARRAY['Retail IT Implementation', 'E-commerce Setup'], ARRAY['PCI DSS Certified'], ARRAY['Retail Technology', 'E-commerce'], 'GlobalRetail Distribution', 'GlobalRetail Connect', v_manager, v_manager, 'MENA retail distributor. Currently inactive - reviewing partnership terms.', ARRAY['mena', 'retail', 'inactive'])
  RETURNING id INTO v_p11;

  INSERT INTO partners (partner_name, legal_name, registration_number, website, industry, category, tier, partner_type, status, primary_contact, secondary_contact, email, phone, mobile, address, country, state, city, postal_code, territory, business_region, technology_focus, products, services, certifications, competencies, distributor, vendor, partnership_owner_id, account_manager_id, notes, tags) VALUES
  ('Pinnacle Government Solutions', 'Pinnacle Government Solutions LLC', 'PG-2017-55670', 'https://pinnaclegov.com', 'government', 'strategic', 'gold', 'alliance', 'prospect', 'Robert Johnson', 'Patricia Davis', 'partners@pinnaclegov.com', '+1-703-555-0678', '+1-703-555-0699', '4000 Wilson Blvd, Suite 800', 'United States', 'Virginia', 'Arlington', '22203', 'North America', 'north_america', 'Government IT, Cybersecurity, Compliance', ARRAY['GovSecure', 'ComplianceHub', 'FedCloud'], ARRAY['Government IT Consulting', 'Security Compliance', 'FedRAMP Implementation'], ARRAY['FedRAMP Certified', 'FISMA Compliant', 'ISO 27001'], ARRAY['Government IT', 'Cybersecurity'], NULL, 'Pinnacle Government Solutions', v_admin, v_admin, 'Prospective partner for government sector. Currently in negotiation phase.', ARRAY['government', 'prospect', 'cybersecurity'])
  RETURNING id INTO v_p12;

  -- ============ AGREEMENTS (15) ============
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p1, 'TechFlow Master Reseller Agreement', 'reseller', 'AGR-TF-2018-001', '2018-06-01', '2026-05-31', '2026-05-31', '2026-04-01', 'active', true, 60, 'Annual', v_manager, 'Auto-renews annually. Includes updated product catalog each cycle.')
  RETURNING id INTO v_a1;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p1, 'TechFlow NDA', 'nda', 'AGR-TF-2018-002', '2018-06-01', '2028-05-31', '2028-05-31', NULL, 'active', true, 30, NULL, v_manager, 'Standard mutual NDA.')
  RETURNING id INTO v_a2;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p2, 'Nexus Digital Partnership Agreement', 'partnership', 'AGR-NX-2019-001', '2019-09-15', '2026-09-14', '2026-09-14', '2026-08-01', 'active', true, 45, 'Annual', v_manager, 'Partnership renewed in 2023. Strong AI practice collaboration.')
  RETURNING id INTO v_a3;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p3, 'Helix Healthcare Referral Agreement', 'partnership', 'AGR-HX-2020-001', '2020-03-10', '2026-03-09', '2026-03-09', '2026-02-01', 'active', true, 30, 'Annual', v_admin, 'Referral-based partnership with revenue sharing.')
  RETURNING id INTO v_a4;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p4, 'Quantum Financial Distribution Agreement', 'distribution', 'AGR-QF-2017-001', '2017-11-01', '2027-10-31', '2027-10-31', '2027-09-01', 'active', true, 60, 'Annual', v_manager, 'Exclusive distribution rights for APAC region.')
  RETURNING id INTO v_a5;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p4, 'Quantum Financial SLA', 'sla', 'AGR-QF-2017-002', '2017-11-01', '2026-10-31', '2026-10-31', NULL, 'active', true, 30, NULL, v_manager, 'Service level agreement for support response times.')
  RETURNING id INTO v_a6;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p5, 'Apex Manufacturing MOU', 'mou', 'AGR-AM-2016-001', '2016-04-20', '2026-04-19', '2026-04-19', '2026-03-01', 'active', true, 30, 'Annual', v_manager, 'Memorandum of understanding for joint IoT initiatives.')
  RETURNING id INTO v_a7;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p6, 'CloudPeak Reseller Agreement', 'reseller', 'AGR-CP-2021-001', '2021-08-01', '2026-07-31', '2026-07-31', '2026-06-01', 'active', true, 30, 'Annual', v_manager, 'Reseller agreement with volume-based tiering.')
  RETURNING id INTO v_a8;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p7, 'Verde Energy Referral Agreement', 'partnership', 'AGR-VE-2019-001', '2019-05-15', '2026-05-14', '2026-05-14', '2026-04-01', 'active', true, 30, 'Annual', v_manager, 'Referral partnership for LATAM energy sector.')
  RETURNING id INTO v_a9;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p8, 'Skyline Strategic Alliance Agreement', 'partnership', 'AGR-ST-2015-001', '2015-01-10', '2027-01-09', '2027-01-09', '2026-12-01', 'active', true, 60, 'Annual', v_admin, 'Strategic alliance for joint telecom infrastructure offerings.')
  RETURNING id INTO v_a10;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p8, 'Skyline NDA', 'nda', 'AGR-ST-2015-002', '2015-01-10', '2030-01-09', '2030-01-09', NULL, 'active', true, 30, NULL, v_admin, 'Mutual NDA covering joint product development.')
  RETURNING id INTO v_a11;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p9, 'BrightPath Education Partnership', 'partnership', 'AGR-BP-2022-001', '2022-07-01', '2026-06-30', '2026-06-30', '2026-05-01', 'draft', false, 30, 'Annual', v_manager, 'New partnership. Draft stage - awaiting legal review.')
  RETURNING id INTO v_a12;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p10, 'DataBridge Technology Partnership', 'partnership', 'AGR-DB-2020-001', '2020-11-15', '2026-11-14', '2026-11-14', '2026-10-01', 'active', true, 45, 'Annual', v_manager, 'Technology partnership for joint data analytics offerings.')
  RETURNING id INTO v_a13;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p11, 'GlobalRetail Distribution Agreement', 'distribution', 'AGR-GR-2018-001', '2018-02-01', '2025-01-31', '2025-01-31', NULL, 'expired', false, 30, 'Annual', v_manager, 'Expired. Under review for potential renewal.')
  RETURNING id INTO v_a14;
  INSERT INTO agreements (partner_id, agreement_name, agreement_type, agreement_number, start_date, end_date, expiry_date, renewal_date, status, auto_renewal, renewal_reminder_days, renewal_frequency, agreement_owner_id, notes) VALUES
  (v_p12, 'Pinnacle Government Alliance Agreement', 'partnership', 'AGR-PG-2024-001', '2024-01-15', '2026-01-14', '2026-01-14', NULL, 'pending', false, 30, 'Annual', v_admin, 'Pending signature. Awaiting government compliance review.')
  RETURNING id INTO v_a15;

  -- ============ OPPORTUNITIES (18) ============
  INSERT INTO opportunities (partner_id, opportunity_name, opportunity_ref, customer_name, industry, country, estimated_revenue, expected_close_date, stage, probability, source, product, service, assigned_owner_id, status, notes, currency) VALUES
  (v_p1, 'CloudSync Pro - Enterprise Rollout', 'OPP-2024-001', 'Global Manufacturing Corp', 'manufacturing', 'United States', 450000, '2026-09-30', 'negotiation', 70, 'Partner Referral', 'CloudSync Pro', 'Cloud Migration', v_manager, 'open', 'Large enterprise deal. Finalizing contract terms.', 'USD'),
  (v_p1, 'DataFlow Analytics - Financial Services', 'OPP-2024-002', 'First National Bank', 'finance', 'United States', 280000, '2026-08-15', 'proposal', 50, 'Direct Lead', 'DataFlow Analytics', 'BI Consulting', v_manager, 'open', 'Proposal sent. Awaiting feedback from procurement.', 'USD'),
  (v_p2, 'NexusAI Platform - Smart City Initiative', 'OPP-2024-003', 'Barcelona City Council', 'government', 'Spain', 620000, '2026-11-30', 'qualified', 40, 'Partner Referral', 'NexusAI Platform', 'AI Implementation', v_manager, 'open', 'Smart city AI pilot. Strong interest from city officials.', 'EUR'),
  (v_p3, 'TeleHealth Pro - Hospital Network', 'OPP-2024-004', 'Mayo Clinic Network', 'healthcare', 'United States', 380000, '2026-07-31', 'negotiation', 65, 'Partner Referral', 'TeleHealth Pro', 'Telemedicine Setup', v_admin, 'open', 'Multi-hospital telehealth deployment. Negotiating pricing.', 'USD'),
  (v_p4, 'QuantumPay - National Bank Rollout', 'OPP-2024-005', 'State Bank of India', 'finance', 'India', 1200000, '2026-10-15', 'negotiation', 75, 'Direct Lead', 'QuantumPay', 'Payment Gateway Integration', v_manager, 'open', 'Major deal. National rollout across 5000+ branches.', 'USD'),
  (v_p4, 'BankSphere Core - Regional Bank', 'OPP-2024-006', 'HDFC Bank', 'finance', 'India', 340000, '2026-09-01', 'proposal', 55, 'Partner Referral', 'BankSphere Core', 'Banking Software Implementation', v_manager, 'open', 'Regional banking software upgrade.', 'USD'),
  (v_p5, 'ApexIoT - Smart Factory', 'OPP-2024-007', 'BMW Group', 'manufacturing', 'Germany', 520000, '2026-12-15', 'qualified', 35, 'Direct Lead', 'ApexIoT Platform', 'IoT Implementation', v_manager, 'open', 'Smart factory IoT pilot at Munich plant.', 'EUR'),
  (v_p6, 'CloudPeak Migrate - SaaS Company', 'OPP-2024-008', 'FastGrowing SaaS Inc', 'technology', 'United States', 195000, '2026-08-20', 'proposal', 60, 'Partner Referral', 'CloudPeak Migrate', 'Cloud Migration', v_manager, 'open', 'Full cloud migration for mid-size SaaS company.', 'USD'),
  (v_p6, 'SecureCloud Suite - Healthcare Provider', 'OPP-2024-009', 'Regional Health Network', 'healthcare', 'United States', 240000, '2026-10-31', 'qualified', 45, 'Direct Lead', 'SecureCloud Suite', 'Security Audits', v_manager, 'open', 'HIPAA-compliant cloud security assessment.', 'USD'),
  (v_p7, 'VerdeGrid - National Energy Grid', 'OPP-2024-010', 'Petrobras Energy', 'energy', 'Brazil', 890000, '2027-01-31', 'lead', 20, 'Direct Lead', 'VerdeGrid', 'Smart Grid Implementation', v_manager, 'open', 'Early stage. Smart grid modernization project.', 'USD'),
  (v_p8, '5GConnect - Telecom Expansion', 'OPP-2024-011', 'Verizon Communications', 'telecom', 'United States', 1500000, '2026-09-30', 'negotiation', 80, 'Strategic Alliance', '5GConnect', 'Network Deployment', v_admin, 'open', 'Major 5G network expansion deal. Finalizing SOW.', 'USD'),
  (v_p8, 'SkylineEdge - Edge Computing Pilot', 'OPP-2024-012', 'AT&T', 'telecom', 'United States', 320000, '2026-07-15', 'won', 100, 'Strategic Alliance', 'SkylineEdge', 'Edge Computing Setup', v_admin, 'closed', 'WON! Contract signed. Deployment starting Q3.', 'USD'),
  (v_p9, 'BrightPath LMS - University System', 'OPP-2024-013', 'University of Sydney', 'education', 'Australia', 175000, '2026-09-15', 'proposal', 50, 'Direct Lead', 'BrightPath LMS', 'LMS Implementation', v_manager, 'open', 'University-wide LMS replacement project.', 'USD'),
  (v_p10, 'DataBridge Platform - Retail Analytics', 'OPP-2024-014', 'Woolworths Group', 'retail', 'Australia', 410000, '2026-10-31', 'qualified', 40, 'Partner Referral', 'DataBridge Platform', 'BI Implementation', v_manager, 'open', 'Retail analytics platform for 200+ stores.', 'USD'),
  (v_p10, 'PredictAI - Financial Forecasting', 'OPP-2024-015', 'Goldman Sachs', 'finance', 'United States', 680000, '2026-11-15', 'negotiation', 60, 'Direct Lead', 'PredictAI', 'ML Model Development', v_admin, 'open', 'AI-driven financial forecasting platform. High interest.', 'USD'),
  (v_p1, 'SecureGate VPN - Government Agency', 'OPP-2024-016', 'Department of Defense', 'government', 'United States', 560000, '2026-08-31', 'won', 100, 'Direct Lead', 'SecureGate VPN', 'Security Compliance', v_admin, 'closed', 'WON! FedRAMP-compliant VPN deployment.', 'USD'),
  (v_p2, 'DataLake Enterprise - Pharma Research', 'OPP-2024-017', 'Novartis Pharma', 'healthcare', 'Switzerland', 440000, '2026-06-30', 'lost', 0, 'Direct Lead', 'DataLake Enterprise', 'Data Engineering', v_manager, 'closed', 'LOST - competitor won on price. Lessons learned for future deals.', 'EUR'),
  (v_p12, 'GovSecure - Federal Agency Pilot', 'OPP-2024-018', 'Department of Homeland Security', 'government', 'United States', 720000, '2027-02-28', 'lead', 25, 'Direct Lead', 'GovSecure', 'Government IT Consulting', v_admin, 'open', 'Early stage federal opportunity. Long sales cycle expected.', 'USD');

  -- ============ REVENUE RECORDS (24) ============
  INSERT INTO revenue_records (partner_id, revenue_source, revenue_type, month, quarter, financial_year, currency, amount, margin, incentives, rebates, mdf, referral_commission, incentive_received, invoice_number, payment_status, notes, created_by) VALUES
  (v_p1, 'CloudSync Pro License', 'recurring', 1, 1, 2025, 'USD', 45000.00, 18.50, 2000.00, 1500.00, 1000.00, 0.00, true, 'INV-2025-0001', 'paid', 'Q1 recurring license revenue', v_admin),
  (v_p1, 'DataFlow Analytics', 'recurring', 1, 1, 2025, 'USD', 28000.00, 22.00, 1200.00, 800.00, 500.00, 0.00, true, 'INV-2025-0002', 'paid', NULL, v_admin),
  (v_p1, 'SecureGate VPN', 'recurring', 2, 1, 2025, 'USD', 32000.00, 25.00, 1500.00, 1000.00, 750.00, 0.00, true, 'INV-2025-0003', 'paid', NULL, v_admin),
  (v_p1, 'CloudSync Pro License', 'recurring', 4, 2, 2025, 'USD', 48000.00, 19.00, 2200.00, 1600.00, 1100.00, 0.00, true, 'INV-2025-0004', 'paid', 'Q2 revenue with volume bonus', v_admin),
  (v_p1, 'Professional Services', 'one_time', 4, 2, 2025, 'USD', 85000.00, 35.00, 0.00, 0.00, 0.00, 0.00, false, 'INV-2025-0005', 'paid', 'One-time implementation services', v_admin),
  (v_p1, 'CloudSync Pro License', 'recurring', 7, 3, 2025, 'USD', 52000.00, 20.00, 2500.00, 1800.00, 1200.00, 0.00, true, 'INV-2025-0006', 'paid', NULL, v_admin),
  (v_p2, 'NexusAI Platform', 'recurring', 1, 1, 2025, 'EUR', 38000.00, 21.00, 1800.00, 1200.00, 800.00, 0.00, true, 'INV-2025-0010', 'paid', NULL, v_admin),
  (v_p2, 'DataLake Enterprise', 'recurring', 2, 1, 2025, 'EUR', 25000.00, 24.00, 1000.00, 700.00, 500.00, 0.00, true, 'INV-2025-0011', 'paid', NULL, v_admin),
  (v_p2, 'InsightHub BI', 'recurring', 4, 2, 2025, 'EUR', 30000.00, 22.00, 1400.00, 900.00, 600.00, 0.00, true, 'INV-2025-0012', 'paid', NULL, v_admin),
  (v_p2, 'AI Implementation', 'one_time', 5, 2, 2025, 'EUR', 65000.00, 38.00, 0.00, 0.00, 0.00, 0.00, false, 'INV-2025-0013', 'paid', 'Smart city AI pilot', v_admin),
  (v_p3, 'TeleHealth Pro', 'recurring', 1, 1, 2025, 'USD', 22000.00, 20.00, 800.00, 500.00, 300.00, 0.00, true, 'INV-2025-0020', 'paid', NULL, v_admin),
  (v_p3, 'MedFlow EHR', 'recurring', 4, 2, 2025, 'USD', 28000.00, 23.00, 1000.00, 700.00, 400.00, 0.00, true, 'INV-2025-0021', 'paid', NULL, v_admin),
  (v_p3, 'Healthcare IT Consulting', 'one_time', 6, 2, 2025, 'USD', 45000.00, 40.00, 0.00, 0.00, 0.00, 0.00, false, 'INV-2025-0022', 'pending', 'Hospital network consulting', v_admin),
  (v_p4, 'QuantumPay', 'recurring', 1, 1, 2025, 'USD', 120000.00, 15.00, 5000.00, 3500.00, 2000.00, 0.00, true, 'INV-2025-0030', 'paid', 'Large transaction volume', v_admin),
  (v_p4, 'BankSphere Core', 'recurring', 1, 1, 2025, 'USD', 85000.00, 18.00, 3000.00, 2000.00, 1200.00, 0.00, true, 'INV-2025-0031', 'paid', NULL, v_admin),
  (v_p4, 'QuantumPay', 'recurring', 4, 2, 2025, 'USD', 135000.00, 16.00, 5500.00, 3800.00, 2200.00, 0.00, true, 'INV-2025-0032', 'paid', NULL, v_admin),
  (v_p4, 'FinFlow Analytics', 'recurring', 7, 3, 2025, 'USD', 92000.00, 19.00, 4000.00, 2800.00, 1500.00, 0.00, true, 'INV-2025-0033', 'paid', NULL, v_admin),
  (v_p6, 'CloudPeak Migrate', 'one_time', 3, 1, 2025, 'USD', 55000.00, 32.00, 0.00, 0.00, 0.00, 0.00, false, 'INV-2025-0040', 'paid', 'Cloud migration project', v_admin),
  (v_p6, 'ServerlessKit', 'recurring', 4, 2, 2025, 'USD', 18000.00, 26.00, 600.00, 400.00, 250.00, 0.00, true, 'INV-2025-0041', 'paid', NULL, v_admin),
  (v_p6, 'SecureCloud Suite', 'recurring', 7, 3, 2025, 'USD', 24000.00, 28.00, 900.00, 600.00, 350.00, 0.00, true, 'INV-2025-0042', 'pending', NULL, v_admin),
  (v_p8, '5GConnect', 'recurring', 1, 1, 2025, 'USD', 180000.00, 12.00, 8000.00, 5000.00, 3000.00, 0.00, true, 'INV-2025-0050', 'paid', 'Telecom infrastructure', v_admin),
  (v_p8, 'SkylineEdge', 'one_time', 5, 2, 2025, 'USD', 320000.00, 30.00, 0.00, 0.00, 0.00, 0.00, false, 'INV-2025-0051', 'paid', 'Edge computing deployment', v_admin),
  (v_p10, 'DataBridge Platform', 'recurring', 4, 2, 2025, 'USD', 35000.00, 24.00, 1500.00, 1000.00, 600.00, 0.00, true, 'INV-2025-0060', 'paid', NULL, v_admin),
  (v_p10, 'PredictAI', 'recurring', 7, 3, 2025, 'USD', 42000.00, 27.00, 1800.00, 1200.00, 700.00, 0.00, true, 'INV-2025-0061', 'overdue', NULL, v_admin);

  -- ============ TASKS (12) ============
  INSERT INTO tasks (title, description, due_date, priority, status, partner_id, assigned_to_id, created_by, tags) VALUES
  ('Follow up on CloudSync Pro contract', 'Reach out to Global Manufacturing Corp about finalizing the enterprise rollout contract.', NOW() + INTERVAL '3 days', 'high', 'pending', v_p1, v_manager, v_admin, ARRAY['contract', 'follow-up']),
  ('Prepare QuantumPay proposal for State Bank', 'Draft detailed proposal for national bank rollout including pricing and timeline.', NOW() + INTERVAL '5 days', 'urgent', 'in_progress', v_p4, v_manager, v_admin, ARRAY['proposal', 'fintech']),
  ('Schedule quarterly review with TechFlow', 'Set up QBR with TechFlow leadership to discuss pipeline and joint initiatives.', NOW() + INTERVAL '7 days', 'medium', 'pending', v_p1, v_manager, v_admin, ARRAY['qbr', 'review']),
  ('Review Nexus Digital agreement renewal', 'Review terms and prepare renewal documents before September deadline.', NOW() + INTERVAL '14 days', 'high', 'pending', v_p2, v_manager, v_admin, ARRAY['renewal', 'contract']),
  ('Complete Helix Healthcare compliance audit', 'Ensure all HIPAA compliance documentation is up to date for the hospital network deal.', NOW() + INTERVAL '2 days', 'urgent', 'in_progress', v_p3, v_admin, v_admin, ARRAY['compliance', 'healthcare']),
  ('Onboard CloudPeak to new product line', 'Technical onboarding for CloudPeak team on the new ServerlessKit product.', NOW() + INTERVAL '10 days', 'medium', 'pending', v_p6, v_manager, v_admin, ARRAY['onboarding', 'training']),
  ('Negotiate Skyline 5G deal terms', 'Finalize SOW and pricing for the 5G network expansion opportunity.', NOW() + INTERVAL '4 days', 'urgent', 'in_progress', v_p8, v_admin, v_admin, ARRAY['negotiation', 'telecom']),
  ('Update Verde Energy on referral status', 'Provide update on the national energy grid opportunity progress.', NOW() + INTERVAL '6 days', 'low', 'pending', v_p7, v_manager, v_admin, ARRAY['update', 'energy']),
  ('BrightPath agreement legal review', 'Coordinate with legal team to review the draft partnership agreement.', NOW() + INTERVAL '8 days', 'medium', 'pending', v_p9, v_manager, v_admin, ARRAY['legal', 'review']),
  ('DataBridge co-sell strategy session', 'Plan joint go-to-market strategy for PredictAI financial forecasting product.', NOW() + INTERVAL '12 days', 'high', 'pending', v_p10, v_manager, v_admin, ARRAY['strategy', 'co-sell']),
  ('GlobalRetail renewal assessment', 'Evaluate whether to renew the expired distribution agreement or terminate.', NOW() - INTERVAL '1 day', 'high', 'completed', v_p11, v_manager, v_admin, ARRAY['renewal', 'assessment']),
  ('Pinnacle Government compliance check', 'Verify FedRAMP and FISMA compliance for the pending government alliance.', NOW() + INTERVAL '15 days', 'urgent', 'pending', v_p12, v_admin, v_admin, ARRAY['compliance', 'government']);

  -- ============ ACTIVITIES (15) ============
  INSERT INTO activities (entity_type, entity_id, action, description, user_id, partner_id, created_at) VALUES
  ('partner', v_p1, 'create', 'Created partner "TechFlow Systems"', v_admin, v_p1, NOW() - INTERVAL '30 days'),
  ('partner', v_p2, 'create', 'Created partner "Nexus Digital Solutions"', v_admin, v_p2, NOW() - INTERVAL '28 days'),
  ('agreement', v_a1, 'create', 'Created agreement "TechFlow Master Reseller Agreement"', v_manager, v_p1, NOW() - INTERVAL '25 days'),
  ('opportunity', NULL, 'create', 'Created opportunity "CloudSync Pro - Enterprise Rollout"', v_manager, v_p1, NOW() - INTERVAL '20 days'),
  ('opportunity', NULL, 'update', 'Updated opportunity "QuantumPay - National Bank Rollout" stage to negotiation', v_manager, v_p4, NOW() - INTERVAL '15 days'),
  ('revenue', NULL, 'create', 'Created revenue record (USD $120,000) for Quantum Financial Services', v_admin, v_p4, NOW() - INTERVAL '14 days'),
  ('partner', v_p6, 'create', 'Created partner "CloudPeak Solutions"', v_admin, v_p6, NOW() - INTERVAL '12 days'),
  ('opportunity', NULL, 'update', 'Updated opportunity "SkylineEdge - Edge Computing Pilot" stage to won', v_admin, v_p8, NOW() - INTERVAL '10 days'),
  ('agreement', v_a15, 'create', 'Created agreement "Pinnacle Government Alliance Agreement"', v_admin, v_p12, NOW() - INTERVAL '8 days'),
  ('task', NULL, 'create', 'Created task "Complete Helix Healthcare compliance audit"', v_admin, v_p3, NOW() - INTERVAL '5 days'),
  ('revenue', NULL, 'create', 'Created revenue record (USD $320,000) for Skyline Telecom Partners', v_admin, v_p8, NOW() - INTERVAL '4 days'),
  ('opportunity', NULL, 'update', 'Updated opportunity "SecureGate VPN - Government Agency" stage to won', v_admin, v_p1, NOW() - INTERVAL '3 days'),
  ('partner', v_p12, 'update', 'Updated partner "Pinnacle Government Solutions" status to prospect', v_admin, v_p12, NOW() - INTERVAL '2 days'),
  ('task', NULL, 'complete', 'Completed task "GlobalRetail renewal assessment"', v_manager, v_p11, NOW() - INTERVAL '1 day'),
  ('opportunity', NULL, 'update', 'Updated opportunity "PredictAI - Financial Forecasting" stage to negotiation', v_admin, v_p10, NOW() - INTERVAL '6 hours');

  -- ============ NOTIFICATIONS (8) ============
  INSERT INTO notifications (user_id, title, message, type, is_read, link, partner_id, created_at) VALUES
  (v_admin, 'Deal won!', 'Opportunity "SkylineEdge - Edge Computing Pilot" was marked as won.', 'success', false, '/opportunities', v_p8, NOW() - INTERVAL '10 days'),
  (v_admin, 'Deal won!', 'Opportunity "SecureGate VPN - Government Agency" was marked as won.', 'success', false, '/opportunities', v_p1, NOW() - INTERVAL '3 days'),
  (v_admin, 'New opportunity created', '"PredictAI - Financial Forecasting" was added to the pipeline.', 'info', true, '/opportunities', v_p10, NOW() - INTERVAL '7 days'),
  (v_admin, 'Agreement expiring soon', '"GlobalRetail Distribution Agreement" expired on Jan 31, 2025.', 'warning', true, '/agreements', v_p11, NOW() - INTERVAL '5 days'),
  (v_manager, 'New partner added', '"Pinnacle Government Solutions" was added to the partner directory.', 'info', false, '/partners', v_p12, NOW() - INTERVAL '8 days'),
  (v_manager, 'Task due soon', 'Task "Follow up on CloudSync Pro contract" is due in 3 days.', 'warning', false, '/tasks', v_p1, NOW() - INTERVAL '1 day'),
  (v_manager, 'Revenue record overdue', 'Invoice INV-2025-0061 from DataBridge Analytics is overdue.', 'error', false, '/revenue', v_p10, NOW() - INTERVAL '2 days'),
  (v_admin, 'Agreement pending review', '"BrightPath Education Partnership" is in draft status awaiting legal review.', 'warning', false, '/agreements', v_p9, NOW() - INTERVAL '4 days');

  -- ============ DOCUMENTS (10) ============
  INSERT INTO documents (partner_id, agreement_id, name, doc_type, file_url, file_size, mime_type, version, tags, category, uploaded_by) VALUES
  (v_p1, v_a1, 'TechFlow Master Reseller Agreement - Signed', 'Contract', 'https://example.com/docs/techflow-reseller-signed.pdf', 2456789, 'application/pdf', 3, ARRAY['signed', 'contract', 'active'], 'Legal', v_admin),
  (v_p1, v_a2, 'TechFlow Mutual NDA', 'NDA', 'https://example.com/docs/techflow-nda.pdf', 892341, 'application/pdf', 1, ARRAY['signed', 'nda'], 'Legal', v_admin),
  (v_p2, v_a3, 'Nexus Partnership Agreement - Renewed', 'Contract', 'https://example.com/docs/nexus-partnership-renewed.pdf', 3124567, 'application/pdf', 2, ARRAY['signed', 'renewed', 'contract'], 'Legal', v_manager),
  (v_p4, v_a5, 'Quantum Financial Distribution Agreement', 'Contract', 'https://example.com/docs/quantum-distribution.pdf', 4567890, 'application/pdf', 4, ARRAY['signed', 'distribution', 'apac'], 'Legal', v_manager),
  (v_p4, NULL, 'Quantum Financial - PCI DSS Certificate', 'Certificate', 'https://example.com/docs/quantum-pci-dss.pdf', 1234567, 'application/pdf', 1, ARRAY['compliance', 'certification'], 'Compliance', v_admin),
  (v_p8, v_a10, 'Skyline Strategic Alliance Agreement', 'Contract', 'https://example.com/docs/skyline-alliance.pdf', 5678901, 'application/pdf', 2, ARRAY['signed', 'alliance', 'strategic'], 'Legal', v_admin),
  (v_p8, NULL, 'SkylineEdge Deployment Architecture', 'Specification', 'https://example.com/docs/skyline-edge-architecture.pdf', 2345678, 'application/pdf', 1, ARRAY['technical', 'architecture'], 'Technical', v_admin),
  (v_p6, v_a8, 'CloudPeak Reseller Agreement', 'Contract', 'https://example.com/docs/cloudpeak-reseller.pdf', 1892345, 'application/pdf', 1, ARRAY['signed', 'reseller'], 'Legal', v_manager),
  (v_p10, NULL, 'DataBridge Technical Capabilities Deck', 'Presentation', 'https://example.com/docs/databridge-capabilities.pdf', 8456789, 'application/pdf', 1, ARRAY['sales', 'pitch'], 'Sales', v_manager),
  (v_p3, NULL, 'Helix Healthcare HIPAA Compliance Report', 'Report', 'https://example.com/docs/helix-hipaa-report.pdf', 1567890, 'application/pdf', 1, ARRAY['compliance', 'hipaa', 'healthcare'], 'Compliance', v_admin);

  -- ============ PLAYBOOK ENTRIES (6) ============
  INSERT INTO playbook_entries (title, content, category, tags, is_published, author_id) VALUES
  ('Partner Onboarding Checklist', '## New Partner Onboarding Process

1. **Sign NDA** - Execute mutual NDA before sharing any confidential information.
2. **Technical Assessment** - Evaluate partner technical capabilities and certifications.
3. **Agreement Execution** - Sign the appropriate partnership/reseller/distribution agreement.
4. **Product Training** - Complete product certification training (minimum 2 team members).
5. **Go-To-Market Plan** - Develop joint GTM strategy with measurable goals.
6. **Portal Access** - Provision partner portal access and shared resources.
7. **First Deal Review** - Schedule 30-day check-in to review pipeline and address blockers.',
  'Onboarding', ARRAY['checklist', 'process', 'new-partner'], true, v_admin),
  ('Quarterly Business Review Template', '## QBR Agenda Template

### 1. Performance Review (20 min)
- Revenue vs. target
- Pipeline coverage
- Deal velocity
- Customer satisfaction scores

### 2. Strategic Discussion (20 min)
- Market trends and competitive landscape
- New product roadmap alignment
- Joint marketing initiatives
- Training and certification status

### 3. Action Items (10 min)
- Assign owners and deadlines
- Schedule next QBR
- Identify escalation paths

### 4. Executive Summary
- Key wins and losses
- Risks and mitigations
- Growth opportunities',
  'Process', ARRAY['qbr', 'template', 'review'], true, v_admin),
  ('Handling Partner Escalations', '## Escalation Management Guide

### When to Escalate
- Partner revenue drops >20% quarter-over-quarter
- Partner submits formal complaint
- Deal stuck in negotiation >60 days
- Technical issue impacting customer satisfaction

### Escalation Levels
1. **Level 1** - Partnership Manager handles directly (48hr response)
2. **Level 2** - Director of Partnerships involved (24hr response)
3. **Level 3** - VP/C-level engagement (immediate)

### Best Practices
- Acknowledge the issue within 4 business hours
- Provide a written summary within 24 hours
- Schedule a call within 48 hours
- Document all communication in the CRM
- Follow up after resolution to confirm satisfaction',
  'Process', ARRAY['escalation', 'conflict', 'management'], true, v_manager),
  ('Cloud Partner Technical Requirements', '## Technical Certification Requirements for Cloud Partners

### Minimum Requirements
- 2+ AWS Solutions Architects or equivalent
- 1+ DevOps Engineer certified
- Demonstrated CI/CD pipeline experience

### Preferred Certifications
- AWS Advanced Tier Partner status
- Kubernetes CKA or CKAD certification
- Terraform Associate certification
- Security: CISSP or equivalent

### Technical Assessment Process
1. Review partner architecture diagrams for 3 recent projects
2. Conduct technical interview with lead architect
3. Evaluate code samples and infrastructure-as-code practices
4. Assess incident response and monitoring capabilities',
  'Technical', ARRAY['cloud', 'certification', 'requirements'], true, v_manager),
  ('Pricing and Discount Guidelines', '## Partner Pricing Structure

### Standard Discount Tiers
| Partner Tier | List Price Discount | Additional Volume Discount |
|-------------|-------------------|--------------------------|
| Platinum | 25% | Up to 10% more |
| Gold | 20% | Up to 8% more |
| Silver | 15% | Up to 5% more |
| Bronze | 10% | Up to 3% more |
| Registered | 5% | None |

### Deal Registration
- Partners must register deals in the portal before quoting
- Deal registration provides 90-day protection
- Registered deals receive additional 5% discount

### Margin Protection
- Minimum 15% margin on all partner deals
- Deals below 15% margin require Director approval
- Deals below 10% margin require VP approval',
  'Pricing', ARRAY['pricing', 'discount', 'margin'], true, v_admin),
  ('Co-Sell Motion Playbook', '## Joint Selling with Partners

### Co-Sell Process
1. **Lead Identification** - Partner or our team identifies a qualified opportunity
2. **Deal Registration** - Register the deal in the partner portal
3. **Joint Qualification Call** - Both teams qualify the opportunity together
4. **Solution Design** - Collaborate on technical solution and pricing
5. **Proposal Delivery** - Partner leads the proposal with our support
6. **Negotiation** - Align on terms before presenting to customer
7. **Close & Implement** - Joint implementation team formed

### Revenue Sharing Models
- **Reseller Model** - Partner owns the billing, we invoice partner at discount
- **Referral Model** - We bill directly, partner receives referral commission
- **Co-Sell Model** - Either party can bill, revenue split per agreement

### Key Metrics to Track
- Co-sell pipeline coverage ratio (target: 3x)
- Time to close (target: <90 days)
- Partner-sourced revenue (% of total)
- Deal win rate in co-sell motion (target: >40%)',
  'Sales', ARRAY['co-sell', 'revenue', 'process'], false, v_manager);

  -- ============ PARTNER KPIS (12) ============
  INSERT INTO partner_kpis (partner_id, metric_name, metric_value, period, target_value, unit, notes, recorded_by) VALUES
  (v_p1, 'Annual Recurring Revenue', 345000, '2025', 400000, 'USD', 'On track for 86% of target', v_admin),
  (v_p1, 'Pipeline Coverage', 3.2, 'Q3 2025', 3.0, 'ratio', 'Healthy pipeline coverage', v_admin),
  (v_p1, 'Certified Engineers', 12, '2025', 10, 'count', 'Exceeded certification target', v_admin),
  (v_p2, 'Annual Recurring Revenue', 158000, '2025', 200000, 'EUR', '79% of target, growing AI practice', v_admin),
  (v_p2, 'Deals Won', 8, '2025', 12, 'count', 'Below target, need more pipeline', v_admin),
  (v_p4, 'Annual Recurring Revenue', 432000, '2025', 500000, 'USD', '86% of target, strong Q3', v_admin),
  (v_p4, 'Active Customers', 47, '2025', 50, 'count', 'Near target', v_admin),
  (v_p4, 'Pipeline Coverage', 4.1, 'Q3 2025', 3.0, 'ratio', 'Excellent pipeline', v_admin),
  (v_p6, 'Annual Recurring Revenue', 97000, '2025', 150000, 'USD', '65% of target, new partner ramping', v_admin),
  (v_p8, 'Annual Recurring Revenue', 500000, '2025', 600000, 'USD', '83% of target, major deal in negotiation', v_admin),
  (v_p8, 'Joint Marketing Events', 6, '2025', 8, 'count', '2 events behind target', v_admin),
  (v_p10, 'Annual Recurring Revenue', 77000, '2025', 120000, 'USD', '64% of target, overdue invoice impacting', v_admin);

END $$;
