import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';

const fetchAnalytics = async () => {
  const { data } = await axios.get('http://localhost:8000/api/analytics');
  return data;
};

export default function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 5000
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg shadow-blue-500/20"></div>
      </div>
    );
  }

  const pieData = [
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#f43f5e' },
    { name: 'Pending/Review', value: stats.pending, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-8">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Analytics Dashboard</h2>
        <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest">Real-time insights and claim volume metrics</p>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={item} className="tech-panel p-6 flex items-center gap-5">
          <div className="p-3 border border-slate-200 text-slate-700"><Activity className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Claims</p><p className="text-3xl font-mono text-slate-900">{stats.total}</p></div>
        </motion.div>
        
        <motion.div variants={item} className="tech-panel p-6 flex items-center gap-5">
          <div className="p-3 border border-slate-200 text-slate-700"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Approved</p><p className="text-3xl font-mono text-slate-900">{stats.approved}</p></div>
        </motion.div>
        
        <motion.div variants={item} className="tech-panel p-6 flex items-center gap-5">
          <div className="p-3 border border-slate-200 text-slate-700"><BarChart3 className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rejected</p><p className="text-3xl font-mono text-slate-900">{stats.rejected}</p></div>
        </motion.div>
        
        <motion.div variants={item} className="tech-panel p-6 flex items-center gap-5">
          <div className="p-3 border border-slate-200 text-slate-700"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Value</p>
            <p className="text-3xl font-mono text-slate-900">${stats.type_amounts.reduce((a: any, b: any) => a + b.amount, 0).toLocaleString()}</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item} className="tech-panel p-8">
          <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Claim Status Distribution</h3>
          <div className="h-72 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-mono">No data available</div>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="tech-panel p-8">
          <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Claim Amounts by Type</h3>
          <div className="h-72 w-full">
            {stats.type_amounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.type_amounts}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontFamily: 'monospace', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: '#64748b', fontFamily: 'monospace', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`$${val.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
