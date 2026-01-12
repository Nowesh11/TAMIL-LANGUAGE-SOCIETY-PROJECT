"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';
import '../styles/components/FAQ.css';

type Bilingual = { en: string; ta: string };
type FAQItem = { question: Bilingual; answer: Bilingual; category?: string };
type FAQContent = { title?: Bilingual; faqs: FAQItem[]; searchable?: boolean; categories?: string[] };
type ComponentRecord = { type: string; content: FAQContent };

export default function FAQ({ page = 'contacts', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FAQContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as FAQContent);
      setLoading(false);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const url = `/api/components/page?page=${encodeURIComponent(page)}`;
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? json.components : [];
        const record = list.find((c) => c.type === 'faq');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load FAQ', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const filteredFAQs = data?.faqs.filter(faq => {
    if (!searchTerm) return true;
    const question = faq.question?.[lang] || faq.question?.en || '';
    const answer = faq.answer?.[lang] || faq.answer?.en || '';
    return question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           answer.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="faq-item-skeleton">
                <div className="faq-skeleton-question"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          {data.title && (
            <h2 className="faq-title">
              {data.title?.[lang] || data.title?.en || 'Frequently Asked Questions'}
            </h2>
          )}
          <p className="faq-subtitle">
            Find answers to common questions about our services and platform.
          </p>
        </div>

        {data.searchable && (
          <div className="faq-search">
            <div className="faq-search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search questions..."
              className="faq-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {filteredFAQs.length === 0 ? (
          <div className="faq-no-results">
            <div className="faq-no-results-icon">❓</div>
            <div className="faq-no-results-text">
              No questions found matching your search.
            </div>
          </div>
        ) : (
          <div className="faq-list">
            {filteredFAQs.map((f, idx) => (
              <div 
                key={idx} 
                className={`faq-item ${activeIndex === idx ? 'active' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(idx)}
                  aria-expanded={activeIndex === idx}
                >
                  <span className="faq-question-text">
                    {f.question?.[lang] || f.question?.en || ''}
                  </span>
                  <span className="faq-icon">
                    {activeIndex === idx ? '−' : '+'}
                  </span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    <p>{f.answer?.[lang] || f.answer?.en || ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}