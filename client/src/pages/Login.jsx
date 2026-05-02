import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-mesh min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass w-full max-w-md p-8 relative overflow-hidden"
      >
        {/* Glow orbs behind the glass card */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 w-full">
          {/* Logo */}
          <motion.div variants={item} className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse-glow">
              <Wallet className="w-8 h-8 text-white relative z-10" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 tracking-tight">SpendSmart</h1>
            <p className="text-slate-400 text-sm mt-2">Track smarter, spend better</p>
          </motion.div>

          {/* Tab indicator */}
          <motion.div variants={item} className="flex mb-8 bg-white/5 rounded-xl p-1 shadow-inner border border-white/5">
            <div className="flex-1 text-center py-2.5 rounded-lg bg-white/10 text-white font-medium text-sm shadow-sm">
              Login
            </div>
            <Link
              to="/signup"
              className="flex-1 text-center py-2.5 rounded-lg text-slate-400 hover:text-white transition text-sm"
            >
              Sign Up
            </Link>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={item} className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-violet-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input pl-12 py-3.5 focus:ring-4 focus:ring-violet-500/20"
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={item} className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-violet-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input pl-12 py-3.5 focus:ring-4 focus:ring-violet-500/20"
                autoComplete="current-password"
              />
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-4 text-base shadow-xl shadow-violet-500/20 group relative overflow-hidden"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <div className="flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </div>
                )}
              </button>
            </motion.div>
          </form>

          <motion.p variants={item} className="text-center text-slate-400 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
