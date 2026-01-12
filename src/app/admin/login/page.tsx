
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const AdminLoginContent: React.FC = () => {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Get redirect URL and message from query params
  useEffect(() => {
    if (searchParams) {
      const redirectUrl = searchParams.get('redirect');
      const queryMessage = searchParams.get('message');
      
      if (queryMessage) {
        setMessage(queryMessage);
      }
    }
  }, [searchParams]);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!loading && user && user.role === 'admin') {
      const redirectUrl = searchParams?.get('redirect') || '/admin/dashboard';
      router.replace(redirectUrl);
    } else if (!loading && user && user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
    }
  }, [user, loading, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.user.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      const redirectUrl = searchParams?.get('redirect') || '/admin/dashboard';
      router.push(redirectUrl);
      
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            TLS
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-500 text-sm">Sign in to access the admin panel</p>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 mb-6 text-sm">
            <FiCheckCircle />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-6 text-sm">
            <FiAlertCircle />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            label="Email Address"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="admin@example.com"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.email || !formData.password}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
};

export default function AdminLogin() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>}>
      <AdminLoginContent />
    </React.Suspense>
  );
}
