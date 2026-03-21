"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';
import { IconRenderer } from './ui/IconRenderer';

type Bilingual = { en: string; ta: string };

type FooterContent = {
  logo?: { image?: { src: string; alt: Bilingual }; text?: Bilingual };
  description?: Bilingual;
  socialLinks?: { facebookUrl?: string; twitterUrl?: string; instagramUrl?: string; youtubeUrl?: string };
  quickLinks?: { aboutLink?: { text: Bilingual; url: string }; projectsLink?: { text: Bilingual; url: string }; ebooksLink?: { text: Bilingual; url: string }; bookstoreLink?: { text: Bilingual; url: string } };
  supportLinks?: { contactLink?: { text: Bilingual; url: string }; notificationsLink?: { text: Bilingual; url: string } };
  newsletter?: { title?: Bilingual; description?: Bilingual; emailPlaceholder?: Bilingual; buttonIcon?: string };
  copyright?: Bilingual;
  quickLinksTitle?: Bilingual;
  supportTitle?: Bilingual;
};

type ComponentRecord = { _id: string; type: string; page: string; content: FooterContent };

function resolveUploadUrl(src: string) {
  try {
    const s = src || '';
    const pos = s.toLowerCase().lastIndexOf('uploads');
    if (pos >= 0) {
      const rest = s.slice(pos).replace(/^[\\/]+/, '').replace(/\\/g, '/');
      return `/api/files/serve?path=${encodeURIComponent(rest)}`;
    }
    if (s.startsWith('/api/')) return s;
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(s, base);
    const path = url.pathname.replace(/^[/]+/, '');
    if (path.toLowerCase().startsWith('uploads/')) {
      return `/api/uploads/image?p=${encodeURIComponent(path)}`;
    }
    return s;
  } catch {
    const raw = src || '';
    const pos = raw.toLowerCase().lastIndexOf('uploads');
    if (pos >= 0) {
      const rest = raw.slice(pos).replace(/^[\\/]+/, '').replace(/\\/g, '/');
      return `/api/files/serve?path=${encodeURIComponent(rest)}`;
    }
    const p = raw.replace(/^https?:\/\/[^/]+/, '').replace(/^[/]+/, '');
    if (p.toLowerCase().startsWith('uploads/')) {
      return `/api/uploads/image?p=${encodeURIComponent(p)}`;
    }
    return raw;
  }
}

export default function Footer({ page = 'home', data: initialData }: { page?: string, data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FooterContent | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [overrideLogoUrl, setOverrideLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    async function load() {
      try {
        // Always fetch global footer from 'home' page to use single DB entry across site
        const currentPage = 'home';

        function buildUrl(p: string) {
          try {
            const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
            if (origin) {
              const url = new URL('/api/components/page', origin);
              url.searchParams.set('page', p);
              return url.toString();
            }
          } catch {}
          const qs = new URLSearchParams({ page: p });
          return `/api/components/page?${qs.toString()}`;
        }

        async function fetchFor(p: string) {
          const json = await safeFetchJson<{ success?: boolean; components?: ComponentRecord[] }>(buildUrl(p));
          const list = Array.isArray(json?.components) ? (json.components as ComponentRecord[]) : [];
          const candidates = list.filter((c) => c.type === 'footer');
          const withBureau = (candidates as any[]).find((c) => !!c.bureau);
          return (withBureau || candidates[0] || null) as any;
        }

        const footer = await fetchFor(currentPage);
        if (footer?.content) setData(footer.content);
      } catch (e) {
        console.error('Failed to load footer', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function resolveLatestFooterLogo() {
      try {
        const current = data?.logo?.image?.src || '';
        const isDefault = current === '/globe.svg' || !current;
        if (isDefault) {
          const res = await fetch('/api/components/files?type=footer', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const first = json.files?.[0]?.url;
            if (first) setOverrideLogoUrl(first);
          }
        }
      } catch {}
    }
    resolveLatestFooterLogo();
  }, [data]);

  if (loading) {
    return (
      <footer className="bg-surface border-t border-border pt-16 pb-8">
        <div className="layout-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  const content = data;
  if (!content) return null;

  return (
    <footer className="bg-surface border-t border-border pt-24 pb-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="layout-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              {content.logo?.image ? (
                <div className="relative w-14 h-14 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border">
                  <Image 
                    src={overrideLogoUrl || resolveUploadUrl(content.logo.image.src)} 
                    alt={content.logo.image.alt?.[lang] || content.logo.image.alt?.en || ''}
                    fill
                    className="object-contain p-2" 
                    unoptimized 
                  />
                </div>
              ) : null}
              {content.logo?.text ? (
                <div className="flex flex-col">
                  <span className="text-2xl font-black gradient-title tracking-tighter">
                    {content.logo.text?.[lang] || content.logo.text?.en || ''}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground-muted">
                    Preserving Culture
                  </span>
                </div>
              ) : null}
            </div>
            
            {content.description ? (
              <p className="text-foreground-secondary leading-relaxed font-medium text-sm">
                {content.description?.[lang] || content.description?.en || ''}
              </p>
            ) : null}
            
            <div className="flex gap-3">
              {[
                { url: content.socialLinks?.facebookUrl, icon: 'fa-facebook', color: '#1877F2' },
                { url: content.socialLinks?.twitterUrl, icon: 'fa-twitter', iconClass: 'fa-x-twitter', color: '#000000' },
                { url: content.socialLinks?.instagramUrl, icon: 'fa-instagram', color: '#E4405F' },
                { url: content.socialLinks?.youtubeUrl, icon: 'fa-youtube', color: '#FF0000' }
              ].map((social, i) => social.url && (
                <Link 
                  key={i}
                  href={social.url} 
                  className="w-11 h-11 rounded-xl bg-surface border border-border flex items-center justify-center text-foreground-secondary hover:text-white transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-xl group relative overflow-hidden"
                  aria-label={social.icon}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: social.color }}></div>
                  <i className={`fa-brands ${social.iconClass || social.icon} fa-fw relative z-10 text-lg`}></i>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:pl-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-foreground flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary rounded-full"></span>
              {content.quickLinksTitle ? (content.quickLinksTitle?.[lang] || content.quickLinksTitle?.en || '') : 'Explore'}
            </h3>
            <ul className="space-y-4">
              {[
                content.quickLinks?.aboutLink,
                content.quickLinks?.projectsLink,
                content.quickLinks?.ebooksLink,
                content.quickLinks?.bookstoreLink
              ].map((link, i) => link && (
                <li key={i}>
                  <Link href={link.url} className="text-foreground-secondary hover:text-primary transition-all font-bold text-sm inline-flex items-center group">
                    <span className="w-0 group-hover:w-4 h-[2px] bg-primary mr-0 group-hover:mr-3 transition-all duration-300 rounded-full"></span>
                    {link.text?.[lang] || link.text?.en || ''}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:pl-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-foreground flex items-center gap-2">
              <span className="w-8 h-[2px] bg-secondary rounded-full"></span>
              {content.supportTitle ? (content.supportTitle?.[lang] || content.supportTitle?.en || '') : 'Support'}
            </h3>
            <ul className="space-y-4">
              {[
                content.supportLinks?.contactLink,
                content.supportLinks?.notificationsLink
              ].map((link, i) => link && (
                <li key={i}>
                  <Link href={link.url} className="text-foreground-secondary hover:text-secondary transition-all font-bold text-sm inline-flex items-center group">
                    <span className="w-0 group-hover:w-4 h-[2px] bg-secondary mr-0 group-hover:mr-3 transition-all duration-300 rounded-full"></span>
                    {link.text?.[lang] || link.text?.en || ''}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-surface dark:bg-slate-900/50 p-8 rounded-[2rem] border border-border shadow-sm group-hover:shadow-xl transition-all duration-500">
              <h3 className="text-lg font-black mb-2 text-foreground">
                {content.newsletter?.title ? (content.newsletter.title?.[lang] || content.newsletter.title?.en || 'Newsletter') : 'Newsletter'}
              </h3>
              <p className="text-xs text-foreground-muted mb-6 font-medium leading-relaxed">
                {content.newsletter?.description ? (content.newsletter.description?.[lang] || content.newsletter.description?.en || '') : 'Stay updated with our latest news and events.'}
              </p>
              <div className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder={content.newsletter?.emailPlaceholder ? (content.newsletter.emailPlaceholder?.[lang] || content.newsletter.emailPlaceholder?.en || 'Enter your email') : 'Enter your email'} 
                  className="w-full bg-background border border-border rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  aria-label="Email" 
                />
                <button className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl px-5 py-3 font-bold text-sm transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn">
                  <span>Subscribe</span>
                  <IconRenderer iconName={content.newsletter?.buttonIcon || 'fa-solid fa-paper-plane'} className="fa-fw group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-xs font-bold text-foreground-muted text-center md:text-left">
              {content.copyright ? (typeof content.copyright === 'string' ? content.copyright : (content.copyright?.[lang] || content.copyright?.en || '')) : ''}
            </p>
            <div className="text-[10px] font-black uppercase tracking-widest text-foreground-muted/60">
              Preserving Tamil Language & Culture Since 19XX
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground-muted">
               Made with <i className="fa-solid fa-heart text-red-500 animate-pulse"></i> by 
               <span className="text-primary hover:text-secondary cursor-pointer transition-colors">Nowesh Kumar</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
