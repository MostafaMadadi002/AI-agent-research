import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Research } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Share2, Download, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function ResearchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [research, setResearch] = useState<Research | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResearch() {
      try {
        const { data, error } = await supabase
          .from('researches')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setResearch(data);
      } catch (error: any) {
        toast.error('Failed to load research');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchResearch();
  }, [id, navigate]);

  const handleDownload = () => {
    if (!research) return;
    const element = document.createElement("a");
    const file = new Blob([research.report], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${research.query.replace(/\s+/g, '_')}_Report.md`;
    document.body.appendChild(element);
    element.click();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!research) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">Research Report</Badge>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              {research.query}
            </h1>
            <div className="flex items-center text-slate-500 text-sm gap-4">
              <span>By AI Assistant</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{new Date(research.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4">
            <ReactMarkdown>{research.report}</ReactMarkdown>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
