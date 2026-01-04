import { useState } from 'react';
import { FileText, Mic, Upload } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { Language } from '../types';

interface ComplaintSubmissionProps {
  onAnalyze: (complaintText: string, language: Language, file?: File) => void;
}

export default function ComplaintSubmission({ onAnalyze }: ComplaintSubmissionProps) {
  const [complaintText, setComplaintText] = useState('');
  const [language, setLanguage] = useState<Language>('english');
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    if (complaintText.trim()) {
      setIsAnalyzing(true);
      setTimeout(() => {
        onAnalyze(complaintText, language, file || undefined);
        setIsAnalyzing(false);
      }, 3000);
    }
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

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-khaki-light py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <Loading message="Analyzing complaint using AI..." />
            <div className="mt-6 space-y-2 text-center text-textSecondary">
              <p>Reading and processing complaint text...</p>
              <p>Extracting key information using NLP...</p>
              <p>Classifying complaint category...</p>
              <p>Calculating severity score...</p>
              <p>Checking for duplicate patterns...</p>
            </div>
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
            Our AI system will automatically analyze and classify your complaint
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
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
              <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                Clear Form
              </Button>
              <Button type="submit" size="lg" disabled={!complaintText.trim()}>
                Analyze Complaint with AI
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 bg-white border-l-4 border-khaki-dark rounded-lg p-6">
          <h3 className="font-bold text-textPrimary mb-2">What happens next?</h3>
          <ul className="space-y-2 text-textSecondary">
            <li>✓ AI will automatically read and classify your complaint</li>
            <li>✓ System will extract key information and assess severity</li>
            <li>✓ Duplicate complaints and scam patterns will be detected</li>
            <li>✓ Your complaint will be prioritized based on risk level</li>
            <li>✓ You will receive a tracking ID to check status updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
