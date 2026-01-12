"use client";
import React, { useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';
import '../styles/components/Newsletter.css';

interface NewsletterProps {
  page: string;
  slug?: string;
  data?: any;
}

export default function Newsletter({ page, slug = 'newsletter', data }: NewsletterProps) {
  const { lang } = useLanguage();
  const [content, setContent] = React.useState<any>(data || null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (data) return;
    async function fetchContent() {
      try {
        const pageContent = await getPageContent(page, 'newsletter', slug);
        setContent(pageContent[slug] || pageContent[`newsletter-0`]);
      } catch (error) {
        console.error('Error fetching newsletter content:', error);
      }
    }
    fetchContent();
  }, [page, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!content) return null;

  const title = content.title?.[lang] || content.title?.en || '';
  const description = content.description?.[lang] || content.description?.en || '';
  const placeholder = content.placeholder?.[lang] || content.placeholder?.en || 'Enter your email address';
  const buttonText = content.buttonText?.[lang] || content.buttonText?.en || 'Subscribe';
  const backgroundImage = content.backgroundImage || '';
  const backgroundColor = content.backgroundColor || '#2563eb';
  const textColor = content.textColor || '#ffffff';
  const style = content.style || 'default';

  const getStyleClasses = (style: string) => {
    switch (style) {
      case 'minimal':
        return {
          section: 'py-12 px-4',
          container: 'max-w-2xl mx-auto text-center',
          form: 'max-w-sm mx-auto'
        };
      case 'card':
        return {
          section: 'py-16 px-4',
          container: 'max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 text-center',
          form: 'max-w-full mx-auto'
        };
      case 'inline':
        return {
          section: 'py-8 px-4',
          container: 'max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6',
          form: 'flex-shrink-0'
        };
      default: // default
        return {
          section: 'py-16 px-4',
          container: 'max-w-4xl mx-auto text-center',
          form: 'max-w-md mx-auto'
        };
    }
  };

  const styleClasses = getStyleClasses(style);
  const isCard = style === 'card';
  const isInline = style === 'inline';

  return (
    <section 
      className={`newsletter-section ${styleClasses.section} relative overflow-hidden`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundColor: backgroundImage ? 'transparent' : (isCard ? '#f9fafb' : backgroundColor),
        color: isCard ? '#1f2937' : textColor
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0" />
      )}
      
      <div className={`newsletter-container ${styleClasses.container} relative z-10`}>
        <div className={isInline ? 'flex-1' : ''}>
          {title && (
            <h2 className={`newsletter-title text-3xl md:text-4xl font-bold mb-4 ${
              isCard ? 'text-gray-900' : backgroundImage ? 'text-white' : ''
            }`}>
              {title}
            </h2>
          )}
          {description && (
            <p className={`newsletter-description text-lg mb-8 max-w-2xl ${
              isInline ? 'mx-0' : 'mx-auto'
            } ${
              isCard ? 'text-gray-600' : backgroundImage ? 'text-gray-200' : 'opacity-90'
            }`}>
              {description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`newsletter-form ${styleClasses.form}`}>
          <div className={`form-group flex gap-4 ${isInline ? 'flex-row' : 'flex-col sm:flex-row'}`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="newsletter-input flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`newsletter-button font-semibold py-3 px-6 rounded-lg transition-colors duration-300 ${
                isCard 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                  : 'bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-300'
              }`}
            >
              {isSubmitting ? 'Subscribing...' : buttonText}
            </button>
          </div>

          {submitStatus === 'success' && (
            <div className="success-message mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Thank you for subscribing to our newsletter!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="error-message mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              Sorry, there was an error subscribing. Please try again.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}