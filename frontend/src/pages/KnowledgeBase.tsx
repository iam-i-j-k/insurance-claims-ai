import { BookOpen, Search } from 'lucide-react';

export default function KnowledgeBase() {
  const policies = [
    { id: 'POL-M-01', type: 'Motor', title: 'Comprehensive Auto Coverage', exclusion: 'Racing or track use' },
    { id: 'POL-H-01', type: 'Health', title: 'Inpatient Hospitalization', exclusion: 'Pre-existing conditions within 12 months' },
    { id: 'POL-P-01', type: 'Property', title: 'Homeowner standard fire', exclusion: 'Earthquake & flood damage' }
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Policy Knowledge Base</h1>
          <p className="text-sm text-slate-500">The grounding data used by the Coverage Assessment Agent.</p>
        </div>
      </div>

      <div className="tech-panel overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search guidelines..." className="pl-9 pr-4 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map(p => (
            <div key={p.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 transition-all bg-white shadow-sm cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono font-bold text-slate-400">{p.id}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{p.type}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{p.title}</h3>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Key Exclusion</span>
                <p className="text-xs text-slate-600 font-medium">{p.exclusion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
