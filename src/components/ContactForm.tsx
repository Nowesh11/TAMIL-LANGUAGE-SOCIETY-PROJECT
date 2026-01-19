"use client";
import React, { useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';

interface ContactFormProps {
  page: string;
  slug?: string;
  data?: any;
}

export default function ContactForm({ page, slug = 'contact-form', data }: ContactFormProps) {
  const { lang } = useLanguage();
  const [content, setContent] = React.useState<any>(data || null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (data) return;
    async function fetchContent() {
      try {
        const pageContent = await getPageContent(page, 'contact-form', slug);
        setContent(pageContent[slug] || pageContent[`contact-form-0`]);
      } catch (error) {
        console.error('Error fetching contact form content:', error);
      }
    }
    fetchContent();
  }, [page, slug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Filter form data to only include enabled fields
      const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (fields[key as keyof typeof fields] && value.trim()) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!content) return null;

  const title = content.title?.[lang] || content.title?.en || '';
  const subtitle = content.subtitle?.[lang] || content.subtitle?.en || '';
  const submitText = content.submitText?.[lang] || content.submitText?.en || 'Send Message';
  const fields = content.fields || {
    name: true,
    email: true,
    phone: false,
    subject: true,
    message: true
  };

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg inline-block">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>

        <div className="card-morphism p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.name && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-300">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none"
                    placeholder="Your Name"
                  />
                </div>
              )}
              
              {fields.email && (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-gray-300">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              )}
            </div>

            {fields.phone && (
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-300">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}

            {fields.subject && (
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold text-gray-300">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none"
                  placeholder="How can we help?"
                />
              </div>
            )}

            {fields.message && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold text-gray-300">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none resize-y"
                  placeholder="Tell us about your project..."
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>{submitText}</span>
                    <i className="fa-solid fa-paper-plane"></i>
                  </>
                )}
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 mt-0.5">✓</div>
                <div>
                  <h3 className="font-bold text-green-400">Message Sent!</h3>
                  <p className="text-green-300 text-sm">Thank you for reaching out. We'll get back to you shortly.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 mt-0.5">!</div>
                <div>
                  <h3 className="font-bold text-red-400">Error</h3>
                  <p className="text-red-300 text-sm">Sorry, there was an error sending your message. Please try again.</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
