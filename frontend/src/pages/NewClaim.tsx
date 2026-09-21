import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, File as FileIcon, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function NewClaim() {
  const [files, setFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;
    
    setIsCreating(true);
    try {
      // 1. Create claim
      const { data: claimData } = await axios.post('http://localhost:8000/api/claims');
      const claimId = claimData.claim_id;
      
      // 2. Upload documents
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(`http://localhost:8000/api/claims/${claimId}/documents`, formData);
      }
      
      // 3. Start processing
      await axios.post(`http://localhost:8000/api/claims/${claimId}/process`);
      
      toast.success('Claim created successfully!');
      navigate(`/claims/${claimId}`);
    } catch (error) {
      console.error('Error creating claim:', error);
      toast.error('Failed to create claim');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
      className="max-w-2xl mx-auto tech-panel p-8 md:p-12 relative overflow-hidden"
    >
      <button onClick={() => navigate('/dashboard')} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <h2 className="text-4xl font-bold tracking-tight mb-3 text-slate-900">New Claim</h2>
      <p className="text-slate-500 mb-8 text-lg">Upload claim forms, estimates, and evidence documents to begin the AI triage process.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <motion.div 
          animate={{ scale: isDragging ? 1.02 : 1, borderColor: isDragging ? '#2563eb' : '#cbd5e1' }}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer relative overflow-hidden
            ${isDragging ? 'bg-blue-50/50' : 'bg-slate-50 hover:bg-slate-100'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
          />
          <motion.div 
            animate={{ y: isDragging ? -10 : 0 }}
            className="flex flex-col items-center pointer-events-none"
          >
            <div className={`p-4 rounded-xl mb-4 transition-colors border ${isDragging ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
              <UploadCloud className="w-10 h-10" />
            </div>
            <p className="font-semibold text-lg text-slate-700 mb-1">
              {isDragging ? 'Drop documents here!' : 'Click or drag documents here'}
            </p>
            <p className="text-sm text-slate-500">Supports PDF, DOCX, JPG, PNG</p>
          </motion.div>
        </motion.div>
        
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="tech-panel p-5 overflow-hidden"
            >
              <h4 className="text-sm font-semibold mb-3 text-slate-600 uppercase tracking-wider">Selected Documents ({files.length})</h4>
              <ul className="space-y-3">
                {files.map((file, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-3 px-4 border border-slate-200 border-l-4 border-l-slate-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 text-slate-600">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-slate-900">{file.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-end pt-4">
          <motion.button 
            whileHover={{ scale: (isCreating || files.length === 0) ? 1 : 1.02 }}
            whileTap={{ scale: (isCreating || files.length === 0) ? 1 : 0.98 }}
            type="submit" 
            disabled={isCreating || files.length === 0}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest uppercase shadow-sm disabled:opacity-50 transition-all hover:bg-slate-800"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing AI Triage...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Claim
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
