import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import Head from 'next/head';
import { toast } from 'react-hot-toast';

export default function SignupPage() {
  const { signup, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      // Pass email first, then password, then name object (using entered name for both en and ta)
      const result = await signup(
        formData.email, 
        formData.password, 
        { en: formData.name, ta: formData.name }
      );
      
      if (result.success) {
        toast.success('Account created successfully!');
        router.push('/');
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - Tamil Language Society</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center aurora-bg p-4 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10">
          <div className="card-morphism p-8 sm:p-12 overflow-hidden relative group">
            {/* Decorative Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 transform group-hover:scale-110 transition-transform duration-500 shadow-glow">
                <FiUser className="text-3xl text-primary" />
              </div>
              <h1 className="text-4xl font-black text-foreground mb-3 tracking-tighter uppercase">Join TLS</h1>
              <p className="text-foreground-secondary font-bold uppercase tracking-widest text-[10px] opacity-60">Create your community account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="text-foreground-muted group-focus-within/input:text-primary transition-colors text-lg" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-surface-hover/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-foreground-muted group-focus-within/input:text-primary transition-colors text-lg" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-surface-hover/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-foreground-muted group-focus-within/input:text-primary transition-colors text-lg" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-surface-hover/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-foreground-muted group-focus-within/input:text-primary transition-colors text-lg" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-surface-hover/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold shadow-inner"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || authLoading}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account <FiArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-border/50 text-center">
              <p className="text-foreground-secondary font-bold text-sm">
                Already part of TLS?{' '}
                <Link href="/login" virtual-link="true" className="text-primary font-black hover:text-secondary transition-colors uppercase tracking-widest ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
