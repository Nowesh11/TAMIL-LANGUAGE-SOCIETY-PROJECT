import React, { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowRight, FiArrowLeft, FiLock, FiKey } from 'react-icons/fi';
import Head from 'next/head';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send Verification Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');

      toast.success(data.message || 'Verification code sent!');
      setStep('verify');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          verificationCode, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success(data.message || 'Password reset successfully!');
      // Optional: Redirect to login or show success state
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Tamil Language Society</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center aurora-bg p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="card-morphism rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  {step === 'email' ? <FiLock className="w-8 h-8 text-primary" /> : <FiKey className="w-8 h-8 text-primary" />}
                </div>
                <h1 className="text-3xl font-bold gradient-title mb-2">
                  {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
                </h1>
                <p className="text-foreground-secondary">
                  {step === 'email' 
                    ? "No worries, we'll send you a verification code." 
                    : "Enter the code sent to your email and your new password."}
                </p>
              </div>

              {step === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-foreground-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter your email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3.5 btn-primary rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Code <FiArrowRight />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {/* Verification Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary ml-1">Verification Code</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiKey className="text-foreground-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all tracking-widest font-mono text-center text-lg"
                        placeholder="123456"
                        maxLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary ml-1">New Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-foreground-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="New password (min 8 chars)"
                        minLength={8}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground-secondary ml-1">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-foreground-muted group-focus-within:text-primary transition-colors" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Confirm new password"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !verificationCode || !newPassword}
                    className="w-full py-3.5 btn-primary rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Reset Password <FiCheckCircle />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button" 
                      onClick={() => setStep('email')}
                      className="text-sm text-foreground-muted hover:text-primary transition-colors"
                    >
                      Change Email?
                    </button>
                  </div>
                </form>
              )}
              
              <div className="text-center mt-6">
                <Link href="/login" className="inline-flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors text-sm">
                  <FiArrowLeft /> Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
