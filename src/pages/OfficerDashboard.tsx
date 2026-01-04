import { useEffect, useMemo, useState } from 'react';
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
import { Complaint, Officer } from '../types';
import { supabase } from '../lib/supabase';

interface OfficerDashboardProps {
  onNavigate: (page: string, complaintId?: string) => void;
}

export default function OfficerDashboard({ onNavigate }: OfficerDashboardProps) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authInfo, setAuthInfo] = useState('');

  const [officerProfile, setOfficerProfile] = useState<Officer | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileBadgeNumber, setProfileBadgeNumber] = useState('');
  const [profileDob, setProfileDob] = useState('');
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

  const isLoggedIn = useMemo(() => Boolean(sessionUserId), [sessionUserId]);

  useEffect(() => {
    if (!supabase) {
      setSessionUserId(null);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSessionUserId(data.session?.user?.id ?? null);
        setSessionEmail(data.session?.user?.email ?? '');
      })
      .catch(() => {
        if (!isMounted) return;
        setSessionUserId(null);
        setSessionEmail('');
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
      setSessionEmail(session?.user?.email ?? '');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadComplaints();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    if (!isLoggedIn || !sessionEmail) {
      setOfficerProfile(null);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);
    setProfileError('');

    const loadProfile = async () => {
      try {
        const { data, error } = await sb
          .from('officers')
          .select('*')
          .eq('email', sessionEmail)
          .maybeSingle();

        if (!isMounted) return;
        if (error) {
          setProfileError(error.message);
          setOfficerProfile(null);
          return;
        }

        setOfficerProfile((data as Officer) ?? null);
        if (data) {
          setProfileName(data.name ?? '');
          setProfileBadgeNumber(data.badge_number ?? '');
          setProfileDob(data.dob ?? '');
        }
      } finally {
        if (!isMounted) return;
        setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, sessionEmail]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, filterSeverity, filterCategory, searchQuery]);

  const loadComplaints = async () => {
    if (!supabase) {
      return;
    }

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

  type GmailCheck = { ok: false; message: string } | { ok: true; email: string };

  const validateGmail = (value: string): GmailCheck => {
    const normalizedEmail = value.trim().toLowerCase();
    if (!normalizedEmail) return { ok: false, message: 'Enter your email address.' };
    if (!normalizedEmail.endsWith('@gmail.com')) {
      return { ok: false, message: 'Please use a Gmail address (example: officer@gmail.com).' };
    }
    return { ok: true, email: normalizedEmail };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
      );
      return;
    }

    const emailCheck = validateGmail(email);
    if (!emailCheck.ok) {
      setAuthError(emailCheck.message);
      return;
    }

    if (!password) {
      setAuthError('Enter your password.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);
    setAuthInfo('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailCheck.email,
        password,
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch {
      setAuthError('Email sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev server.'
      );
      return;
    }

    const emailCheck = validateGmail(email);
    if (!emailCheck.ok) {
      setAuthError(emailCheck.message);
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);
    setAuthInfo('');
    try {
      const { error } = await supabase.auth.signUp({
        email: emailCheck.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthInfo(
          'Account created. Please confirm your email (check your inbox) before signing in.'
        );
      }
    } catch {
      setAuthError('Sign-up failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isLoggedIn || !sessionEmail) return;

    if (!profileName.trim()) {
      setProfileError('Enter your name.');
      return;
    }
    if (!profileBadgeNumber.trim()) {
      setProfileError('Enter your badge number.');
      return;
    }
    if (!profileDob) {
      setProfileError('Select your date of birth.');
      return;
    }

    setProfileError('');
    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('officers')
        .upsert(
          {
            id: sessionUserId,
            email: sessionEmail,
            name: profileName.trim(),
            badge_number: profileBadgeNumber.trim(),
            dob: profileDob,
          },
          { onConflict: 'email' }
        )
        .select('*')
        .single();

      if (error) {
        setProfileError(error.message);
        return;
      }

      setOfficerProfile(data as Officer);
    } catch {
      setProfileError('Failed to save profile.');
    } finally {
      setProfileLoading(false);
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

  if (!supabase) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Supabase not configured</h2>
          <p className="text-textSecondary">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev
            server.
          </p>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => onNavigate('landing')}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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

          {authError && (
            <div className="mb-4 p-3 bg-priority-high bg-opacity-10 border-l-4 border-priority-high rounded text-priority-high">
              {authError}
            </div>
          )}

          {authInfo && (
            <div className="mb-4 p-3 bg-khaki-light border-l-4 border-khaki-dark rounded text-textSecondary">
              {authInfo}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthError('');
                setAuthInfo('');
              }}
              className={`flex-1 px-4 py-2 rounded border-2 transition-colors ${
                authMode === 'signin'
                  ? 'border-khaki-dark text-khaki-dark bg-khaki-light'
                  : 'border-khaki text-textSecondary bg-white hover:bg-khaki-light'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
                setAuthInfo('');
              }}
              className={`flex-1 px-4 py-2 rounded border-2 transition-colors ${
                authMode === 'signup'
                  ? 'border-khaki-dark text-khaki-dark bg-khaki-light'
                  : 'border-khaki text-textSecondary bg-white hover:bg-khaki-light'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn}>
            <div className="mb-4">
              <label className="block text-textPrimary font-semibold mb-2">
                {authMode === 'signup' ? 'Email (create account)' : 'Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@gmail.com"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            {authMode === 'signup' && (
              <div className="mb-6">
                <label className="block text-textPrimary font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={authLoading}>
              {authLoading
                ? authMode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : authMode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </Button>

            <p className="mt-3 text-xs text-textSecondary">
              {authMode === 'signup'
                ? 'A confirmation email will be sent (magic link).'
                : 'No sign-in links. Use your email and password.'}
            </p>
          </form>
        </Card>
      </div>
    );
  }

  const needsProfile =
    !officerProfile ||
    !officerProfile.name ||
    !officerProfile.badge_number ||
    !officerProfile.dob;

  if (needsProfile) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Officer Profile</h2>
          <p className="text-textSecondary mb-6">
            Complete your profile to access the dashboard.
          </p>

          {profileLoading && !officerProfile && (
            <p className="text-textSecondary mb-4">Loading profile...</p>
          )}

          {profileError && (
            <div className="mb-4 p-3 bg-priority-high bg-opacity-10 border-l-4 border-priority-high rounded text-priority-high">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div className="mb-4">
              <label className="block text-textPrimary font-semibold mb-2">Email</label>
              <input
                type="email"
                value={sessionEmail}
                readOnly
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg bg-khaki-light text-textSecondary"
              />
            </div>

            <div className="mb-4">
              <label className="block text-textPrimary font-semibold mb-2">Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-textPrimary font-semibold mb-2">Badge Number</label>
              <input
                type="text"
                value={profileBadgeNumber}
                onChange={(e) => setProfileBadgeNumber(e.target.value)}
                placeholder="Enter badge number"
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-textPrimary font-semibold mb-2">Date of Birth</label>
              <input
                type="date"
                value={profileDob}
                onChange={(e) => setProfileDob(e.target.value)}
                className="w-full px-4 py-3 border-2 border-khaki rounded-lg focus:outline-none focus:border-khaki-dark"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" size="lg" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  supabase?.auth.signOut();
                  onNavigate('landing');
                }}
              >
                Logout
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (isLoggedIn && !supabase) {
    return (
      <div className="min-h-screen bg-khaki-light flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Supabase not configured</h2>
          <p className="text-textSecondary">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file, then restart the dev
            server.
          </p>
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                onNavigate('landing');
              }}
              className="border-khaki-dark text-khaki-dark"
            >
              Back
            </Button>
          </div>
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
            <p className="text-khaki-light text-sm">
              {officerProfile?.name} ({officerProfile?.badge_number})
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              supabase?.auth.signOut();
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
