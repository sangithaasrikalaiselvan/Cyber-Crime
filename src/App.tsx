import { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ComplaintSubmission from './pages/ComplaintSubmission';
import AnalysisResult from './pages/AnalysisResult';
import OfficerDashboard from './pages/OfficerDashboard';
import StatusTracking from './pages/StatusTracking';
import { Language } from './types';

type Page = 'landing' | 'submit' | 'analysis' | 'officer-login' | 'officer-dashboard' | 'status';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [complaintData, setComplaintData] = useState<{
    text: string;
    language: Language;
    complainantName: string;
    file?: File;
  } | null>(null);
  const [trackingId, setTrackingId] = useState<string>('');

  const handleNavigate = (page: string, data?: string) => {
    setCurrentPage(page as Page);
    if (page === 'status' && data) {
      setTrackingId(data);
    }
    window.scrollTo(0, 0);
  };

  const handleAnalyze = (
    complaintText: string,
    language: Language,
    complainantName: string,
    file?: File
  ) => {
    setComplaintData({ text: complaintText, language, complainantName, file });
    setCurrentPage('analysis');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'submit':
        return <ComplaintSubmission onAnalyze={handleAnalyze} onNavigate={handleNavigate} />;
      case 'analysis':
        return complaintData ? (
          <AnalysisResult
            complaintText={complaintData.text}
            language={complaintData.language}
            complainantName={complaintData.complainantName}
            file={complaintData.file}
            onNavigate={handleNavigate}
          />
        ) : (
          <LandingPage onNavigate={handleNavigate} />
        );
      case 'officer-login':
      case 'officer-dashboard':
        return <OfficerDashboard onNavigate={handleNavigate} />;
      case 'status':
        return <StatusTracking trackingId={trackingId} onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showNavbar = !['officer-dashboard'].includes(currentPage);

  return (
    <div className="min-h-screen bg-khaki-light">
      {showNavbar && <Navbar onNavigate={handleNavigate} currentPage={currentPage} />}
      {renderPage()}
    </div>
  );
}

export default App;
