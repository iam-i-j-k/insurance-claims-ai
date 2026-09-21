import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Claims from './pages/Claims';
import NewClaim from './pages/NewClaim';
import ClaimDetail from './pages/ClaimDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutDashboard, FileText, FolderOpen, BookOpen, ShieldAlert, BarChart3, History, LogOut, Menu, X } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

import Documents from './pages/Documents';
import KnowledgeBase from './pages/KnowledgeBase';
import RiskFraud from './pages/RiskFraud';
import AuditLog from './pages/AuditLog';
import { useQuery } from '@tanstack/react-query';
import api from './api';

const queryClient = new QueryClient();

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const path = location.pathname;

  const { data: analytics } = useQuery({
    queryKey: ['analytics_sidebar'],
    queryFn: async () => {
      const { data } = await api.get('/analytics');
      return data;
    },
    refetchInterval: 10000,
  });

  const baseClass = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const activeClass = "bg-slate-900 text-white";
  const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span className="font-bold tracking-tight text-slate-900">ClaimGuard AI</span>
          </div>
          <button className="md:hidden text-slate-500 hover:bg-slate-100 p-1 rounded-md" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      
      <div className="px-4 py-6">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">Triage Workspace</div>
        <nav className="space-y-1">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`${baseClass} ${path === '/dashboard' ? activeClass : inactiveClass}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/claims" onClick={() => setIsOpen(false)} className={`${baseClass} justify-between ${path.startsWith('/claims') ? activeClass : inactiveClass}`}>
            <div className="flex items-center gap-3"><FolderOpen className="w-4 h-4" /> Claims</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${path.startsWith('/claims') ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>{analytics?.total || 0}</span>
          </Link>
          <Link to="/documents" onClick={() => setIsOpen(false)} className={`${baseClass} ${path.startsWith('/documents') ? activeClass : inactiveClass}`}>
            <FileText className="w-4 h-4" /> Documents
          </Link>
          <Link to="/knowledge" onClick={() => setIsOpen(false)} className={`${baseClass} ${path.startsWith('/knowledge') ? activeClass : inactiveClass}`}>
            <BookOpen className="w-4 h-4" /> Policy Knowledge Base
          </Link>
          <Link to="/risk" onClick={() => setIsOpen(false)} className={`${baseClass} justify-between ${path.startsWith('/risk') ? activeClass : inactiveClass}`}>
            <div className="flex items-center gap-3"><ShieldAlert className="w-4 h-4" /> Risk & Fraud</div>
            <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-mono border border-rose-100">{analytics?.siu_active_count || 0}</span>
          </Link>
          <Link to="/analytics" onClick={() => setIsOpen(false)} className={`${baseClass} ${path.startsWith('/analytics') ? activeClass : inactiveClass}`}>
            <BarChart3 className="w-4 h-4" /> Reports
          </Link>
          <Link to="/audit" onClick={() => setIsOpen(false)} className={`${baseClass} ${path.startsWith('/audit') ? activeClass : inactiveClass}`}>
            <History className="w-4 h-4" /> Audit Log
          </Link>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200 text-blue-700 font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-slate-500 truncate">Lead Adjuster</p>
            </div>
          </div>
          <button onClick={logout} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen text-slate-900 font-sans bg-[#f8fafc] flex flex-col md:flex-row selection:bg-blue-100 relative">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span className="font-bold tracking-tight text-slate-900">ClaimGuard AI</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 flex-1">
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', background: '#334155', color: '#fff', fontSize: '14px', fontWeight: 600 } }} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/claims/new" element={<NewClaim />} />
            <Route path="/claims/:id/*" element={<ClaimDetail />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/risk" element={<RiskFraud />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="273108503378-tlcfvrmjnm8pajt2k2o8screkrdrjvbv.apps.googleusercontent.com">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
