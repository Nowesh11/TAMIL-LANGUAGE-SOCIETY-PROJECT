"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
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
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="social-links loading">
          <div className="social-link"></div>
          <div className="social-link"></div>
          <div className="social-link"></div>
          <div className="social-link"></div>
        </div>
      </section>
    );
  }

  if (!data || !data.links || data.links.length === 0) return null;

  const getPlatformClass = (url: string) => {
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('github.com')) return 'github';
    if (url.includes('telegram.org') || url.includes('t.me')) return 'telegram';
    if (url.includes('whatsapp.com') || url.includes('wa.me')) return 'whatsapp';
    if (url.includes('discord.com')) return 'discord';
    if (url.includes('tiktok.com')) return 'tiktok';
    return '';
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
    <section className="mx-auto max-w-5xl px-6 py-10">
      {data.title ? (
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
          {language === 'ta' ? (data.title?.ta || '') : (data.title?.en || '')}
        </h2>
      ) : null}
      {data.subtitle ? (
        <p className="text-slate-700 dark:text-slate-300 mb-4">{language === 'ta' ? (data.subtitle?.ta || '') : (data.subtitle?.en || '')}</p>
      ) : null}
      <div className="social-links centered">
        {data.links.map((l, i) => (
          <a 
            key={i} 
            href={l.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`social-link ${getPlatformClass(l.url)} ${l.label ? 'with-label' : ''}`}
            aria-label={language === 'ta' ? (l.label?.ta || '') : (l.label?.en || '')}
          >
            <i className={`social-link-icon ${l.icon || getDefaultIcon(l.url)}`} />
            {l.label && (
              <span className="social-link-label">
                {language === 'ta' ? (l.label?.ta || '') : (l.label?.en || '')}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}