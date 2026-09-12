import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
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

    const fetchInitialData = async () => {
      // Fetch research
      const { data: researchData, error: researchError } = await supabase
        .from('researches')
        .select('*')
        .eq('id', id)
        .single();
      
      if (researchError) {
        toast.error("Research not found");
        navigate('/history');
        return;
      }
      setResearch(researchData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('research_id', id)
        .order('created_at', { ascending: true });
      
      if (!messagesError) {
        setMessages(messagesData || []);
      }
    };

    fetchInitialData();

    // Subscribe to research updates
    const researchChannel = supabase
      .channel(`research_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'researches',
        filter: `id=eq.${id}`
      }, (payload) => {
        const newData = payload.new as ResearchData;
        setResearch(prev => {
          if (newData.status === 'completed' && prev?.status !== 'completed') {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#a855f7', '#3b82f6', '#06b6d4']
            });
            toast.success("Research completed successfully!");
          }
          return newData;
        });
      })
      .subscribe();

    // Subscribe to messages updates
    const messagesChannel = supabase
      .channel(`messages_${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `research_id=eq.${id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(researchChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [id, user, navigate]);

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
    if (!id || !user || !research) return;
    setIsResearching(true);
    
    try {
      // 1. Set status to in_progress
      await supabase.from('researches').update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }).eq('id', id);

      console.log('--- Research Start ---');
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          query: research.query,
          depth: research.depth
        })
      });
      
      // Check status FIRST
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI Error Status:', response.status);
        console.error('❌ AI Error Body:', errorText);
        throw new Error(`AI request failed (${response.status}): ${errorText.slice(0, 200)}`);
      }

      // Check content-type BEFORE parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const rawText = await response.text();
        console.error('❌ Non-JSON response received:', rawText.slice(0, 500));
        throw new Error('Server returned HTML instead of JSON. Check the endpoint URL.');
      }

      const data = await response.json();
      
      // 2. Save the report
      await supabase.from('researches').update({
        report: data.report,
        status: 'completed',
        summary: data.report.substring(0, 1000).replace(/[#*`]/g, '') + '...',
        updated_at: new Date().toISOString()
      }).eq('id', id);

    } catch (error: any) {
      console.error('Research error:', error);
      toast.error(`خطای تحقیق: ${error.message || 'مشکلی در ارتباط با سرور رخ داد'}`);
      
      // Mark as failed
      try {
        await supabase.from('researches').update({
          status: 'failed',
          updated_at: new Date().toISOString()
        }).eq('id', id);
      } catch (e) {
        console.error('Failed to set error status:', e);
      }
    } finally {
      setIsResearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isChatting || !id || !user || !research?.report) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsChatting(true);

    try {
      // Add user message
      await supabase.from('messages').insert({
        research_id: id,
        user_id: user.id,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      });

      // Call chat API with robust pattern
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: userMessage,
          report: research.report
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat failed (${response.status}): ${errorText.slice(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON.');
      }
      
      const data = await response.json();

      // Add assistant message
      await supabase.from('messages').insert({
        research_id: id,
        user_id: user.id,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(`خطای چت: ${error.message || 'مشکلی رخ داد'}`);
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
                  {new Date(research.created_at).toLocaleDateString()}
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
