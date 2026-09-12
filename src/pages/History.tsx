import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Research } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, FileText, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function History() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('researches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearches(data || []);
    } catch (error: any) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('researches').delete().eq('id', id);
      if (error) throw error;
      setResearches(researches.filter(r => r.id !== id));
      toast.success('Research deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">Research History</h1>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : researches.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No research reports found.</p>
            <Button className="mt-4" onClick={() => navigate('/')}>Start your first research</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {researches.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => navigate(`/research/${item.id}`)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1">{item.query}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-red-500"
                      onClick={(e) => handleDelete(e, item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
