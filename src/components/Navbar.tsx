import { Shield } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  return (
    <nav className="bg-khaki-dark shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <Shield className="h-8 w-8 text-priority-high mr-3" />
            <div>
              <h1 className="text-white font-bold text-lg">
                Smart NCRP Intelligence System
              </h1>
              <p className="text-khaki-light text-xs">
                National Cyber Crime Reporting Portal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentPage !== 'landing' && (
              <button
                onClick={() => onNavigate('landing')}
                className="text-white hover:text-khaki-light transition-colors px-3 py-2"
              >
                Home
              </button>
            )}
            {currentPage !== 'submit' && (
              <button
                onClick={() => onNavigate('submit')}
                className="text-white hover:text-khaki-light transition-colors px-3 py-2"
              >
                Submit Complaint
              </button>
            )}
            {currentPage !== 'officer-login' && (
              <button
                onClick={() => onNavigate('officer-login')}
                className="bg-khaki hover:bg-khaki-brown text-white px-4 py-2 rounded transition-colors"
              >
                Officer Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
