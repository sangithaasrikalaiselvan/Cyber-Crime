import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { Complaint, StatusUpdate } from '../types';
import { supabase } from '../lib/supabase';

interface StatusTrackingProps {
  trackingId?: string;
  onNavigate: (page: string) => void;
}

export default function StatusTracking({ trackingId, onNavigate }: StatusTrackingProps) {
  const [searchId, setSearchId] = useState(trackingId || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (trackingId) {
      if (!supabase) {
        setError(
          'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
        );
        return;
      }

      handleSearch(trackingId);
    }
  }, [trackingId]);

  const handleSearch = async (id?: string) => {
    if (!supabase) {
      setError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
      );
      return;
    }

    const idToSearch = id || searchId;
    if (!idToSearch) return;

    setLoading(true);
    setError('');

    const { data: complaints, error: complaintError } = await supabase
      .from('complaints')
      .select('*')
      .ilike('id', `${idToSearch}%`)
      .limit(1);

    if (complaintError || !complaints || complaints.length === 0) {
      setError('Complaint not found. Please check your tracking ID.');
      setLoading(false);
      return;
    }

    setComplaint(complaints[0]);

    const { data: updates } = await supabase
      .from('status_updates')
      .select('*')
      .eq('complaint_id', complaints[0].id)
      .order('created_at', { ascending: false });

    if (updates) {
      setStatusUpdates(updates);
    }

    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('resolved')) {
      return <CheckCircle className="h-8 w-8 text-priority-low" />;
    } else if (statusLower.includes('review') || statusLower.includes('progress')) {
      return <Clock className="h-8 w-8 text-priority-medium" />;
    } else {
      return <AlertCircle className="h-8 w-8 text-khaki-dark" />;
    }
  };

  const getHumanFriendlyStatus = (status: string) => {
    const statusMap: { [key: string]: { title: string; description: string } } = {
      'Under Review': {
        title: 'We are reviewing your complaint',
        description:
          'Our cyber crime team is analyzing the details you provided. This usually takes 2-3 business days.',
      },
      'Bank Verification': {
        title: 'Bank verification in progress',
        description:
          'We are coordinating with your bank to verify the transaction details and freeze the fraudulent account.',
      },
      'Investigation': {
        title: 'Cyber cell reviewing evidence',
        description:
          'Our technical team is examining digital evidence and working to trace the criminals.',
      },
      'FIR Filed': {
        title: 'Official complaint registered',
        description:
          'An FIR has been filed with the police. You will receive a copy via email shortly.',
      },
      'Resolved': {
        title: 'Case resolved',
        description: 'Your complaint has been successfully resolved. Thank you for your patience.',
      },
    };

    return (
      statusMap[status] || {
        title: status,
        description: 'Your complaint is being processed.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-khaki-light py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-textPrimary mb-3">Track Your Complaint</h1>
          <p className="text-lg text-textSecondary">
            Enter your tracking ID to check the status of your complaint
          </p>
        </div>

        <Card className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                placeholder="Enter Tracking ID (e.g., ABC123)"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark uppercase"
              />
            </div>
            <Button onClick={() => handleSearch()} disabled={loading} size="lg">
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Searching...' : 'Track'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-priority-high bg-opacity-10 border-l-4 border-priority-high rounded text-priority-high">
              {error}
            </div>
          )}
        </Card>

        {complaint && (
          <>
            <Card className="mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-2">
                    Complaint Details
                  </h2>
                  <p className="text-textSecondary">
                    Tracking ID:{' '}
                    <code className="bg-khaki-light px-2 py-1 rounded font-mono">
                      {complaint.id.split('-')[0].toUpperCase()}
                    </code>
                  </p>
                </div>
                <span
                  className={`${
                    complaint.severity === 'high'
                      ? 'bg-priority-high'
                      : complaint.severity === 'medium'
                        ? 'bg-priority-medium'
                        : 'bg-priority-low'
                  } text-white px-4 py-2 rounded-full text-sm font-semibold uppercase`}
                >
                  {complaint.severity} Priority
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-textSecondary mb-1">Category</p>
                  <p className="text-lg font-semibold text-textPrimary">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-textSecondary mb-1">Submitted On</p>
                  <p className="text-lg font-semibold text-textPrimary">
                    {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {complaint.amount_involved && (
                  <div>
                    <p className="text-sm text-textSecondary mb-1">Amount Involved</p>
                    <p className="text-lg font-semibold text-priority-high">
                      ₹{complaint.amount_involved.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-textSecondary mb-1">Current Status</p>
                  <p className="text-lg font-semibold text-textPrimary">{complaint.status}</p>
                </div>
              </div>
            </Card>

            <Card title="Current Status">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0">{getStatusIcon(complaint.status)}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-textPrimary mb-2">
                    {getHumanFriendlyStatus(complaint.status).title}
                  </h3>
                  <p className="text-textSecondary text-lg">
                    {getHumanFriendlyStatus(complaint.status).description}
                  </p>
                </div>
              </div>

              {complaint.is_duplicate && (
                <div className="mt-4 p-4 bg-priority-medium bg-opacity-10 border-l-4 border-priority-medium rounded">
                  <p className="text-textPrimary font-semibold">
                    Note: Your complaint matches a known scam pattern
                  </p>
                  <p className="text-textSecondary text-sm mt-1">
                    We have detected similar cases and are working with other victims to resolve
                    this pattern of fraud.
                  </p>
                </div>
              )}
            </Card>

            {statusUpdates.length > 0 && (
              <Card title="Status History" className="mt-6">
                <div className="space-y-4">
                  {statusUpdates.map((update, index) => (
                    <div
                      key={update.id}
                      className={`flex items-start space-x-4 pb-4 ${
                        index < statusUpdates.length - 1 ? 'border-b border-khaki' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-3 w-3 rounded-full bg-khaki-dark"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-textPrimary">{update.status}</p>
                          <p className="text-sm text-textSecondary">
                            {new Date(update.created_at).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-textSecondary">{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="mt-6">
              <div className="flex items-start space-x-4">
                <FileText className="h-6 w-6 text-khaki-dark flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-textPrimary mb-2">What should I do next?</h3>
                  <ul className="space-y-2 text-textSecondary">
                    <li>
                      • Keep this tracking ID safe for future reference:{' '}
                      <code className="bg-khaki-light px-2 py-1 rounded font-mono">
                        {complaint.id.split('-')[0].toUpperCase()}
                      </code>
                    </li>
                    <li>• Check back regularly for status updates</li>
                    <li>
                      • If you have additional information or evidence, contact the investigating
                      officer
                    </li>
                    <li>• Do not engage with the scammers or respond to their messages</li>
                    <li>
                      • Keep all communication records and transaction receipts for evidence
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="mt-6 flex justify-center">
              <Button onClick={() => onNavigate('landing')}>Back to Home</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
