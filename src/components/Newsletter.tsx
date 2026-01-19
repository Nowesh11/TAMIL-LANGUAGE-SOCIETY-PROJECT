"use client";
import React, { useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';

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
  const backgroundColor = content.backgroundColor || ''; // Removed default color to prefer Tailwind classes
  const textColor = content.textColor || '';
  const style = content.style || 'default';

  // Tailwind style mapping
  const getStyleClasses = (style: string) => {
    switch (style) {
      case 'minimal':
        return {
          section: 'py-16 bg-transparent',
          container: 'max-w-3xl mx-auto text-center px-4',
          form: 'max-w-md mx-auto mt-8'
        };
      case 'card':
        return {
          section: 'py-20 px-4',
          container: 'max-w-4xl mx-auto card-morphism p-10 text-center rounded-3xl border border-white/10 shadow-2xl',
          form: 'max-w-lg mx-auto mt-8'
        };
      case 'inline':
        return {
          section: 'py-12 bg-white/5 border-y border-white/10 backdrop-blur-sm',
          container: 'max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8',
          form: 'flex-shrink-0 w-full md:w-auto md:min-w-[400px]'
        };
      default: // default
        return {
          section: 'py-24 relative overflow-hidden aurora-bg',
          container: 'max-w-4xl mx-auto text-center px-4 relative z-10',
          form: 'max-w-lg mx-auto mt-10'
        };
    }
  };

  const styleClasses = getStyleClasses(style);
  const isDefault = style === 'default' || !style;
  const isCard = style === 'card';

  return (
    <section 
      className={`${styleClasses.section}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Overlay for background images */}
      {(backgroundImage) && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />
      )}
      
      <div className={styleClasses.container}>
        <div className={style === 'inline' ? 'flex-1 text-left' : ''}>
          {title && (
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg`}>
              {title}
            </h2>
          )}
          {description && (
            <p className={`text-lg leading-relaxed text-gray-300 drop-shadow-md`}>
              {description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styleClasses.form}>
          <div className={`flex flex-col sm:flex-row gap-3 ${style === 'inline' ? 'w-full' : ''}`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className={`flex-1 px-5 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner`}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>...</span>
                </span>
              ) : buttonText}
            </button>
          </div>

          {submitStatus === 'success' && (
            <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30 animate-fade-in">
              Thank you for subscribing to our newsletter!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30 animate-fade-in">
              Sorry, there was an error subscribing. Please try again.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
