import { Shield, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function CoverageMatrix({ coverage }: { coverage: any }) {
  if (!coverage) {
    return <div className="text-slate-500 py-8 text-center border border-dashed border-slate-300 bg-slate-50 rounded-none font-mono text-sm">Coverage assessment not yet available.</div>;
  }

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'COMPLIANT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NON_COMPLIANT': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PARTIALLY_COVERED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INFORMATION_REQUIRED': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLIANT': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'NON_COMPLIANT': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PARTIALLY_COVERED': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'INFORMATION_REQUIRED': return <HelpCircle className="w-5 h-5 text-blue-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-6 rounded-none border border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Overall Coverage Status</h3>
          <p className="text-xs font-mono text-slate-500 mt-1">{coverage.notes || "Based on retrieved policy evidence."}</p>
        </div>
        <span className={`px-4 py-2 rounded-none font-bold text-xs font-mono tracking-widest uppercase border flex items-center gap-2 ${getStatusStyle(coverage.overall_status)}`}>
          {getStatusIcon(coverage.overall_status)}
          {coverage.overall_status.replace('_', ' ')}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <Shield className="w-4 h-4 text-slate-500" />
          Policy Conditions Evaluation
        </h4>
        <div className="tech-panel">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="p-4">Policy Condition</th>
                <th className="p-4">Claim Evidence</th>
                <th className="p-4">Status</th>
                <th className="p-4">Source Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {coverage.conditions?.map((cond: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">{cond.condition}</td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{cond.claim_detail}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-none text-xs font-mono font-bold uppercase border flex items-center gap-1.5 w-fit ${getStatusStyle(cond.status)}`}>
                      {getStatusIcon(cond.status)}
                      {cond.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {cond.source?.document || 'Retrieved Policy Knowledge Base'}
                    {cond.source?.page ? ` (Pg ${cond.source.page})` : ''}
                  </td>
                </tr>
              ))}
              {(!coverage.conditions || coverage.conditions.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No conditions evaluated.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Documentation Checklist section omitted for brevity, but could go here */}
    </div>
  );
}
