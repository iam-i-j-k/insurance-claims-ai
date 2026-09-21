import { AlertTriangle, AlertOctagon, CheckCircle, Info } from 'lucide-react';

export default function RiskPanel({ fraud }: { fraud: any }) {
  if (!fraud) {
    return <div className="text-slate-500 py-8 text-center border border-dashed border-slate-300 bg-slate-50 rounded-none font-mono text-sm">Risk assessment not yet available.</div>;
  }

  const getRiskStyle = (level: string) => {
    switch(level) {
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'LOW': return <CheckCircle className="w-8 h-8 text-emerald-600" />;
      case 'MEDIUM': return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'HIGH': return <AlertTriangle className="w-8 h-8 text-orange-600" />;
      case 'CRITICAL': return <AlertOctagon className="w-8 h-8 text-red-600" />;
      default: return <Info className="w-8 h-8 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-none border flex flex-col md:flex-row md:items-center gap-6 ${getRiskStyle(fraud.risk_level)}`}>
        <div className="bg-white p-3 rounded-none border border-slate-200 shrink-0 self-start md:self-center">
          {getRiskIcon(fraud.risk_level)}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1 uppercase tracking-widest font-mono">
            {fraud.risk_level} RISK DETECTED
          </h3>
          <p className="font-mono text-xs opacity-90 uppercase tracking-widest mt-2">
            <span className="font-bold">Risk Score: {fraud.risk_score}/100</span> <span className="hidden md:inline mx-2">•</span><br className="md:hidden" /> <span className="opacity-75">Recommendation:</span> {fraud.recommended_action}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="tech-panel p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            Identified Risk Indicators
          </h4>
          <ul className="space-y-3">
            {fraud.indicators?.length > 0 ? fraud.indicators.map((indicator: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-none border border-slate-200 border-l-2 border-l-amber-500">
                <span className="text-amber-500 font-bold shrink-0">!</span>
                <span className="font-mono text-xs">{indicator}</span>
              </li>
            )) : (
              <li className="text-slate-500 text-xs font-mono uppercase">No significant risk indicators identified.</li>
            )}
          </ul>
        </div>

        <div className="tech-panel p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Info className="w-4 h-4 text-slate-500" />
            AI Assessment Rationale
          </h4>
          <ul className="space-y-3">
            {fraud.rationale?.length > 0 ? fraud.rationale.map((reason: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-none border border-slate-200 border-l-2 border-l-blue-500">
                <span className="text-blue-500 font-bold shrink-0">#</span>
                <span className="font-mono text-xs">{reason}</span>
              </li>
            )) : (
              <li className="text-slate-500 text-xs font-mono uppercase">Rationale not provided.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
