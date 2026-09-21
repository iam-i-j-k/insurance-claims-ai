import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Shield, FileText, AlertTriangle, GitMerge, ChevronLeft, Mail } from 'lucide-react';
import WorkflowStatus from '../components/WorkflowStatus';
import CoverageMatrix from '../components/CoverageMatrix';
import RiskPanel from '../components/RiskPanel';
import TriageReport from '../components/TriageReport';
import { motion, AnimatePresence } from 'framer-motion';

const fetchClaim = async (id: string) => {
  const { data } = await api.get(`/claims/${id}`);
  return data;
};

export default function ClaimDetail() {
  const { id } = useParams();
  const location = useLocation();

  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', id],
    queryFn: () => fetchClaim(id!),
    refetchInterval: (data: any) => 
      (data?.state?.workflow_status === 'RUNNING' || data?.state?.workflow_status === 'CREATED') ? 2000 : false,
  });

  if (isLoading || !claim) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'workflow', label: 'Workflow AI', icon: GitMerge, path: '' },
    { id: 'coverage', label: 'Coverage Matrix', icon: Shield, path: 'coverage' },
    { id: 'risks', label: 'Fraud Detection', icon: AlertTriangle, path: 'risks' },
    { id: 'report', label: 'Triage Report', icon: FileText, path: 'report' },
    { id: 'email', label: 'Customer Email', icon: Mail, path: 'email' }
  ];

  const currentStatus = claim.state.workflow_status;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="tech-panel p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
        <div className="z-10">
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 uppercase">Claim Details</h2>
          <p className="text-slate-500 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="font-mono bg-slate-100 px-2 py-1 border border-slate-200 text-slate-700 font-bold">{id?.substring(0, 8)}</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-800">{claim.state.extracted_data?.policyholder_name?.value || 'Unknown Policyholder'}</span>
            <span className="text-slate-300">•</span>
            <span>{claim.state.classification?.claim_type?.replace('_', ' ') || 'Unclassified'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 pl-4 pr-2 border border-slate-200 rounded-xl z-10">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</span>
          <span className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest border rounded-lg
            ${currentStatus === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
              currentStatus === 'RUNNING' ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse' : 
              'bg-slate-100 border-slate-200 text-slate-700'}`}>
            {currentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="tech-panel flex flex-col">
        <div className="border-b border-slate-200 flex overflow-x-auto relative px-2 bg-slate-50">
          {tabs.map((tab) => {
            const isActive = location.pathname.endsWith(tab.path) || (tab.path === '' && location.pathname.endsWith(id!));
            return (
              <Link
                key={tab.id}
                to={`/claims/${id}${tab.path ? `/${tab.path}` : ''}`}
                className={`relative flex items-center gap-2 px-6 py-4 text-xs uppercase tracking-widest font-bold transition-colors whitespace-nowrap z-10
                  ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
        
        <div className="p-6 md:p-8 bg-white min-h-[500px]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="" element={<AnimatedRoute><WorkflowStatus claim={claim} /></AnimatedRoute>} />
              <Route path="coverage" element={<AnimatedRoute><CoverageMatrix coverage={claim.state.coverage_assessment} /></AnimatedRoute>} />
              <Route path="risks" element={<AnimatedRoute><RiskPanel fraud={claim.state.fraud_assessment} /></AnimatedRoute>} />
              <Route path="report" element={<AnimatedRoute><TriageReport claim={claim} /></AnimatedRoute>} />
              <Route path="email" element={<AnimatedRoute><EmailPanel emailContent={claim.state.customer_communication} /></AnimatedRoute>} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function EmailPanel({ emailContent }: { emailContent?: string }) {
  if (!emailContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Mail className="w-12 h-12 mb-4 opacity-50" />
        <p>No communication drafted yet.</p>
        <p className="text-sm">The email will be generated once the AI triage is complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest">
          <Mail className="w-5 h-5 text-slate-600" /> Drafted Customer Email
        </h3>
        <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-mono font-bold uppercase tracking-wider">Draft</span>
      </div>
      <div className="tech-panel p-6 border-l-4 border-l-slate-900 whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
        {emailContent}
      </div>
    </div>
  );
}

function AnimatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
