/*
  # Smart NCRP Complaint Intelligence System Database Schema

  1. New Tables
    - complaints: Stores all cybercrime complaints with AI analysis
    - officers: Officer accounts for dashboard access
    - status_updates: Tracks complaint status changes
    - scam_patterns: Detected scam patterns for intelligence

  2. Security
    - RLS enabled on all tables
    - Public can insert complaints
    - Officers can view and update all data
*/

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_text text NOT NULL,
  file_url text,
  language text NOT NULL DEFAULT 'english',
  category text,
  severity text,
  severity_score integer DEFAULT 0,
  amount_involved decimal(15,2),
  victim_name text,
  victim_phone text,
  bank_app text,
  incident_date date,
  ai_summary text,
  ai_explanation jsonb,
  status text DEFAULT 'submitted',
  is_duplicate boolean DEFAULT false,
  pattern_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create officers table
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  badge_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create status_updates table
CREATE TABLE IF NOT EXISTS status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text NOT NULL,
  updated_by uuid REFERENCES officers(id),
  created_at timestamptz DEFAULT now()
);

-- Create scam_patterns table
CREATE TABLE IF NOT EXISTS scam_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL,
  description text NOT NULL,
  common_phone text,
  common_upi text,
  affected_regions text[] DEFAULT '{}',
  complaint_count integer DEFAULT 0,
  first_detected timestamptz DEFAULT now(),
  last_detected timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scam_patterns ENABLE ROW LEVEL SECURITY;

-- Complaints policies: Anyone can insert, anyone can read
CREATE POLICY "Anyone can submit complaints"
  ON complaints FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view complaints"
  ON complaints FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can update complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Officers policies: Only authenticated users can access
CREATE POLICY "Authenticated users can view officers"
  ON officers FOR SELECT
  TO authenticated
  USING (true);

-- Status updates policies: Anyone can view status updates
CREATE POLICY "Anyone can view status updates"
  ON status_updates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can insert status updates"
  ON status_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Scam patterns policies: Anyone can view patterns
CREATE POLICY "Anyone can view scam patterns"
  ON scam_patterns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage scam patterns"
  ON scam_patterns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_pattern_id ON complaints(pattern_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_complaint_id ON status_updates(complaint_id);

-- Insert sample officer for testing
INSERT INTO officers (email, name, badge_number)
VALUES ('officer@ncrp.gov.in', 'Inspector Sharma', 'TN001')
ON CONFLICT (email) DO NOTHING;

-- Insert sample scam pattern
INSERT INTO scam_patterns (
  pattern_name,
  description,
  common_phone,
  common_upi,
  affected_regions,
  complaint_count
)
VALUES (
  'UPI QR Code Scam',
  'Fraudsters sending fake UPI QR codes via WhatsApp claiming to be from banks',
  '+91-98765-43210',
  'scammer@paytm',
  ARRAY['Chennai', 'Coimbatore', 'Madurai'],
  19
)
ON CONFLICT DO NOTHING;