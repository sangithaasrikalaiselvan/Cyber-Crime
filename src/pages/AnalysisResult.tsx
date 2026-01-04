import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MapPin,
  FileText,
  Eye,
  Copy,
  User,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { Complaint, Language } from '../types';
import { supabase } from '../lib/supabase';

interface AnalysisResultProps {
  complaintText: string;
  language: Language;
  onNavigate: (page: string, complaintId?: string) => void;
}

export default function AnalysisResult({
  complaintText,
  language,
  onNavigate,
}: AnalysisResultProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    analyzeComplaint();
  }, []);

  const analyzeComplaint = async () => {
    if (!supabase) {
      setSubmitError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
      );
      return;
    }

    const analysis = simulateAIAnalysis(complaintText);

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        complaint_text: complaintText,
        language,
        category: analysis.category,
        severity: analysis.severity,
        severity_score: analysis.severity_score,
        amount_involved: analysis.amount_involved,
        victim_name: analysis.victim_name,
        victim_phone: analysis.victim_phone,
        bank_app: analysis.bank_app,
        incident_date: analysis.incident_date,
        ai_summary: analysis.ai_summary,
        ai_explanation: analysis.ai_explanation,
        status: 'Under Review',
        is_duplicate: analysis.is_duplicate,
        pattern_id: analysis.pattern_id,
      })
      .select()
      .single();

    if (data && !error) {
      setComplaint(data);
      setTrackingId(data.id.split('-')[0].toUpperCase());

      if (data.is_duplicate && data.pattern_id) {
        await supabase
          .from('scam_patterns')
          .update({
            complaint_count: 20,
            last_detected: new Date().toISOString(),
          })
          .eq('id', data.pattern_id);
      }

      await supabase.from('status_updates').insert({
        complaint_id: data.id,
        status: 'Under Review',
        message: 'Complaint has been received and is being reviewed by our AI system',
      });
    } else {
      setSubmitError(error?.message || 'Failed to submit complaint to Supabase.');
    }
  };

  const simulateAIAnalysis = (text: string) => {
    const lowerText = text.toLowerCase();
    let category = 'Bank Fraud';
    let severity: 'low' | 'medium' | 'high' = 'medium';
    let severity_score = 50;

    if (lowerText.includes('otp') || lowerText.includes('one time password')) {
      category = 'OTP Scam';
      severity = 'high';
      severity_score = 85;
    } else if (lowerText.includes('upi') || lowerText.includes('phonepay') || lowerText.includes('paytm')) {
      category = 'UPI Fraud';
      severity = 'high';
      severity_score = 80;
    } else if (lowerText.includes('harassment') || lowerText.includes('blackmail')) {
      category = 'Cyber Harassment';
      severity = 'high';
      severity_score = 75;
    } else if (lowerText.includes('phishing') || lowerText.includes('fake link')) {
      category = 'Phishing';
      severity = 'medium';
      severity_score = 60;
    }

    const amountMatch = text.match(/(?:rs\.?|₹)\s*(\d{1,3}(?:,\d{3})*)/i);
    const amount_involved = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    if (amount_involved && amount_involved > 50000) {
      severity = 'high';
      severity_score = Math.min(severity_score + 20, 100);
    }

    const phoneMatch = text.match(/\+?91[-\s]?\d{5}[-\s]?\d{5}/);
    const victim_phone = phoneMatch ? phoneMatch[0] : null;

    const bankMatch = text.match(/\b(SBI|HDFC|ICICI|Axis|PhonePe|Paytm|Google Pay|BHIM)\b/i);
    const bank_app = bankMatch ? bankMatch[1] : null;

    const nameMatch = text.match(/My name is ([A-Z][a-z]+ [A-Z][a-z]+)/);
    const victim_name = nameMatch ? nameMatch[1] : 'Not specified';

    const keywords = ['bank', 'otp', 'upi', 'fraud', 'scam', 'money', 'account', 'card'];
    const foundKeywords = keywords.filter((kw) => lowerText.includes(kw));

    const ai_explanation = {
      keywords: foundKeywords,
      phrases: [
        {
          text: text.substring(0, Math.min(100, text.length)),
          reason: 'Contains fraud-related keywords and financial transaction details',
        },
        {
          text: victim_phone || 'phone number mentioned',
          reason: 'Potential scammer contact information detected',
        },
      ],
    };

    const is_duplicate = phoneMatch && phoneMatch[0].includes('98765-43210');

    const ai_summary = `FIR Summary - ${category}

Complaint received on: ${new Date().toLocaleDateString('en-IN')}

BRIEF FACTS:
The complainant ${victim_name} has reported a ${category.toLowerCase()} incident where ${
      amount_involved ? `Rs. ${amount_involved.toLocaleString('en-IN')} was` : 'money was'
    } fraudulently transferred from their bank account. The incident occurred through ${
      bank_app || 'digital payment platform'
    }.

KEY DETAILS:
- Category: ${category}
- Amount Involved: ${amount_involved ? `Rs. ${amount_involved.toLocaleString('en-IN')}` : 'Under Investigation'}
- Contact Number: ${victim_phone || 'Under Investigation'}
- Platform Used: ${bank_app || 'Digital Payment Platform'}

The complainant was contacted by unknown individuals who used social engineering tactics to obtain sensitive banking credentials. Immediate investigation is recommended to trace the transaction and recover the funds.

RECOMMENDATION:
This case requires ${severity} priority investigation. ${
      is_duplicate ? 'Similar pattern detected in 19 other cases.' : 'No similar pattern detected.'
    }`;

    return {
      category,
      severity,
      severity_score,
      amount_involved,
      victim_name,
      victim_phone,
      bank_app,
      incident_date: new Date().toISOString().split('T')[0],
      ai_summary,
      ai_explanation,
      is_duplicate,
      pattern_id: is_duplicate ? '550e8400-e29b-41d4-a716-446655440000' : null,
    };
  };

  const copyTrackingId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!complaint) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center">
        {submitError ? (
          <Card className="max-w-xl w-full">
            <h2 className="text-2xl font-bold text-textPrimary mb-2">Unable to submit</h2>
            <p className="text-textSecondary">{submitError}</p>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => onNavigate('landing')}>
                Back
              </Button>
            </div>
          </Card>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-khaki-dark mx-auto mb-4"></div>
            <p className="text-textSecondary text-lg">Processing analysis...</p>
          </div>
        )}
      </div>
    );
  }

  const severityColor =
    complaint.severity === 'high'
      ? 'high'
      : complaint.severity === 'medium'
        ? 'medium'
        : 'low';

  return (
    <div className="min-h-screen bg-khaki-light py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-priority-low" />
          </div>
          <h1 className="text-4xl font-bold text-textPrimary mb-3">
            AI Analysis Complete
          </h1>
          <div className="flex items-center justify-center space-x-3">
            <p className="text-lg text-textSecondary">Tracking ID:</p>
            <code className="bg-khaki-dark text-white px-4 py-2 rounded text-xl font-mono">
              {trackingId}
            </code>
            <button
              onClick={copyTrackingId}
              className="text-khaki-dark hover:text-khaki-brown transition-colors"
            >
              <Copy className="h-6 w-6" />
            </button>
          </div>
          {copied && <p className="text-priority-low text-sm mt-2">Copied to clipboard!</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card
            title="Complaint Classification"
            badge={{
              text: complaint.category || 'Unknown',
              color: severityColor,
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-khaki-dark" />
                <div>
                  <p className="text-sm text-textSecondary">Category</p>
                  <p className="text-lg font-semibold text-textPrimary">{complaint.category}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-khaki">
                <p className="text-sm text-textSecondary mb-2">AI Confidence</p>
                <div className="w-full bg-khaki-light rounded-full h-3">
                  <div
                    className="bg-priority-low h-3 rounded-full transition-all"
                    style={{ width: '94%' }}
                  ></div>
                </div>
                <p className="text-sm text-textSecondary mt-1">94% Accurate</p>
              </div>
            </div>
          </Card>

          <Card title="Severity Assessment">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-khaki-dark" />
                  <div>
                    <p className="text-sm text-textSecondary">Risk Level</p>
                    <p className="text-lg font-semibold text-textPrimary uppercase">
                      {complaint.severity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-priority-high">
                    {complaint.severity_score}
                  </p>
                  <p className="text-sm text-textSecondary">/ 100</p>
                </div>
              </div>
              <div className="pt-4 border-t border-khaki">
                <p className="text-sm font-semibold text-textPrimary mb-2">Factors Analyzed:</p>
                <ul className="space-y-1 text-sm text-textSecondary">
                  <li>✓ Amount involved: Rs. {complaint.amount_involved?.toLocaleString('en-IN')}</li>
                  <li>✓ Financial keywords detected (OTP, UPI, Bank)</li>
                  <li>✓ Potential vulnerability indicators</li>
                  <li>✓ Transaction method and platform</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Explainable AI Analysis" className="mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-textPrimary mb-2">
                Keywords that influenced classification:
              </p>
              <div className="flex flex-wrap gap-2">
                {complaint.ai_explanation?.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-priority-medium bg-opacity-20 text-khaki-dark px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-khaki">
              <p className="text-sm font-semibold text-textPrimary mb-3">
                Why this complaint is classified as {complaint.category}:
              </p>
              <div className="space-y-3">
                {complaint.ai_explanation?.phrases.map((phrase, index) => (
                  <div key={index} className="bg-khaki-light p-3 rounded-lg">
                    <p className="text-textPrimary font-mono text-sm mb-1">"{phrase.text}"</p>
                    <p className="text-textSecondary text-xs">→ {phrase.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Extracted Key Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <User className="h-6 w-6 text-khaki-dark mt-1" />
              <div>
                <p className="text-sm text-textSecondary">Victim Name</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {complaint.victim_name || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-6 w-6 text-khaki-dark mt-1" />
              <div>
                <p className="text-sm text-textSecondary">Contact Number</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {complaint.victim_phone || 'Not detected'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CreditCard className="h-6 w-6 text-khaki-dark mt-1" />
              <div>
                <p className="text-sm text-textSecondary">Bank / UPI App</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {complaint.bank_app || 'Not detected'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-6 w-6 text-khaki-dark mt-1" />
              <div>
                <p className="text-sm text-textSecondary">Amount Lost</p>
                <p className="text-lg font-semibold text-priority-high">
                  Rs. {complaint.amount_involved?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-khaki-dark mt-1" />
              <div>
                <p className="text-sm text-textSecondary">Date of Incident</p>
                <p className="text-lg font-semibold text-textPrimary">
                  {complaint.incident_date
                    ? new Date(complaint.incident_date).toLocaleDateString('en-IN')
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {complaint.is_duplicate && (
          <Card
            title="Scam Pattern Intelligence"
            badge={{ text: 'Pattern Detected', color: 'high' }}
            className="mb-6"
          >
            <div className="space-y-4">
              <div className="bg-priority-high bg-opacity-10 border-l-4 border-priority-high p-4 rounded">
                <p className="text-textPrimary font-semibold mb-2">
                  ⚠️ This complaint matches 19 similar cases reported recently
                </p>
                <p className="text-textSecondary text-sm">
                  Pattern Name: UPI QR Code Scam
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-textSecondary mb-1">Common Phone Number Detected</p>
                  <p className="text-lg font-semibold text-textPrimary">+91-98765-43210</p>
                </div>
                <div>
                  <p className="text-sm text-textSecondary mb-1">Common UPI ID</p>
                  <p className="text-lg font-semibold text-textPrimary">scammer@paytm</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-textPrimary mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Affected Regions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Chennai', 'Coimbatore', 'Madurai'].map((region, index) => (
                    <span
                      key={index}
                      className="bg-khaki-light text-textPrimary px-3 py-1 rounded-full text-sm"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card title="Auto-Generated Case Summary" className="mb-6">
          <div className="space-y-4">
            <div className="bg-khaki-light p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-khaki-dark" />
                  <p className="text-sm font-semibold text-textPrimary">
                    FIR-Style Summary (AI Generated)
                  </p>
                </div>
                <span className="text-xs text-textSecondary">Editable by Officer</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-textPrimary leading-relaxed">
                {complaint.ai_summary}
              </pre>
            </div>
          </div>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() =>
              onNavigate('status', complaint.id.split('-')[0].toUpperCase())
            }
          >
            <Eye className="h-5 w-5 mr-2" />
            Track Complaint Status
          </Button>
          <Button size="lg" onClick={() => onNavigate('submit')}>
            Submit Another Complaint
          </Button>
        </div>
      </div>
    </div>
  );
}
