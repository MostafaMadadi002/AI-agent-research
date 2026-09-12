import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrainCircuit, Chrome, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      } else {
        if (!name.trim()) throw new Error("Name is required");
        await signUpWithEmail(email, password, name);
        toast.success("Account created successfully!");
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[150px] -z-10 rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[150px] -z-10 rounded-full animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-600" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-purple-500/20">
              <BrainCircuit size={28} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? "Sign in to continue your research journey." : "Join ResearchMind to start exploring."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Sign Up"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0c] px-4 text-slate-500 font-medium tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-100 text-black font-bold rounded-xl transition-all active:scale-[0.98]"
          >
            <Chrome size={20} />
            Google Account
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
