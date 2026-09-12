import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Mic, Command } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const suggestionChips = [
    "AI trends 2025",
    "Climate change impact on oceans",
    "Crypto market analysis",
    "Future of renewable energy",
    "History of Roman Empire",
    "Benefits of mindfulness meditation"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      toast.error("You must be signed in to conduct research.");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    const path = 'researches';
    try {
      const docRef = await addDoc(collection(db, path), {
        userId: user.uid,
        title: query.trim().substring(0, 50),
        query: query.trim(),
        depth,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Navigate to active research view
      navigate(`/research/${docRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full"
      >
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
          <Sparkles size={14} className="text-purple-400" />
          Powered by Gemini 3.1 Pro
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
          Deep Research, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
            Powered by AI.
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
          Conduct comprehensive research on any topic. We analyze the web, synthesize information, and generate professional reports in seconds.
        </p>

        <form onSubmit={handleSubmit} className="relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl p-2 pl-6 backdrop-blur-2xl focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
            <Search className="text-slate-500 mr-3 shrink-0" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research today?"
              className="flex-1 bg-transparent border-none focus:outline-none text-white text-lg placeholder:text-slate-600 py-3"
              disabled={isSubmitting}
              maxLength={2000}
            />
            
            <div className="flex items-center gap-2 px-2 shrink-0">
              <button 
                type="button"
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Voice input (Cmd+V)"
              >
                <Mic size={20} />
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || !query.trim()}
                className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center gap-2"
              >
                {isSubmitting ? "Thinking..." : "Research"}
                <Command size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            {(['quick', 'standard', 'deep'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepth(d)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                  depth === d 
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          <span className="w-full text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Popular topics</span>
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
