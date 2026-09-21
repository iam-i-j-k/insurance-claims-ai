import { History, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AuditLog() {
  const navigate = useNavigate();
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/claims');
      return data;
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-200 text-slate-700 rounded-xl">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Log</h1>
          <p className="text-sm text-slate-500">Immutable ledger of AI agent transitions and human interventions.</p>
        </div>
      </div>

      <div className="tech-panel overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Event Type</th>
              <th className="px-5 py-4">Claim Context</th>
              <th className="px-5 py-4">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm bg-white">
            {claims?.slice(0, 15).map((claim: any, idx: number) => {
              const status = claim.state.workflow_status;
              const isAi = status !== 'APPROVED' && status !== 'REJECTED';
              return (
                <tr key={idx} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/claims/${claim.claim_id}`)}>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {new Date().toISOString().replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isAi ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    CLM-{claim.claim_id.substring(0,6)}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {isAi ? 'System: Agentic Pipeline' : 'Human: Lead Adjuster'}
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
