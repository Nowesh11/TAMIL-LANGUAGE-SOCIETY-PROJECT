"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

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
      <section className="py-20 relative overflow-hidden aurora-bg">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card-morphism p-6 animate-pulse rounded-2xl border border-white/10">
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          {data.title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg inline-block">
              {data.title?.[lang] || data.title?.en || 'Frequently Asked Questions'}
            </h2>
          )}
          <p className="text-lg text-gray-300 max-w-2xl mx-auto drop-shadow-md">
            Find answers to common questions about our services and platform.
          </p>
        </div>

        {data.searchable && (
          <div className="mb-8 relative max-w-2xl mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-lg backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 card-morphism rounded-2xl border border-white/10">
            <div className="text-4xl mb-4">❓</div>
            <div className="text-lg font-medium">
              No questions found matching your search.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((f, idx) => (
              <div 
                key={idx} 
                className={`card-morphism overflow-hidden transition-all duration-300 rounded-2xl border border-white/10 ${activeIndex === idx ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' : 'hover:shadow-lg hover:border-white/20'}`}
              >
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                  onClick={() => toggleFAQ(idx)}
                  aria-expanded={activeIndex === idx}
                >
                  <span className={`font-semibold text-lg transition-colors pr-4 ${activeIndex === idx ? 'text-primary' : 'text-white group-hover:text-primary'}`}>
                    {f.question?.[lang] || f.question?.en || ''}
                  </span>
                  <span className={`text-primary transform transition-transform duration-300 flex-shrink-0 ${activeIndex === idx ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${activeIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-6 pt-0 text-gray-300 leading-relaxed border-t border-white/5 mt-2">
                    <p className="pt-4">{f.answer?.[lang] || f.answer?.en || ''}</p>
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
