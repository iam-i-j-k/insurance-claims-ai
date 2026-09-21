import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function WorkflowStatus({ claim }: { claim: any }) {
  const state = claim.state;
  
  const steps = [
    { id: 'intake_agent', label: 'Document Intake & Extraction' },
    { id: 'classification_agent', label: 'Claim Classification' },
    { id: 'coverage_agent', label: 'Coverage Assessment' },
    { id: 'fraud_agent', label: 'Fraud & Risk Analysis' },
    { id: 'settlement_agent', label: 'Settlement Calculation' },
    { id: 'reviewer_agent', label: 'Review & Reflection' },
    { id: 'report_agent', label: 'Report Generation' }
  ];

  const currentIndex = steps.findIndex(s => s.id === state.current_agent);
  const isCompleted = state.workflow_status === 'COMPLETED' || state.workflow_status === 'APPROVED' || state.workflow_status === 'REJECTED';
  const isFailed = state.workflow_status === 'FAILED';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Agentic Workflow Execution</h3>
        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
          
          <div className="space-y-6 relative">
            {steps.map((step, index) => {
              let status = 'pending';
              if (isCompleted || index < currentIndex) status = 'completed';
              else if (!isCompleted && index === currentIndex && !isFailed) status = 'running';
              else if (isFailed && index === currentIndex) status = 'failed';

              return (
                <div key={step.id} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border border-slate-200 bg-white z-10 transition-colors
                    ${status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                      status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' : 
                      status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                      'bg-slate-50 text-slate-400'}`}>
                    {status === 'completed' && <CheckCircle className="w-5 h-5" />}
                    {status === 'running' && <Clock className="w-5 h-5" />}
                    {status === 'failed' && <AlertTriangle className="w-5 h-5" />}
                    {status === 'pending' && <span className="font-mono text-sm">{index + 1}</span>}
                  </div>
                  
                  <div className="tech-panel p-4 flex-1">
                    <h4 className="font-bold text-slate-800">{step.label}</h4>
                    <p className="text-sm text-slate-500 font-mono mt-1">Node: {step.id}</p>
                    
                    {status === 'running' && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Agent is analyzing...
                      </div>
                    )}
                    
                    {status === 'failed' && state.errors?.map((err: any, i: number) => (
                      <div key={i} className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-none text-sm border border-rose-200 font-mono">
                        {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {state.retry_count > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-none text-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs">Reprocessing Triggered</h4>
            <p className="text-sm mt-1">The Reviewer Agent detected issues and routed the workflow back for correction {state.retry_count} time(s).</p>
          </div>
        </div>
      )}

      {/* Live Audit Terminal */}
      <div className="mt-8 tech-panel-dark">
        <div className="bg-[#0b1120] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-none bg-rose-500"></div>
            <div className="w-3 h-3 rounded-none bg-amber-500"></div>
            <div className="w-3 h-3 rounded-none bg-emerald-500"></div>
          </div>
          <span className="text-xs font-mono text-slate-400">agent_execution.log</span>
        </div>
        <div className="p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto flex flex-col gap-1.5 scroll-smooth">
          {state.audit_log?.map((logItem: any, idx: number) => {
            const logStr = typeof logItem === 'string' ? logItem : JSON.stringify(logItem);
            return (
              <div key={idx} className={logStr.includes('⚠️') ? 'text-amber-400' : logStr.includes('✅') ? 'text-emerald-400' : 'text-blue-300'}>
                {logStr}
              </div>
            );
          })}
          {state.workflow_status === 'RUNNING' && (
            <div className="animate-pulse text-slate-400 mt-2">_</div>
          )}
          {isCompleted && (
            <div className="text-slate-400 mt-2">Process exited with status 0.</div>
          )}
        </div>
      </div>
    </div>
  );
}
