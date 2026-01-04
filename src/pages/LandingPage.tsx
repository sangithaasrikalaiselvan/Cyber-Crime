import { useState } from 'react';
import {
  Shield,
  FileText,
  Brain,
  AlertTriangle,
  TrendingUp,
  Globe,
  CheckCircle,
} from 'lucide-react';
import Button from '../components/Button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [logoError, setLogoError] = useState(false);

  const features = [
    {
      icon: FileText,
      title: 'Automated Complaint Reading',
      description: 'OCR + NLP technology to read and understand complaints from text and images',
    },
    {
      icon: Brain,
      title: 'AI-Based Classification',
      description: 'Automatically categorize complaints into fraud types with high accuracy',
    },
    {
      icon: AlertTriangle,
      title: 'Severity-Aware Prioritization',
      description: 'Intelligent risk assessment to prioritize high-impact cases',
    },
    {
      icon: CheckCircle,
      title: 'Explainable AI Decisions',
      description: 'Transparent AI reasoning with keyword highlighting and explanations',
    },
    {
      icon: TrendingUp,
      title: 'Scam Pattern Detection',
      description: 'Identify duplicate complaints and emerging fraud patterns',
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Process complaints in English, Hindi, Tamil, and Telugu',
    },
  ];

  return (
    <div className="min-h-screen bg-khaki-light">
      <div className="relative bg-gradient-to-br from-khaki-dark via-khaki to-khaki-brown text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              {logoError ? (
                <Shield className="h-20 w-20" />
              ) : (
                <img
                  src="/logo.png"
                  alt="Tamil Nadu Police Cyber Crime Wing"
                  className="h-20 w-20 object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Smart NCRP Complaint Intelligence System
            </h1>
            <p className="text-2xl mb-8 text-khaki-light">
              AI-Powered Cybercrime Complaint Intelligence for Faster Justice
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                size="lg"
                onClick={() => onNavigate('submit')}
                className="bg-priority-high/15 text-priority-high hover:bg-priority-high/20 border-2 border-priority-high"
              >
                Submit Complaint
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => onNavigate('officer-login')}
                className="border-white text-white hover:bg-white hover:text-khaki-dark"
              >
                Officer Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-textPrimary mb-4">
            Intelligent Features for Modern Cybercrime Investigation
          </h2>
          <p className="text-lg text-textSecondary max-w-3xl mx-auto">
            Leveraging artificial intelligence to automate complaint processing, reduce officer
            workload, and accelerate response to cybercrime victims
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border-2 border-khaki rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <div className="bg-khaki-light p-3 rounded-lg mr-4">
                  <feature.icon className="h-8 w-8 text-khaki-dark" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-textPrimary mb-2">{feature.title}</h3>
                  <p className="text-textSecondary">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white border-2 border-khaki-dark rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Empowering Law Enforcement with AI
            </h3>
            <p className="text-textSecondary mb-6 max-w-2xl mx-auto">
              Our system processes thousands of complaints daily, automatically extracting key
              information, detecting patterns, and prioritizing cases that need immediate
              attention. This allows officers to focus on investigation rather than paperwork.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-khaki-dark mb-2">85%</div>
                <div className="text-textSecondary">Faster Processing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-khaki-dark mb-2">92%</div>
                <div className="text-textSecondary">Classification Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-khaki-dark mb-2">10k+</div>
                <div className="text-textSecondary">Cases Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
