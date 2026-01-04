import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Copy, Eye } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { Complaint, Language } from '../types';
import { supabase } from '../lib/supabase';

interface AnalysisResultProps {
  complaintText: string;
  language: Language;
  complainantName?: string;
  file?: File;
  onNavigate: (page: string, complaintId?: string) => void;
}

type ExtractedDetails = {
  category?: string;
  platform?: string;
  amount?: number;
  phone?: string;
};

const extractDetails = (text: string): ExtractedDetails => {
  const lower = text.toLowerCase();

  let category: string | undefined;
  if (lower.includes('harassment') || lower.includes('blackmail')) category = 'Cyber Harassment';
  else if (lower.includes('otp') || lower.includes('one time password')) category = 'OTP Scam';
  else if (lower.includes('upi') || lower.includes('phonepe') || lower.includes('paytm') || lower.includes('gpay') || lower.includes('google pay') || lower.includes('bhim')) category = 'UPI Fraud';
  else if (lower.includes('phishing') || lower.includes('fake link')) category = 'Phishing';
  else if (lower.includes('fraud') || lower.includes('scam')) category = 'Bank Fraud';

  const amountMatch = text.match(/(?:rs\.?|₹)\s*(\d{1,3}(?:,\d{3})*)/i);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : undefined;

  const phoneMatch = text.match(/\+?91[-\s]?\d{5}[-\s]?\d{5}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  const platformMatch = text.match(/\b(PhonePe|Paytm|Google Pay|GPay|BHIM|UPI|SBI|HDFC|ICICI|Axis)\b/i);
  const platform = platformMatch ? platformMatch[1] : undefined;

  return { category, platform, amount, phone };
};

export default function AnalysisResult({
  complaintText,
  language,
  complainantName,
  file,
  onNavigate,
}: AnalysisResultProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [copied, setCopied] = useState(false);

  const extracted = useMemo(() => extractDetails(complaintText), [complaintText]);

  useEffect(() => {
    const submitComplaint = async () => {
      if (!supabase) {
        setSubmitError(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
        );
        return;
      }

      const normalizedName = complainantName?.trim();
      const finalComplainantName = normalizedName && normalizedName.length > 0 ? normalizedName : 'Not specified';

      const getNotNullFallback = (column: string): unknown => {
        const key = column.toLowerCase();

        if (key === 'complainant_name') return finalComplainantName;
        if (key === 'victim_name') return finalComplainantName;
        if (key === 'crime_type') return extracted.category ?? 'Not specified';
        if (key === 'category') return extracted.category ?? 'Not specified';
        if (key === 'platform_involved') return extracted.platform ?? 'Not specified';
        if (key === 'platform') return extracted.platform ?? 'Not specified';
        if (key === 'bank_app') return extracted.platform ?? 'Not specified';
        if (key === 'amount_involved') return extracted.amount ?? 0;
        if (key === 'amount_lost') return extracted.amount ?? 0;
        if (key === 'status') return 'Registered';
        if (key === 'language') return language;
        if (key === 'is_duplicate') return false;
        if (key === 'severity_score') return 0;
        if (key === 'incident_date') return new Date().toISOString().slice(0, 10);

        // Default for unknown required text-like columns.
        return 'Not specified';
      };

      let payload: Record<string, unknown> = {
        complaint_text: complaintText,
        language,
        category: extracted.category ?? null,
        bank_app: extracted.platform ?? null,
        amount_involved: extracted.amount ?? null,
        crime_type: extracted.category ?? null,
        complainant_name: finalComplainantName,
        victim_name: finalComplainantName,
        victim_phone: extracted.phone ?? null,
        incident_date: new Date().toISOString().slice(0, 10),
        severity_score: 0,
        status: 'Registered',
        is_duplicate: false,
      };

      const droppableColumns = [
        'language',
        'amount_involved',
        'bank_app',
        'category',
        'crime_type',
        'complainant_name',
        'victim_name',
        'victim_phone',
        'incident_date',
        'severity_score',
        'is_duplicate',
        'status',
      ];

      let createdComplaint: Complaint | null = null;

      for (let i = 0; i < droppableColumns.length + 1; i++) {
        const { data, error } = await supabase
          .from('complaints')
          .insert(payload)
          .select('*')
          .single();

        if (!error) {
          createdComplaint = data as Complaint;
          break;
        }

        const msg = error.message || '';

        // Handle NOT NULL constraints by filling in a fallback value.
        const notNullMatch = msg.match(/null value in column "([^"]+)" of relation "complaints" violates not-null constraint/i);
        if (notNullMatch?.[1]) {
          const col = notNullMatch[1];
          payload = { ...payload, [col]: getNotNullFallback(col) };
          continue;
        }

        const missingCol = droppableColumns.find((col) =>
          msg.includes(`Could not find the '${col}' column`)
        );

        if (missingCol) {
          // Retry without the missing column.
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete payload[missingCol];
          continue;
        }

        setSubmitError(msg || 'Failed to submit complaint.');
        return;
      }

      if (!createdComplaint) {
        setSubmitError('Failed to submit complaint due to a schema mismatch.');
        return;
      }

      // If user attached a file, upload it and store the URL on the complaint.
      if (file) {
        try {
          const bucket = 'complaint-files';
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `complaints/${createdComplaint.id}/${Date.now()}_${safeName}`;

          const upload = await supabase.storage
            .from(bucket)
            .upload(path, file, {
              contentType: file.type || undefined,
              upsert: true,
            });

          if (upload.error) {
            setFileUploadError(
              `File upload failed. Ensure a Storage bucket named "${bucket}" exists and is public. (${upload.error.message})`
            );
          } else {
            const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
            const { data: updated, error: updateError } = await supabase
              .from('complaints')
              .update({ file_url: publicUrl })
              .eq('id', createdComplaint.id)
              .select('*')
              .single();

            if (updateError) {
              setFileUploadError(`Saved complaint, but failed to attach file URL. (${updateError.message})`);
              setComplaint(createdComplaint);
              return;
            }

            createdComplaint = updated as Complaint;
          }
        } catch {
          setFileUploadError('Saved complaint, but file upload failed.');
        }
      }

      setComplaint(createdComplaint);
    };

    void submitComplaint();
  }, [complaintText, language, complainantName, file, extracted.category, extracted.platform, extracted.amount, extracted.phone]);

  const trackingId = complaint?.id ? complaint.id.split('-')[0].toUpperCase() : '';

  const copyTrackingId = () => {
    if (!trackingId) return;
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!complaint) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center py-12">
        {submitError ? (
          <Card className="max-w-xl w-full">
            <h2 className="text-2xl font-bold text-textPrimary mb-2">Unable to submit</h2>
            <p className="text-textSecondary">{submitError}</p>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => onNavigate('submit')}>
                Back
              </Button>
            </div>
          </Card>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-khaki-dark mx-auto mb-4" />
            <p className="text-textSecondary text-lg">Submitting complaint...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-khaki-light py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-priority-low" />
            </div>
            <h1 className="text-3xl font-bold text-textPrimary mb-2">Complaint Submitted</h1>
            <p className="text-textSecondary mb-6">Use your tracking ID to view status.</p>

            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="text-lg text-textSecondary">Tracking ID:</p>
              <code className="bg-khaki-dark text-white px-4 py-2 rounded text-xl font-mono">
                {trackingId}
              </code>
              <button
                onClick={copyTrackingId}
                className="text-khaki-dark hover:text-khaki-brown transition-colors"
                type="button"
              >
                <Copy className="h-6 w-6" />
              </button>
            </div>
            {copied && <p className="text-priority-low text-sm">Copied to clipboard!</p>}

            {fileUploadError && (
              <div className="mt-6 p-3 bg-priority-high bg-opacity-10 border-l-4 border-priority-high rounded text-priority-high text-left">
                {fileUploadError}
              </div>
            )}

            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('status', trackingId)}
              >
                <Eye className="h-5 w-5 mr-2" />
                Track Complaint Status
              </Button>
              <Button size="lg" onClick={() => onNavigate('submit')}>
                Submit Another Complaint
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
