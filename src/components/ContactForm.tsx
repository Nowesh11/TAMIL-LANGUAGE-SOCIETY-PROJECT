"use client";
import React, { useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';
import '../styles/components/ContactForm.css';

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
    <section className="contact-form-component">
      <div className="contact-form-container">
        <div className="contact-form-header">
          {title && (
            <h2 className="contact-form-title">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="contact-form-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        <div className="contact-form-wrapper">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="contact-form-row two-columns">
              {fields.name && (
                <div className="contact-form-group">
                  <label htmlFor="name" className="contact-form-label required">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="contact-form-input"
                    placeholder="Your Name"
                  />
                </div>
              )}
              
              {fields.email && (
                <div className="contact-form-group">
                  <label htmlFor="email" className="contact-form-label required">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="contact-form-input"
                    placeholder="john@example.com"
                  />
                </div>
              )}
            </div>

            {fields.phone && (
              <div className="contact-form-group">
                <label htmlFor="phone" className="contact-form-label">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="contact-form-input"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}

            {fields.subject && (
              <div className="contact-form-group">
                <label htmlFor="subject" className="contact-form-label required">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="contact-form-input"
                  placeholder="How can we help?"
                />
              </div>
            )}

            {fields.message && (
              <div className="contact-form-group">
                <label htmlFor="message" className="contact-form-label required">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="contact-form-textarea"
                  placeholder="Tell us about your project..."
                />
              </div>
            )}

            <div className="contact-form-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="contact-form-button primary"
              >
                {isSubmitting ? (
                  <span className="contact-form-loading">
                    <div className="contact-form-loading-spinner"></div>
                    Sending...
                  </span>
                ) : submitText}
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="contact-form-success-message">
                <div className="contact-form-success-icon">✓</div>
                <h3 className="contact-form-success-title">Message Sent!</h3>
                <p className="contact-form-success-text">Thank you for reaching out. We'll get back to you shortly.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="contact-form-error">
                Sorry, there was an error sending your message. Please try again.
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}