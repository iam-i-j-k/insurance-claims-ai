import { X, Network, Cpu, Database, Shield, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArchitectureModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Agentic Architecture Graph</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">LangGraph State Routing • 6 Autonomous Nodes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto bg-[#f8fafc] flex-1 flex items-center justify-center">
            {/* Visual Graph Representation */}
            <div className="relative w-full max-w-3xl aspect-[4/3] bg-white border border-slate-200 rounded-xl shadow-sm p-8 flex flex-col justify-between items-center">
              
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-4 left-4">Input: Unstructured Claim Data</div>
              
              <div className="flex justify-center w-full relative z-10">
                <Node icon={<Cpu />} title="1. Intake Agent" desc="Extracts JSON via GPT-4o" color="text-slate-700" bg="bg-slate-100" border="border-slate-300" />
              </div>
              
              <div className="h-12 w-0.5 bg-blue-200"></div>
              
              <div className="flex justify-center w-full relative z-10">
                <Node icon={<Network />} title="2. Classifier" desc="Determines Line & Severity" color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
              </div>

              <div className="h-12 w-0.5 bg-blue-200"></div>
              
              <div className="flex justify-between w-full relative z-10 px-12">
                <div className="w-full h-0.5 bg-blue-200 absolute top-1/2 left-0 -z-10"></div>
                <Node icon={<Database />} title="3. Policy Validator" desc="Checks Coverage Exclusions" color="text-emerald-700" bg="bg-emerald-50" border="border-emerald-200" />
                <Node icon={<Shield />} title="4. Fraud Detector" desc="Flags SIU anomalies" color="text-rose-700" bg="bg-rose-50" border="border-rose-200" />
              </div>
              
              <div className="flex justify-between w-full px-32 mt-12 relative z-10">
                <div className="w-0.5 h-12 bg-blue-200 absolute -top-12 left-[150px] -z-10"></div>
                <div className="w-0.5 h-12 bg-blue-200 absolute -top-12 right-[150px] -z-10"></div>
                
                <Node icon={<Zap />} title="5. Settlement Engine" desc="Calculates payout & deductibles" color="text-amber-700" bg="bg-amber-50" border="border-amber-200" />
              </div>
              
              <div className="h-12 w-0.5 bg-blue-200 relative left-[-80px]"></div>
              
              <div className="flex justify-center w-full relative z-10">
                <Node icon={<RefreshCw />} title="6. Critique Agent" desc="Self-reflection & validation" color="text-purple-700" bg="bg-purple-50" border="border-purple-200" />
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Node({ icon, title, desc, color, bg, border }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${border} ${bg} min-w-[220px] shadow-sm`}>
      <div className={`p-2 rounded-lg bg-white ${color} shadow-sm border ${border}`}>
        {icon}
      </div>
      <div>
        <h4 className={`text-xs font-bold ${color}`}>{title}</h4>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
