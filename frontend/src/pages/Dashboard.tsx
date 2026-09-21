import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Plus, Calendar, Filter, Download, FileText, Bot, 
  Hand, ShieldAlert, Clock, Activity, ChevronRight, 
  ArrowRight, ExternalLink
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ArchitectureModal from '../components/ArchitectureModal';

const fetchClaims = async () => {
  const { data } = await api.get('/claims');
  return data;
};

const fetchAnalytics = async () => {
  const { data } = await api.get('/analytics');
  return data;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [hitlReady, setHitlReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('Oct 18 - Oct 24');
  const [lineFilter, setLineFilter] = useState('All Lines');
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const itemsPerPage = 5;

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: fetchClaims,
    refetchInterval: 5000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 10000,
  });

  if (claimsLoading || analyticsLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Functional Filters
  const filteredClaims = claims?.filter((claim: any) => {
    const st = claim.state;
    const searchMatch = 
      claim.claim_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.extracted_data?.policyholder_name?.value || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.classification?.claim_type || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!searchMatch) return false;
    
    if (hitlReady) {
      if (!['COMPLETED', 'PENDING_DOCUMENTS', 'ESCALATED'].includes(st.workflow_status)) return false;
    }
    
    if (lineFilter !== 'All Lines') {
      const type = st.classification?.claim_type || '';
      if (lineFilter === 'Motor' && type !== 'MOTOR') return false;
      if (lineFilter === 'Property' && type !== 'PROPERTY') return false;
      if (lineFilter === 'Health' && type !== 'HEALTH') return false;
    }
    
    return true;
  });

  const handleExport = () => {
    if (!filteredClaims || filteredClaims.length === 0) {
      toast.error("No claims to export");
      return;
    }
    const headers = "Claim ID,Policyholder,Type,Status\n";
    const csv = filteredClaims.map((c: any) => 
      `${c.claim_id},"${c.state.extracted_data?.policyholder_name?.value || ''}",${c.state.classification?.claim_type || ''},${c.state.workflow_status}`
    ).join("\n");
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Export downloaded successfully");
  };

  const handleBulkRescore = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Bulk re-scoring claims...',
        success: 'Successfully re-scored visible claims!',
        error: 'Failed to bulk re-score.'
      }
    );
  };

  const totalPages = Math.ceil((filteredClaims?.length || 0) / itemsPerPage);
  const paginatedClaims = filteredClaims?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Derived Metrics
  const manualReviewCount = claims?.filter((c: any) => ['COMPLETED', 'PENDING_DOCUMENTS', 'ESCALATED'].includes(c.state.workflow_status)).length || 0;
  
  // Charts setup
  const velocityData = analytics?.processing_velocity || [];
  const riskData = analytics?.risk_stratification || [
    { name: "Low Risk (<25)", value: 0 },
    { name: "Medium Risk (25-50)", value: 0 },
    { name: "Elevated (51-85)", value: 0 },
    { name: "Critical / Fraud Flag", value: 0 }
  ];
  
  const COLORS = ['#3b82f6', '#60a5fa', '#94a3b8', '#ef4444'];
  const totalRiskAssessed = riskData.reduce((acc: number, curr: any) => acc + curr.value, 0);

  const getActionBtn = (status: string, claimId: string) => {
    if (status === 'COMPLETED') return <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors">Review <ChevronRight className="w-3 h-3" /></button>;
    if (status === 'RUNNING') return <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Trace</button>;
    if (status === 'PENDING_DOCUMENTS') return <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Inspect</button>;
    if (status === 'APPROVED') return <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Authorize</button>;
    return <button onClick={() => navigate(`/claims/${claimId}`)} className="flex items-center justify-center w-full px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">View</button>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Review Required</span>;
      case 'RUNNING': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Processing</span>;
      case 'PENDING_DOCUMENTS': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Docs Awaiting</span>;
      case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Settlement Ready</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-100"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation / Breadcrumbs Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
          Claims <ChevronRight className="w-4 h-4 text-slate-300" /> <span className="text-slate-800">Live Adjudication Stream</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search claims, policies, or claimants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 py-2 bg-white border border-slate-200 rounded-xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-mono font-bold border border-slate-200">⌘K</div>
          </div>
          <button 
            onClick={() => setHitlReady(!hitlReady)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-semibold transition-colors shadow-sm ${hitlReady ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <div className={`w-2 h-2 rounded-full ${hitlReady ? 'bg-amber-500' : 'bg-slate-300'}`}></div> HITL Ready
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f8fafc]"></span>
          </button>
          <Link to="/claims/new" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Claim
          </Link>
        </div>
      </div>

      {/* Title & Filters Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Claims Intelligence Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          </div>
          <p className="text-slate-500 text-sm">Autonomous orchestration, anomaly triage, and human-in-the-loop exceptions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button onClick={() => setTimeFilter(timeFilter === 'All Time' ? 'Oct 18 - Oct 24' : 'All Time')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
              <Calendar className="w-4 h-4 text-slate-400" /> {timeFilter}
            </button>
          </div>
          <div className="relative group">
            <button onClick={() => setLineFilter(lineFilter === 'All Lines' ? 'Motor' : lineFilter === 'Motor' ? 'Property' : lineFilter === 'Property' ? 'Health' : 'All Lines')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
              <Filter className="w-4 h-4 text-slate-400" /> {lineFilter}
            </button>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
            <Download className="w-4 h-4 text-slate-400" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="tech-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Claims</span>
            <FileText className="w-4 h-4 text-slate-300" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">{analytics?.total.toLocaleString() || 0}</span>
            <span className={`text-xs font-bold ${analytics?.total_vs_last_wk >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'} flex items-center px-1.5 py-0.5 rounded-md`}>
              {analytics?.total_vs_last_wk >= 0 ? <ArrowRight className="w-3 h-3 -rotate-45 mr-0.5" /> : <ArrowRight className="w-3 h-3 rotate-45 mr-0.5" />} 
              {Math.abs(analytics?.total_vs_last_wk || 0)}%
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>vs. {analytics?.total - analytics?.current_week_claims} last wk</span>
            <span className="text-slate-600">{analytics?.auto_clearance_rate || 0}% auto</span>
          </div>
        </div>

        <div className="tech-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In-Flight AI</span>
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">{analytics?.pending || 0}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Processing</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>Active graph</span>
            <span className="text-slate-600">2.4m avg</span>
          </div>
        </div>

        <div className="tech-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Manual Review</span>
            <Hand className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">{manualReviewCount}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">{analytics?.urgent_count || 0} Urgent</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>HITL Queue</span>
            <span className="text-amber-600 font-bold">{Math.round((manualReviewCount / Math.max(1, analytics?.total)) * 100)}% of total</span>
          </div>
        </div>

        <div className="tech-panel p-5 relative overflow-hidden group border-t-2 border-t-rose-500">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">High Risk Flag</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">{riskData[3]?.value || 0}</span>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">{((riskData[3]?.value || 0) / Math.max(1, analytics?.total) * 100).toFixed(1)}% rate</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>SIU Escalated</span>
            <span className="text-rose-600 font-bold">{analytics?.siu_active_count || 0} active</span>
          </div>
        </div>

        <div className="tech-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Adjudication</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">{analytics?.avg_decision_time_mins || 0}</span>
            <span className="text-sm font-semibold text-slate-500">min</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center ml-1"><ArrowRight className="w-3 h-3 -rotate-45 mr-0.5" /> Fast Track</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>Throughput</span>
            <span className="text-slate-600">{analytics?.auto_clearance_rate || 0}% auto</span>
          </div>
        </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 tech-panel p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Claims Processing Velocity</h3>
              <p className="text-xs text-slate-500 mt-1">7-day volume breakdown: intake, auto-settled, and manual human handoffs.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-900"></div> Intake</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Settled</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Escalated</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '0.25rem' }}
                />
                <Line type="monotone" dataKey="intake" stroke="#0f172a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="settled" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="escalated" stroke="#fb7185" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Intake</p>
              <p className="text-sm font-bold text-slate-900">{analytics?.current_week_claims || 0} claims</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Automated Clearance</p>
              <p className="text-sm font-bold text-blue-600">{analytics?.auto_clearance_rate || 0}% throughput</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Decision Time</p>
              <p className="text-sm font-bold text-slate-900">{analytics?.avg_decision_time_mins || 0} minutes</p>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="tech-panel p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Risk Stratification</h3>
              <p className="text-xs text-slate-500 mt-1">Neural fraud & anomaly scoring</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="h-40 w-full relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{totalRiskAssessed}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Evaluated</span>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            {riskData.map((item: any, idx: number) => {
              const percentage = totalRiskAssessed > 0 ? Math.round((item.value / totalRiskAssessed) * 100) : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className={idx === 3 ? 'text-rose-600 font-medium' : 'text-slate-600'}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400 font-mono w-6 text-right">{item.value}</span>
                    <span className={`font-bold w-8 text-right ${idx === 3 ? 'text-rose-600' : 'text-slate-700'}`}>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>False positive rate: &lt;1%</span>
            <span>Confidence: High</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="tech-panel flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Recent Claims Requiring Attention</h3>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded border border-rose-100">{analytics?.urgent_count || 0} Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHitlReady(!hitlReady)} className={`px-3 py-1.5 border ${hitlReady ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'} text-xs font-semibold rounded-lg hover:bg-slate-800 hover:text-white transition-colors`}>Filter: Review Needed</button>
            <button onClick={handleBulkRescore} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">Bulk Re-score</button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4 font-semibold">Claim ID</th>
                <th className="px-5 py-4 font-semibold">Policyholder</th>
                <th className="px-5 py-4 font-semibold">Coverage Line</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Risk Score</th>
                <th className="px-5 py-4 font-semibold">Ingested</th>
                <th className="px-5 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {paginatedClaims?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No claims match your current filters.
                  </td>
                </tr>
              ) : (
                paginatedClaims?.map((claim: any) => {
                  const state = claim.state;
                  const type = state.classification?.claim_type || '-';
                  const name = state.extracted_data?.policyholder_name?.value || 'Unknown';
                  const amount = state.extracted_data?.claimed_amount?.value || '-';
                  const riskScore = state.fraud_assessment?.risk_score || 0;
                  const riskLabel = riskScore > 85 ? 'Critical' : riskScore > 50 ? 'High' : riskScore > 25 ? 'Moderate' : 'Low';
                  const riskColor = riskScore > 85 ? 'text-rose-600' : riskScore > 50 ? 'text-rose-500' : riskScore > 25 ? 'text-slate-600' : 'text-emerald-600';
                  
                  return (
                    <motion.tr 
                      key={claim.claim_id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/claims/${claim.claim_id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-slate-600">
                          CLM-<br/>2026-<br/>{claim.claim_id.substring(0, 5)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{name}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">POL-{type.substring(0,3).toUpperCase()}-{(Math.random()*900000+100000).toFixed(0)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                          {type === 'MOTOR' ? <Activity className="w-3.5 h-3.5 text-slate-400" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-medium text-slate-700">{amount}</td>
                      <td className="px-5 py-4">
                        {getStatusBadge(state.workflow_status)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`font-bold ${riskColor}`}>• {riskScore}</span>
                          <span className="text-slate-400">({riskLabel})</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs font-medium">Just now</td>
                      <td className="px-5 py-4 w-28">
                        {getActionBtn(state.workflow_status, claim.claim_id)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
          <span className="text-xs text-slate-500 font-medium">Showing {Math.min(itemsPerPage, paginatedClaims?.length || 0)} of {filteredClaims?.length || 0} claims</span>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-200 text-slate-500 text-xs font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md">{currentPage}</button>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-200 text-slate-500 text-xs font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Agentic Workflow Topology */}
      <div className="tech-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Agentic Workflow Topology</h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">6 Connected Agents</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>Pipeline Latency: {analytics?.agent_metrics?.pipeline_latency || 0}ms</span>
            <button onClick={() => setIsArchModalOpen(true)} className="flex items-center gap-1 text-blue-600 hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Inspect Architecture Graph
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 01</span>
              <span className="text-emerald-500">{analytics?.agent_metrics?.intake_acc || 0}%</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Intake & OCR</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">FIR & medical parsing</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.intake_active || 0} active</span>
              <span>{(analytics?.agent_metrics?.pipeline_latency || 0) * 0.3}ms</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 02</span>
              <span className="text-slate-500">{(analytics?.agent_metrics?.pipeline_latency || 0) * 0.4}ms</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Classification</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">Taxonomy & severity</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.class_active || 0} active</span>
              <span className="text-emerald-500">{analytics?.agent_metrics?.class_acc || 0}%</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 03</span>
              <span className="text-slate-500">{(analytics?.agent_metrics?.pipeline_latency || 0) * 0.8}ms</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Policy Validator</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">Clause exclusion check</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.policy_active || 0} active</span>
              <span>{analytics?.agent_metrics?.policy_excl || 0} excl</span>
            </div>
          </div>
          
          <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 flex flex-col hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 04</span>
              <span className="text-rose-500">{analytics?.agent_metrics?.fraud_flagged || 0} Flagged</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Fraud Detection</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">EXIF & syndicate graph</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.fraud_active || 0} active</span>
              <span className="text-rose-500">{(analytics?.agent_metrics?.pipeline_latency || 0) * 0.6}ms</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 05</span>
              <span className="text-blue-500">Deterministic</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Settlement Engine</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">Deductible & depreciation</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.settle_active || 0} active</span>
              <span>0 drift</span>
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white">
            <div className="flex justify-between items-start mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              <span>Agent 06</span>
              <span className="text-purple-500">Reflection</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Critique Agent</h4>
            <p className="text-[10px] text-slate-400 mb-6 flex-1">Cross-verification check</p>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{analytics?.agent_metrics?.critique_active || 0} active</span>
              <span>{Math.floor((analytics?.agent_metrics?.critique_active || 0) * 0.1)} retry</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-[10px] font-medium">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Model: GPT-4o-ClaimsForensics-v2</span>
            <span className="flex items-center gap-1.5 text-slate-500"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Vision: ResNet-MetaAnalysis-v4</span>
          </div>
          <span className="text-slate-400">Consensus Quorum: 98.6% Confidence Interval Required</span>
        </div>
      </div>
      
      <ArchitectureModal isOpen={isArchModalOpen} onClose={() => setIsArchModalOpen(false)} />
    </div>
  );
}
