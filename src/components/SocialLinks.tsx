"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import { IconRenderer } from './ui/IconRenderer';
import '../styles/components/SocialLinks.css';

type Bilingual = { en: string; ta: string };
type SocialLinksContent = {
  title?: Bilingual;
  subtitle?: Bilingual;
  links: { label: Bilingual; url: string; icon?: string }[];
};

type ComponentRecord = { type: string; content: SocialLinksContent };

export default function SocialLinks({ page = 'contacts', data: propData }: { page?: string; data?: any }) {
  const [data, setData] = useState<SocialLinksContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { lang: language } = useLanguage();

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as SocialLinksContent);
      setLoading(false);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(`/api/components/page?page=${encodeURIComponent(page)}`);
        const list = Array.isArray(json.components) ? json.components : [];
        const record = list.find((c) => c.type === 'social-links');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load social links', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10 aurora-bg rounded-3xl mt-10">
        <div className="flex justify-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
        </div>
      </section>
    );
  }

  if (!data || !data.links || data.links.length === 0) return null;

  const getPlatformClass = (url: string) => {
    if (url.includes('facebook.com')) return 'hover:text-blue-500 hover:border-blue-500';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'hover:text-sky-400 hover:border-sky-400';
    if (url.includes('instagram.com')) return 'hover:text-pink-500 hover:border-pink-500';
    if (url.includes('linkedin.com')) return 'hover:text-blue-600 hover:border-blue-600';
    if (url.includes('youtube.com')) return 'hover:text-red-500 hover:border-red-500';
    if (url.includes('github.com')) return 'hover:text-gray-200 hover:border-gray-200';
    if (url.includes('telegram.org') || url.includes('t.me')) return 'hover:text-sky-500 hover:border-sky-500';
    if (url.includes('whatsapp.com') || url.includes('wa.me')) return 'hover:text-green-500 hover:border-green-500';
    if (url.includes('discord.com')) return 'hover:text-indigo-500 hover:border-indigo-500';
    if (url.includes('tiktok.com')) return 'hover:text-pink-400 hover:border-pink-400';
    return 'hover:text-primary hover:border-primary';
  };

  const getDefaultIcon = (url: string) => {
    if (url.includes('facebook.com')) return 'fab fa-facebook-f';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'fab fa-twitter';
    if (url.includes('instagram.com')) return 'fab fa-instagram';
    if (url.includes('linkedin.com')) return 'fab fa-linkedin-in';
    if (url.includes('youtube.com')) return 'fab fa-youtube';
    if (url.includes('github.com')) return 'fab fa-github';
    if (url.includes('telegram.org') || url.includes('t.me')) return 'fab fa-telegram-plane';
    if (url.includes('whatsapp.com') || url.includes('wa.me')) return 'fab fa-whatsapp';
    if (url.includes('discord.com')) return 'fab fa-discord';
    if (url.includes('tiktok.com')) return 'fab fa-tiktok';
    return 'fas fa-link';
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 aurora-bg rounded-3xl my-10 border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm z-0"></div>
      <div className="relative z-10 text-center">
        {data.title ? (
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4 drop-shadow-lg">
            {language === 'ta' ? (data.title?.ta || '') : (data.title?.en || '')}
          </h2>
        ) : null}
        {data.subtitle ? (
          <p className="text-gray-300 mb-10 max-w-2xl mx-auto">{language === 'ta' ? (data.subtitle?.ta || '') : (data.subtitle?.en || '')}</p>
        ) : null}
        
        <div className="flex flex-wrap justify-center gap-6">
          {data.links.map((l, i) => (
            <a 
              key={i} 
              href={l.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`group flex flex-col items-center justify-center gap-3 min-w-[100px] p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-white/10 ${getPlatformClass(l.url)}`}
              aria-label={language === 'ta' ? (l.label?.ta || '') : (l.label?.en || '')}
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/10 shadow-lg">
                <IconRenderer iconName={l.icon || getDefaultIcon(l.url)} />
              </div>
              {l.label && (
                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                  {language === 'ta' ? (l.label?.ta || '') : (l.label?.en || '')}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}