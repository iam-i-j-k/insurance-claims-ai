import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Plus, Calendar, Filter, Download, FileText,
  Activity, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const fetchClaims = async () => {
  const { data } = await api.get('/claims');
  return data;
};

const fetchAnalytics = async () => {
  const { data } = await api.get('/analytics');
  return data;
};

export default function Claims() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [hitlReady, setHitlReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState('Oct 18 - Oct 24');
  const [lineFilter, setLineFilter] = useState('All Lines');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const itemsPerPage = 10;

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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          Claims <ChevronRight className="w-4 h-4 text-slate-300" /> <span className="text-slate-800">Master List</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search claims, policies, or claimants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-mono font-bold border border-slate-200 hidden sm:block">⌘K</div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#f8fafc]"></span>
            </button>
            
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="font-bold text-slate-800 text-sm">Notifications</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">High Risk Fraud Flag Detected</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Claim CLM-2026-9A82B exhibits matching EXIF metadata with a known syndicate.</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">2 mins ago</p>
                      </div>
                    </div>
                    <div className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Claim Auto-Settled</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Claim CLM-2026-3C4D5 processed via Fast Track. Policyholder notified.</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">15 mins ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 text-center bg-slate-50 border-t border-slate-100">
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <Link to="/claims/new" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Claim
          </Link>
        </div>
      </div>

      {/* Title & Filters Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">All Claims</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {claims?.length || 0} Total
            </span>
          </div>
          <p className="text-slate-500 text-sm">Full index of all processed and in-flight claims in the system.</p>
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

      {/* Data Table */}
      <div className="tech-panel flex flex-col overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Claim Registry</h3>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-100">{analytics?.urgent_count || 0} Review Needed</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHitlReady(!hitlReady)} className={`hidden sm:block px-3 py-1.5 border ${hitlReady ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'} text-xs font-semibold rounded-lg hover:bg-slate-800 hover:text-white transition-colors`}>Filter: Review Needed</button>
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
                <th className="px-5 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {paginatedClaims?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium">
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
    </div>
  );
}
