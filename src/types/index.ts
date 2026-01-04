export interface Complaint {
  id: string;
  complaint_text: string;
  file_url?: string;
  language: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high';
  severity_score: number;
  amount_involved?: number;
  victim_name?: string;
  victim_phone?: string;
  bank_app?: string;
  incident_date?: string;
  ai_summary?: string;
  ai_explanation?: {
    keywords: string[];
    phrases: { text: string; reason: string }[];
  };
  status: string;
  is_duplicate: boolean;
  pattern_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Officer {
  id: string;
  email: string;
  name: string;
  badge_number: string;
  dob?: string;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  complaint_id: string;
  status: string;
  message: string;
  updated_by?: string;
  created_at: string;
}

export interface ScamPattern {
  id: string;
  pattern_name: string;
  description: string;
  common_phone?: string;
  common_upi?: string;
  affected_regions: string[];
  complaint_count: number;
  first_detected: string;
  last_detected: string;
}

export type ComplaintCategory =
  | 'Bank Fraud'
  | 'OTP Scam'
  | 'Cyber Harassment'
  | 'Phishing'
  | 'Identity Theft'
  | 'UPI Fraud';

export type Language = 'english' | 'hindi' | 'tamil' | 'telugu';
