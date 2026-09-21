import { FileText, Download, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Documents() {
  const navigate = useNavigate();
  const { data: claims, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const { data } = await api.get('/claims');
      return data;
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Document Repository</h1>
          <p className="text-sm text-slate-500">Global index of ingested evidence and reports</p>
        </div>
      </div>

      <div className="tech-panel overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-900">All Files</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search documents..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">Filename</th>
              <th className="px-5 py-4">Claim Reference</th>
              <th className="px-5 py-4">Classification</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm bg-white">
            {claims?.map((claim: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/claims/${claim.claim_id}`)}>
                <td className="px-5 py-4 flex items-center gap-2 font-medium text-slate-700">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {claim.state.extracted_data?.policyholder_name?.value ? `${claim.state.extracted_data.policyholder_name.value.split(' ')[0]}_Evidence.pdf` : `Claim_Evidence_${claim.claim_id.substring(0,4)}.pdf`}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">{claim.claim_id.substring(0,8)}...</td>
                <td className="px-5 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">Supporting Evidence</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><Download className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
