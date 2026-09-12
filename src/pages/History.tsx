import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Trash2, ExternalLink, Calendar, FileText, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Research {
  id: string;
  title: string;
  query: string;
  depth: string;
  status: string;
  createdAt: any;
}

export default function History() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'researches'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResearches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Research)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this research?")) return;

    try {
      await deleteDoc(doc(db, 'researches', id));
      toast.success("Research deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const filteredResearches = researches.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Research History</h1>
          <p className="text-slate-400">View and manage all your past research projects.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all text-sm text-white w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredResearches.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Link 
                to={`/research/${r.id}`}
                className="block group bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 rounded-2xl p-6 transition-all h-full relative overflow-hidden"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${
                      r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                      r.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {r.status === 'completed' ? <FileText size={20} /> : 
                       r.status === 'failed' ? <AlertCircle size={20} /> : <Clock size={20} className="animate-pulse" />}
                    </div>
                    <button 
                      onClick={(e) => handleDelete(r.id, e)}
                      className="p-2 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {r.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 italic">
                    "{r.query}"
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold">
                      <span className={`${
                        r.depth === 'deep' ? 'text-purple-400' : 
                        r.depth === 'standard' ? 'text-blue-400' : 'text-cyan-400'
                      }`}>
                        {r.depth}
                      </span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Calendar size={10} />
                        {r.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-white transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredResearches.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No research found</p>
            <p className="text-sm">Try searching for something else or start a new research.</p>
          </div>
        )}
      </div>
    </div>
  );
}
