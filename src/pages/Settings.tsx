import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Mail, Bell, Shield, Moon, Globe, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    avatarUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'profiles', user.uid));
      if (docSnap.exists()) {
        setProfile(docSnap.data() as any);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        fullName: profile.fullName,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and research preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Navigation */}
        <div className="md:col-span-4 flex flex-col gap-1">
          {[
            { label: 'Profile', icon: User, active: true },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Security', icon: Shield, active: false },
            { label: 'Appearance', icon: Moon, active: false },
            { label: 'Language', icon: Globe, active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md"
          >
            <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <img 
                    src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}`} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-2xl border-2 border-white/10 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{profile.fullName || 'User'}</h4>
                  <p className="text-slate-500 text-sm">Update your photo and personal details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Mail size={14} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-600 italic">Email cannot be changed as it's linked to your Google account.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-slate-500 text-sm mb-6">Permanently delete your account and all your research data. This action cannot be undone.</p>
            <button className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
