import { ShieldAlert, AlertTriangle, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RiskFraud() {
  const navigate = useNavigate();
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/claims');
      return data;
    },
    refetchInterval: 10000
  });

  const siuClaims = claims?.filter((c: any) => c.state.fraud_assessment?.risk_score >= 50 || c.state.workflow_status === 'ESCALATED') || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIU Risk & Fraud Dashboard</h1>
          <p className="text-sm text-slate-500">Special Investigative Unit - High Risk Claims ({siuClaims.length} Active)</p>
        </div>
      </div>

      <div className="tech-panel overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-900">Escalated Queue</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search SIU cases..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">Claim ID</th>
              <th className="px-5 py-4">Policyholder</th>
              <th className="px-5 py-4">Risk Score</th>
              <th className="px-5 py-4">Flags</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm bg-white">
            {siuClaims.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No active SIU cases.</td></tr>
            ) : siuClaims.map((claim: any) => {
              const score = claim.state.fraud_assessment?.risk_score || 0;
              const isCritical = score >= 85;
              
              return (
                <tr key={claim.claim_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/claims/${claim.claim_id}`)}>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{claim.claim_id.substring(0,8)}...</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{claim.state.extracted_data?.policyholder_name?.value || 'Unknown'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {score} / 100
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
                      {claim.state.workflow_status === 'ESCALATED' && <span className="text-amber-600">Manual Eval</span>}
                      {isCritical && <span className="text-rose-600">High Risk</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100">Investigate</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
