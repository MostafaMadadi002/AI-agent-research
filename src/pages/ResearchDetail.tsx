import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loader2, CheckCircle2, AlertCircle, Copy, Download, Share2, 
  FileText, Send, MessageSquare, ChevronRight, Globe, Brain, ListChecks, PenTool
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface ResearchData {
  id: string;
  title: string;
  query: string;
  depth: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  report?: string;
  summary?: string;
  createdAt: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
}

export default function ResearchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribeResearch = onSnapshot(doc(db, 'researches', id), (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as ResearchData;
        setResearch(data);
        
        if (data.status === 'completed' && research?.status !== 'completed') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#3b82f6', '#06b6d4']
          });
          toast.success("Research completed successfully!");
        }
      } else {
        toast.error("Research not found");
        navigate('/history');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `researches/${id}`);
    });

    const messagesPath = `researches/${id}/messages`;
    const unsubscribeMessages = onSnapshot(
      query(
        collection(db, messagesPath), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, messagesPath);
      }
    );

    return () => {
      unsubscribeResearch();
      unsubscribeMessages();
    };
  }, [id, user, navigate, research?.status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger research if it's pending
  useEffect(() => {
    if (research?.status === 'pending' && !isResearching) {
      triggerResearch();
    }
  }, [research?.status]);

  const triggerResearch = async () => {
    if (!id || !user) return;
    setIsResearching(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: research?.query,
          depth: research?.depth,
          researchId: id,
          userId: user.uid
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Research failed');
      }
    } catch (error: any) {
      console.error('Research error:', error);
      toast.error(`AI Research error: ${error.message || 'Something went wrong'}`);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isChatting || !id || !user) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsChatting(true);

    const messagesPath = `researches/${id}/messages`;
    try {
      // Add user message
      await addDoc(collection(db, messagesPath), {
        userId: user.uid,
        role: 'user',
        content: userMessage,
        createdAt: serverTimestamp()
      });

      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchId: id,
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      // Add assistant message
      await addDoc(collection(db, messagesPath), {
        userId: user.uid,
        role: 'assistant',
        content: data.reply,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesPath);
    } finally {
      setIsChatting(false);
    }
  };

  const copyToClipboard = () => {
    if (research?.report) {
      navigator.clipboard.writeText(research.report);
      toast.success("Report copied to clipboard");
    }
  };

  if (!research) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-10">
      {/* Main Content Area */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Header Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  research.depth === 'deep' ? 'bg-purple-500/20 text-purple-400' : 
                  research.depth === 'standard' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {research.depth} research
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-500 text-xs">
                  {research.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{research.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {research.status === 'completed' && (
                <>
                  <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Copy size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Download size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Share2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-t border-white/5">
             <div className="flex items-center gap-2">
                {research.status === 'in_progress' ? <Loader2 size={16} className="text-purple-400 animate-spin" /> : 
                 research.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                 research.status === 'failed' ? <AlertCircle size={16} className="text-red-400" /> : 
                 <div className="w-4 h-4 rounded-full border-2 border-white/20" />}
                <span className="text-sm font-medium capitalize text-slate-300">{research.status.replace('_', ' ')}</span>
             </div>
             <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: research.status === 'completed' ? '100%' : 
                           research.status === 'in_progress' ? '60%' : '5%' 
                  }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-600"
                />
             </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex-1 overflow-y-auto">
          {research.status === 'completed' && research.report ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-invert prose-purple max-w-none prose-headings:font-bold prose-a:text-purple-400 prose-strong:text-white"
            >
              <ReactMarkdown>{research.report}</ReactMarkdown>
            </motion.div>
          ) : research.status === 'in_progress' ? (
            <div className="flex flex-col items-center justify-center h-96 gap-6">
              <div className="relative">
                 <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                 <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" size={32} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold text-white">AI Research Agent is working...</h3>
                <p className="text-slate-400">Searching web sources and synthesizing information.</p>
              </div>
              
              <div className="w-full max-w-xs space-y-3">
                {[
                  { icon: Globe, label: "Searching web sources", done: true },
                  { icon: ListChecks, label: "Analyzing documents", done: true },
                  { icon: Brain, label: "Synthesizing information", done: false },
                  { icon: PenTool, label: "Generating report", done: false }
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 text-sm ${step.done ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <step.icon size={16} />
                    <span>{step.label}</span>
                    {step.done ? <CheckCircle2 size={14} /> : <Loader2 size={14} className="animate-spin" />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-4">
              <FileText size={48} strokeWidth={1} />
              <p>Waiting to start research...</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-4 max-h-[calc(100vh-8rem)]">
        <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full backdrop-blur-md">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-400" />
              <h3 className="font-bold text-white">Research Chat</h3>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-widest">Follow-up</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm italic">Ask follow-up questions about the research findings.</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-900/20' 
                    : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex items-center gap-2 text-slate-500 text-xs animate-pulse">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
            <div className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a follow-up question..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all pr-12 text-white"
                disabled={isChatting || research.status !== 'completed'}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || isChatting || research.status !== 'completed'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center italic">Gemini can make mistakes. Verify important info.</p>
          </form>
        </div>

        {/* Action Quick Links */}
        <div className="space-y-2">
           {[
             { label: "Executive Summary", icon: FileText },
             { label: "Key Sources", icon: Globe },
             { label: "Export as PDF", icon: Download },
           ].map((item, idx) => (
             <button key={idx} className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-slate-400 hover:text-white transition-all group">
               <div className="flex items-center gap-3">
                 <item.icon size={14} className="group-hover:text-purple-400" />
                 <span>{item.label}</span>
               </div>
               <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}
