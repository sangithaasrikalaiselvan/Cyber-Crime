import { useState, useEffect } from 'react';
import {
  AlertCircle,
  FileText,
  Users,
  TrendingUp,
  Filter,
  Search,
  LogOut,
  Eye,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { Complaint } from '../types';
import { supabase } from '../lib/supabase';

interface OfficerDashboardProps {
  onNavigate: (page: string, complaintId?: string) => void;
}

export default function OfficerDashboard({ onNavigate }: OfficerDashboardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    duplicates: 0,
  });

  useEffect(() => {
    if (isLoggedIn) {
      loadComplaints();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, filterSeverity, filterCategory, searchQuery]);

  const loadComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setComplaints(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data: Complaint[]) => {
    const today = new Date().toDateString();
    const todayComplaints = data.filter(
      (c) => new Date(c.created_at).toDateString() === today
    );
    const highPriority = data.filter((c) => c.severity === 'high');
    const duplicates = data.filter((c) => c.is_duplicate);

    setStats({
      total: todayComplaints.length,
      high: highPriority.length,
      duplicates: duplicates.length,
    });
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (filterSeverity !== 'all') {
      filtered = filtered.filter((c) => c.severity === filterSeverity);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.complaint_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.victim_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'officer@ncrp.gov.in') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials. Use: officer@ncrp.gov.in');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-priority-high',
      medium: 'bg-priority-medium',
      low: 'bg-priority-low',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500';
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-khaki-dark p-4 rounded-full">
                <Users className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-textPrimary">Officer Login</h2>
            <p className="text-textSecondary mt-2">
              Access the Smart NCRP Intelligence Dashboard
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-textPrimary font-semibold mb-2">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ncrp.gov.in"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Login to Dashboard
            </Button>

            <div className="mt-4 p-3 bg-khaki-light rounded text-sm text-textSecondary">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p>Email: officer@ncrp.gov.in</p>
              <p>Password: any password</p>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-khaki-light">
      <div className="bg-khaki-dark text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Officer Dashboard</h1>
            <p className="text-khaki-light text-sm">Inspector Sharma (TN001)</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setIsLoggedIn(false);
              onNavigate('landing');
            }}
            className="border-white text-white hover:bg-white hover:text-khaki-dark"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">Total Complaints Today</p>
                <p className="text-4xl font-bold text-khaki-dark">{stats.total}</p>
              </div>
              <FileText className="h-12 w-12 text-khaki-dark" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">High Priority Cases</p>
                <p className="text-4xl font-bold text-priority-high">{stats.high}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-priority-high" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">Duplicate Scam Alerts</p>
                <p className="text-4xl font-bold text-priority-medium">{stats.duplicates}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-priority-medium" />
            </div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-textPrimary font-semibold mb-2 flex items-center">
                <Search className="h-4 w-4 mr-1" />
                Search Complaints
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, victim name, or text..."
                className="w-full px-4 py-2 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
              />
            </div>

            <div className="w-full md:w-48">
              <label className="block text-textPrimary font-semibold mb-2 flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-4 py-2 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
              >
                <option value="all">All Levels</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-textPrimary font-semibold mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
              >
                <option value="all">All Categories</option>
                <option value="Bank Fraud">Bank Fraud</option>
                <option value="OTP Scam">OTP Scam</option>
                <option value="UPI Fraud">UPI Fraud</option>
                <option value="Phishing">Phishing</option>
                <option value="Cyber Harassment">Cyber Harassment</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="All Complaints">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-khaki">
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Severity
                  </th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-textPrimary font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-textSecondary">
                      No complaints found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="border-b border-khaki hover:bg-khaki-light">
                      <td className="py-3 px-4">
                        <code className="text-xs font-mono text-textPrimary">
                          {complaint.id.split('-')[0].toUpperCase()}
                        </code>
                        {complaint.is_duplicate && (
                          <span className="ml-2 text-xs bg-priority-high text-white px-2 py-0.5 rounded">
                            DUP
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-textPrimary">{complaint.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`${getSeverityBadge(complaint.severity || 'low')} text-white px-3 py-1 rounded-full text-sm font-semibold uppercase`}
                        >
                          {complaint.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-textPrimary font-semibold">
                        {complaint.amount_involved
                          ? `₹${complaint.amount_involved.toLocaleString('en-IN')}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-textSecondary">{complaint.status}</td>
                      <td className="py-3 px-4 text-textSecondary">
                        {new Date(complaint.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          onClick={() =>
                            onNavigate('status', complaint.id.split('-')[0].toUpperCase())
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
