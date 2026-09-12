import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Search, Loader2, History, LogOut } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error('Research failed');
      const { report } = await response.json();

      const { data, error } = await supabase
        .from('researches')
        .insert({
          user_id: user.id,
          query,
          report,
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/research/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">AI Research Agent</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">What would you like to research today?</CardTitle>
              <CardDescription>Enter any topic and our AI will generate a detailed report for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResearch} className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    className="pl-10 h-14 text-lg"
                    placeholder="e.g. The impact of quantum computing on cybersecurity..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button className="h-12 text-lg font-semibold" disabled={loading || !query.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    'Start Research'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
