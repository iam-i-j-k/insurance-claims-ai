import { CheckCircle, AlertTriangle, XCircle, Info, Send, Download, Loader2 } from 'lucide-react';
import api from '../api';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function TriageReport({ claim }: { claim: any }) {
  const report = claim.state.triage_report;
  const componentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ClaimGuard_TriageReport_${claim.claim_id?.substring(0, 8) || 'Draft'}`,
  });
  
  if (!report) {
    return <div className="text-slate-500 py-8 text-center border border-dashed border-slate-300 bg-slate-50 rounded-none font-mono text-sm">Triage report not yet available.</div>;
  }

  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const handleAdjusterDecision = async (action: string) => {
    setSubmittingAction(action);
    try {
      await api.post(`/claims/${claim.claim_id}/review`, {
        action,
        comment: "Manual override by human adjuster from dashboard."
      });
      // Fire and forget refetching so UI doesn't block
      queryClient.invalidateQueries({ queryKey: ['claim', claim.claim_id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Decision recorded successfully.');
    } catch (error) {
      toast.error('Failed to record decision.');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-none text-xs uppercase tracking-widest font-bold hover:bg-slate-800 transition-colors">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div ref={componentRef} className="space-y-8 print:p-8 print:bg-white print:block">
        {/* Header specifically for print */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-slate-900" /> ClaimGuard
          </h1>
          <p className="text-slate-500 font-mono mt-2 text-sm uppercase tracking-wider">Official Triage Report • Claim #{claim.claim_id?.substring(0, 8)}</p>
        </div>

        {/* Triage Summary */}
        <div className="tech-panel p-6 print:border-none print:shadow-none print:p-0">
          <h3 className="text-sm font-bold mb-4 border-b border-slate-200 pb-4 uppercase tracking-widest text-slate-900">Triage Summary</h3>
        <p className="text-slate-700 leading-relaxed mb-6 font-mono text-sm">{report.summary}</p>
        
        <div className="bg-slate-50 p-4 rounded-none border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">AI Recommended Action</p>
            <p className="text-lg font-bold text-slate-900 uppercase">{report.recommendation.replace(/_/g, ' ')}</p>
          </div>
          <div className="md:text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Preliminary Payable</p>
            <p className="text-2xl font-mono font-bold text-slate-900">
              ₹{claim.state.settlement?.preliminary_payable?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Assumptions & Unresolved */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="tech-panel p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Info className="w-4 h-4 text-slate-500" />
            AI Assumptions
          </h4>
          <ul className="space-y-3">
            {report.assumptions?.length > 0 ? report.assumptions.map((item: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-none border border-slate-200 border-l-2 border-l-slate-900">
                <span className="text-slate-400 font-bold shrink-0">#</span>
                <span className="font-mono text-xs">{item}</span>
              </li>
            )) : <li className="text-xs font-mono text-slate-500 uppercase">None</li>}
          </ul>
        </div>
        
        <div className="tech-panel p-6">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            Unresolved Info
          </h4>
          <ul className="space-y-3">
            {report.unresolved_information?.length > 0 ? report.unresolved_information.map((item: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-none border border-slate-200 border-l-2 border-l-amber-500">
                <span className="text-amber-500 font-bold shrink-0">!</span>
                <span className="font-mono text-xs">{item}</span>
              </li>
            )) : <li className="text-xs font-mono text-slate-500 uppercase">None</li>}
          </ul>
        </div>
      </div>
      
      </div> {/* End of printable area */}

      {/* Human Adjuster Controls */}
      <div className="tech-panel-dark p-6 mt-12 print:hidden">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2 uppercase tracking-widest text-white">
          <Send className="w-4 h-4 text-slate-400" />
          Human Adjuster Review
        </h3>
        <p className="text-slate-400 text-sm mb-6 font-mono">Review the AI's findings and make a final determination for this workflow phase.</p>
        
        <div className="flex flex-wrap gap-4">
          <button disabled={submittingAction !== null} onClick={() => handleAdjusterDecision('APPROVE')} className="flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-200 px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50">
            {submittingAction === 'APPROVE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
          </button>
          
          <button disabled={submittingAction !== null} onClick={() => handleAdjusterDecision('REQUEST_DOCUMENTS')} className="flex items-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-200 px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50">
            {submittingAction === 'REQUEST_DOCUMENTS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Request Docs
          </button>
          
          <button disabled={submittingAction !== null} onClick={() => handleAdjusterDecision('ESCALATE')} className="flex items-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-200 px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50">
            {submittingAction === 'ESCALATE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Escalate
          </button>
          
          <button disabled={submittingAction !== null} onClick={() => handleAdjusterDecision('REJECT')} className="flex items-center gap-2 bg-transparent border border-rose-900 text-rose-500 hover:bg-rose-950 px-6 py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors ml-auto disabled:opacity-50">
            {submittingAction === 'REJECT' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
          </button>
        </div>
      </div>
    </div>
  );
}
