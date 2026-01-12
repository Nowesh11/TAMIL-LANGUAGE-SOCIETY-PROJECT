import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import DynamicComponent from '../components/DynamicComponent';
import { useLanguage } from '../hooks/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { getAuthContent, getPageSEO } from '../lib/getPageContent';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface SignupPageProps {
  authContent: {
    signup: any;
    messages: any;
  };
  seoData: {
    title: string;
    description: string;
  } | null;
}

const Signup: React.FC<SignupPageProps> = ({ authContent, seoData }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  
  const [components, setComponents] = useState<any[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  
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
      const res = await fetch('/api/components/page?page=signup');
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

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
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

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: {
            en: formData.name,
            ta: formData.name // For now, use the same name for both languages
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login page after successful signup
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const text = {
    en: {
      title: seoData?.title || 'Sign Up - Tamil Language Society',
      heading: authContent.signup.heading || 'Create Your Account',
      subheading: authContent.signup.subheading || 'Join the Tamil Language Society',
      email: authContent.signup.email || 'Email Address',
      password: authContent.signup.password || 'Password',
      confirmPassword: authContent.signup.confirmPassword || 'Confirm Password',
      name: authContent.signup.name || 'Full Name',
      signupButton: authContent.signup.signupButton || 'Create Account',
      haveAccount: authContent.signup.haveAccount || 'Already have an account?',
      login: authContent.signup.login || 'Sign in here'
    },
    ta: {
      title: seoData?.title || 'பதிவு - தமிழ் மொழி சங்கம்',
      heading: authContent.signup.heading || 'உங்கள் கணக்கை உருவாக்குங்கள்',
      subheading: authContent.signup.subheading || 'தமிழ் மொழி சங்கத்தில் சேருங்கள்',
      email: authContent.signup.email || 'மின்னஞ்சல் முகவரி',
      password: authContent.signup.password || 'கடவுச்சொல்',
      confirmPassword: authContent.signup.confirmPassword || 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
      name: authContent.signup.name || 'முழு பெயர்',
      signupButton: authContent.signup.signupButton || 'கணக்கை உருவாக்குங்கள்',
      haveAccount: authContent.signup.haveAccount || 'ஏற்கனவே கணக்கு உள்ளதா?',
      login: authContent.signup.login || 'இங்கே உள்நுழையுங்கள்'
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

          {success && (
            <div className="auth-message success">
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="auth-form">
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
              <label htmlFor="name" className="form-label">
                {currentText.name}
              </label>
              <div className="input-icon">👤</div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Your full name"
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
                minLength={8}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                {currentText.confirmPassword}
              </label>
              <div className="input-icon">🔒</div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
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
              {loading ? '' : currentText.signupButton}
            </button>
          </form>

          <div className="auth-links">
            <div className="auth-footer-text">
              {currentText.haveAccount}{' '}
              <Link href="/login" className="auth-link">
                {currentText.login}
              </Link>
            </div>
          </div>
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
    const seoData = await getPageSEO('signup');
    
    return {
      props: {
        authContent,
        seoData
      }
    };
  } catch (error) {
    console.error('Error fetching signup page data:', error);
    return {
      props: {
        authContent: { signup: {}, messages: {} },
        seoData: { title: 'Sign Up - Tamil Language Society', description: 'Create your account' }
      }
    };
  }
};

export default Signup;