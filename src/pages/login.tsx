import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import DynamicComponent from '../components/DynamicComponent';
import { useLanguage } from '../hooks/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { getAuthContent, getPageSEO } from '../lib/getPageContent';

interface LoginFormData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginPageProps {
  authContent: {
    login: any;
    messages: any;
  };
  seoData: {
    title: string;
    description: string;
  } | null;
}

const Login: React.FC<LoginPageProps> = ({ authContent, seoData }) => {
  const { lang } = useLanguage();
  const { login, user } = useAuth();
  const router = useRouter();
  
  const [components, setComponents] = useState<any[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [forgotPasswordData, setForgotPasswordData] = useState<ForgotPasswordData>({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch components
  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      setComponentsLoading(true);
      const res = await fetch('/api/components/page?page=login');
      const data = await res.json();
      if (data.success) {
        setComponents(data.components || []);
      }
    } catch (error) { 
      console.error('Error fetching components:', error);
      setComponents([]);
    } finally {
      setComponentsLoading(false);
    }
  }

  // Redirect if already logged in based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleForgotPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      // Role-based navigation after successful login
      if (result.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setSuccess(data.message);
      setShowResetForm(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (forgotPasswordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordData.email,
          verificationCode: forgotPasswordData.verificationCode,
          newPassword: forgotPasswordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(data.message);
      setTimeout(() => {
        setShowForgotPassword(false);
        setShowResetForm(false);
        setForgotPasswordData({
          email: '',
          verificationCode: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const text = {
    en: {
      title: seoData?.title || 'Login - Tamil Language Society',
      heading: authContent.login.heading || 'Welcome Back',
      subheading: authContent.login.subheading || 'Sign in to your account',
      email: authContent.login.email || 'Email Address',
      password: authContent.login.password || 'Password',
      loginButton: authContent.login.loginButton || 'Sign In',
      forgotPassword: authContent.login.forgotPassword || 'Forgot your password?',
      noAccount: authContent.login.noAccount || "Don't have an account?",
      signUp: authContent.login.signUp || 'Sign up here',
      forgotPasswordTitle: authContent.login.forgotPasswordTitle || 'Reset Your Password',
      forgotPasswordSubtitle: authContent.login.forgotPasswordSubtitle || 'Enter your email to receive a verification code',
      sendCode: authContent.login.sendCode || 'Send Verification Code',
      verificationCode: authContent.login.verificationCode || 'Verification Code',
      newPassword: authContent.login.newPassword || 'New Password',
      confirmPassword: authContent.login.confirmPassword || 'Confirm Password',
      resetPassword: authContent.login.resetPassword || 'Reset Password',
      backToLogin: authContent.login.backToLogin || 'Back to Login',
      enterCode: authContent.login.enterCode || 'Enter the 6-digit code sent to your email'
    },
    ta: {
      title: seoData?.title || 'உள்நுழைவு - தமிழ் மொழி சங்கம்',
      heading: authContent.login.heading || 'மீண்டும் வரவேற்கிறோம்',
      subheading: authContent.login.subheading || 'உங்கள் கணக்கில் உள்நுழையுங்கள்',
      email: authContent.login.email || 'மின்னஞ்சல் முகவரி',
      password: authContent.login.password || 'கடவுச்சொல்',
      loginButton: authContent.login.loginButton || 'உள்நுழையுங்கள்',
      forgotPassword: authContent.login.forgotPassword || 'கடவுச்சொல் மறந்துவிட்டதா?',
      noAccount: authContent.login.noAccount || 'கணக்கு இல்லையா?',
      signUp: authContent.login.signUp || 'இங்கே பதிவு செய்யுங்கள்',
      forgotPasswordTitle: authContent.login.forgotPasswordTitle || 'உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்',
      forgotPasswordSubtitle: authContent.login.forgotPasswordSubtitle || 'சரிபார்ப்பு குறியீட்டைப் பெற உங்கள் மின்னஞ்சலை உள்ளிடவும்',
      sendCode: authContent.login.sendCode || 'சரிபார்ப்பு குறியீட்டை அனுப்பவும்',
      verificationCode: authContent.login.verificationCode || 'சரிபார்ப்பு குறியீடு',
      newPassword: authContent.login.newPassword || 'புதிய கடவுச்சொல்',
      confirmPassword: authContent.login.confirmPassword || 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
      resetPassword: authContent.login.resetPassword || 'கடவுச்சொல்லை மீட்டமைக்கவும்',
      backToLogin: authContent.login.backToLogin || 'உள்நுழைவுக்குத் திரும்பவும்',
      enterCode: authContent.login.enterCode || 'உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6-இலக்க குறியீட்டை உள்ளிடவும்'
    }
  };

  const currentText = text[lang];

  if (componentsLoading) {
    return (
      <div className="font-sans min-h-screen aurora-gradient layout-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading page components...</p>
        </div>
      </div>
    );
  }

  const sortedComponents = [...components].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter components by type for organized rendering
  const seoComponents = sortedComponents.filter(c => c.type === 'seo');
  const navbarComponents = sortedComponents.filter(c => c.type === 'navbar');
  const heroComponents = sortedComponents.filter(c => c.type === 'hero');
  const contentComponents = sortedComponents.filter(c => 
    c.type !== 'seo' && c.type !== 'navbar' && c.type !== 'hero' && c.type !== 'footer'
  );
  const footerComponents = sortedComponents.filter(c => c.type === 'footer');

  return (
    <>
      {/* SEO Components */}
      {seoComponents.map((component) => (
        <DynamicComponent key={component._id} component={component} />
      ))}
      
      <div className="font-sans min-h-screen aurora-gradient layout-page">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={component._id} component={component} />
        ))}
        
        {/* Hero Components */}
        {heroComponents.length > 0 && (
          <section className="-mt-10 hero-gradient">
            <div className="layout-container">
              {heroComponents.map((component) => (
                <div key={component._id} className="layout-card animate-fade-in">
                  <DynamicComponent component={component} />
                </div>
              ))}
            </div>
            <div className="divider-glow" />
          </section>
        )}

        {/* Content Components */}
        <section className="layout-section">
          <div className="layout-container">
            <div className="section-stack">
              {contentComponents.map((component) => (
                <div key={component._id} className="layout-card animate-slide-in-up">
                  <DynamicComponent component={component} />
                </div>
              ))}
            </div>
          </div>
        </section>
      
        <main className="auth-page">
        <div className="auth-container">
          {!showForgotPassword ? (
            // Login Form
            <>
              <div className="auth-header">
                <h1 className="auth-title">
                  {currentText.heading}
                </h1>
                <p className="auth-subtitle">
                  {currentText.subheading}
                </p>
              </div>

              {error && (
                <div className="auth-message error">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    {currentText.email}
                  </label>
                  <div className="input-icon">📧</div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    {currentText.password}
                  </label>
                  <div className="input-icon">🔒</div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`auth-submit ${loading ? 'loading' : ''}`}
                >
                  {loading ? '' : currentText.loginButton}
                </button>
              </form>

              <div className="auth-links">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="auth-link"
                >
                  {currentText.forgotPassword}
                </button>
                
                <div className="auth-footer-text">
                  {currentText.noAccount}{' '}
                  <Link href="/sign" className="auth-link">
                    {currentText.signUp}
                  </Link>
                </div>
              </div>
            </>
          ) : (
            // Forgot Password Form
            <div className="forgot-password-form">
              <div className="auth-header">
                <h1 className="auth-title">
                  {currentText.forgotPasswordTitle}
                </h1>
                <p className="auth-subtitle">
                  {!showResetForm ? currentText.forgotPasswordSubtitle : currentText.enterCode}
                </p>
              </div>

              {error && (
                <div className="auth-message error">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="auth-message success">
                  <p>{success}</p>
                </div>
              )}

              {!showResetForm ? (
                // Email Form
                <form onSubmit={handleForgotPassword} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="forgot-email" className="form-label">
                      {currentText.email}
                    </label>
                    <div className="input-icon">📧</div>
                    <input
                      type="email"
                      id="forgot-email"
                      name="email"
                      value={forgotPasswordData.email}
                      onChange={handleForgotPasswordChange}
                      required
                      className="form-input"
                      placeholder="your@email.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`auth-submit ${loading ? 'loading' : ''}`}
                  >
                    {loading ? '' : currentText.sendCode}
                  </button>
                </form>
              ) : (
                // Reset Form
                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="verification-code" className="form-label">
                      {currentText.verificationCode}
                    </label>
                    <div className="input-icon">🔑</div>
                    <input
                      type="text"
                      id="verification-code"
                      name="verificationCode"
                      value={forgotPasswordData.verificationCode}
                      onChange={handleForgotPasswordChange}
                      required
                      maxLength={6}
                      className="form-input"
                      placeholder="123456"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new-password" className="form-label">
                      {currentText.newPassword}
                    </label>
                    <div className="input-icon">🔒</div>
                    <input
                      type="password"
                      id="new-password"
                      name="newPassword"
                      value={forgotPasswordData.newPassword}
                      onChange={handleForgotPasswordChange}
                      required
                      minLength={8}
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm-password" className="form-label">
                      {currentText.confirmPassword}
                    </label>
                    <div className="input-icon">🔒</div>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirmPassword"
                      value={forgotPasswordData.confirmPassword}
                      onChange={handleForgotPasswordChange}
                      required
                      minLength={8}
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`auth-submit ${loading ? 'loading' : ''}`}
                  >
                    {loading ? '' : currentText.resetPassword}
                  </button>
                </form>
              )}

              <div className="auth-links">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowResetForm(false);
                    setError('');
                    setSuccess('');
                    setForgotPasswordData({
                      email: '',
                      verificationCode: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="back-to-login"
                >
                  ← {currentText.backToLogin}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer Components */}
      {footerComponents.length > 0 && (
        <footer className="layout-footer">
          {footerComponents.map((component) => (
            <DynamicComponent key={component._id} component={component} />
          ))}
        </footer>
      )}
    </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const authContent = await getAuthContent();
    const seoData = await getPageSEO('login');
    
    return {
      props: {
        authContent,
        seoData
      }
    };
  } catch (error) {
    console.error('Error fetching login page data:', error);
    return {
      props: {
        authContent: { login: {}, messages: {} },
        seoData: { title: 'Login - Tamil Language Society', description: 'Sign in to your account' }
      }
    };
  }
};

export default Login;