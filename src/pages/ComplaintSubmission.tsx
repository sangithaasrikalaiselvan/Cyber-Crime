import { useState } from 'react';
import { FileText, Mic, Upload } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { Language } from '../types';

interface ComplaintSubmissionProps {
  onAnalyze: (
    complaintText: string,
    language: Language,
    complainantName: string,
    file?: File
  ) => void;
  onNavigate: (page: string, complaintId?: string) => void;
}

export default function ComplaintSubmission({ onAnalyze, onNavigate }: ComplaintSubmissionProps) {
  const [complainantName, setComplainantName] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    const parts = [] as string[];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const isAadharValid = /^\d{4} \d{4} \d{4}$/.test(aadharNumber);
  const isNameValid = Boolean(complainantName.trim());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVoiceInput = () => {
    setIsRecording(true);
    setTimeout(() => {
      setComplaintText(
        complaintText +
          ' I received a call from someone claiming to be from my bank. They asked for my OTP and credit card details.'
      );
      setIsRecording(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormError('');

    if (!isNameValid) {
      setFormError('Please enter the complainant name.');
      return;
    }

    if (!isAadharValid) {
      setFormError('Please enter a valid Aadhar number in the format 1234 5678 3456.');
      return;
    }

    if (!complaintText.trim()) return;

    setIsSubmitting(true);
    onAnalyze(complaintText, language, complainantName.trim(), file || undefined);
    setIsSubmitting(false);
  };

  const quickFillExample = () => {
    setComplaintText(
      `I lost Rs. 45,000 from my bank account. Yesterday evening around 6:30 PM, I received a call from +91-98765-43210 claiming to be from SBI Bank Customer Care. The caller said my account would be blocked due to suspicious activity and I need to verify my details immediately.

They sent me a link via SMS and asked me to enter my card details and OTP. I entered all the information as I was scared my account would be blocked. Within minutes, I received multiple transaction alerts showing money being debited from my account through PhonePe UPI.

Total amount lost: Rs. 45,000
Transaction IDs: 234567890123, 234567890124, 234567890125
UPI ID used: scammer@paytm

I immediately called the real SBI customer care, and they confirmed this was a fraud. I have filed a complaint with my bank, but the money has not been returned yet. Please help me recover my money and catch these criminals.`
    );
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-khaki-light py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <Loading message="Submitting your complaint..." />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-khaki-light py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-textPrimary mb-3">Submit Cybercrime Complaint</h1>
          <p className="text-lg text-textSecondary">
            Submit your complaint details for review
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-6 p-3 bg-priority-high bg-opacity-10 border-l-4 border-priority-high rounded text-priority-high">
                {formError}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">Complainant Name</label>
              <input
                type="text"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">Aadhar Number</label>
              <input
                type="text"
                inputMode="numeric"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(formatAadhar(e.target.value))}
                placeholder="1234 5678 3456"
                maxLength={14}
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
              <p className="text-xs text-textSecondary mt-2">Format: 1234 5678 3456</p>
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">
                Select Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
              >
                <option value="english">English</option>
                <option value="hindi">हिंदी (Hindi)</option>
                <option value="tamil">தமிழ் (Tamil)</option>
                <option value="telugu">తెలుగు (Telugu)</option>
              </select>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-textPrimary font-semibold">
                  Complaint Details
                </label>
                <button
                  type="button"
                  onClick={quickFillExample}
                  className="text-sm text-khaki-dark hover:underline"
                >
                  Quick Fill Example
                </button>
              </div>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe your cybercrime incident in detail. Include: What happened, when it happened, who was involved, amount lost (if any), and any relevant phone numbers, UPI IDs, or account details..."
                rows={12}
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark resize-none"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-textSecondary">
                  {complaintText.length} characters
                </p>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isRecording}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-priority-high text-white'
                      : 'bg-khaki-light text-khaki-dark hover:bg-khaki'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                  <span>{isRecording ? 'Recording...' : 'Voice Input'}</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">
                Upload Supporting Documents
              </label>
              <div className="border-2 border-dashed border-khaki rounded-lg p-6 text-center hover:bg-khaki-light transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {file ? (
                    <>
                      <FileText className="h-12 w-12 text-khaki-dark mb-2" />
                      <p className="text-textPrimary font-semibold">{file.name}</p>
                      <p className="text-sm text-textSecondary mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-khaki-dark mb-2" />
                      <p className="text-textPrimary font-semibold">
                        Click to upload PDF or Image
                      </p>
                      <p className="text-sm text-textSecondary mt-1">
                        Screenshots, bank statements, or other evidence
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={() => onNavigate('status')}>
                Track Complaint
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                Clear Form
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!complaintText.trim() || !isNameValid || !isAadharValid}
              >
                Submit Complaint
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 bg-white border-l-4 border-khaki-dark rounded-lg p-6">
          <h3 className="font-bold text-textPrimary mb-2">What happens next?</h3>
          <ul className="space-y-2 text-textSecondary">
            <li>✓ Your complaint will be registered in the system</li>
            <li>✓ You will receive a tracking ID to check status updates</li>
            <li>✓ Officers can view your complaint in the dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
