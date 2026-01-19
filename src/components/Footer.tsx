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
    <footer className="bg-surface border-t border-border pt-20 pb-10 relative overflow-hidden">
      <div className="layout-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {content.logo?.image ? (
                <div className="relative w-12 h-12">
                  <Image 
                    src={overrideLogoUrl || resolveUploadUrl(content.logo.image.src)} 
                    alt={content.logo.image.alt?.[lang] || content.logo.image.alt?.en || ''} 
                    fill
                    className="object-contain" 
                    unoptimized 
                  />
                </div>
              ) : null}
              {content.logo?.text ? (
                <span className="text-xl font-bold gradient-title">
                  {content.logo.text?.[lang] || content.logo.text?.en || ''}
                </span>
              ) : null}
            </div>
            
            {content.description ? (
              <p className="text-foreground-secondary leading-relaxed">
                {content.description?.[lang] || content.description?.en || ''}
              </p>
            ) : null}
            
            <div className="flex gap-4">
              {content.socialLinks?.facebookUrl && (
                <Link href={content.socialLinks.facebookUrl} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground-secondary hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md" aria-label="Facebook">
                  <i className="fa-brands fa-facebook fa-fw"></i>
                </Link>
              )}
              {content.socialLinks?.twitterUrl && (
                <Link href={content.socialLinks.twitterUrl} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground-secondary hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md" aria-label="Twitter">
                  <i className="fa-brands fa-twitter fa-fw"></i>
                </Link>
              )}
              {content.socialLinks?.instagramUrl && (
                <Link href={content.socialLinks.instagramUrl} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground-secondary hover:bg-[#E4405F] hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md" aria-label="Instagram">
                  <i className="fa-brands fa-instagram fa-fw"></i>
                </Link>
              )}
              {content.socialLinks?.youtubeUrl && (
                <Link href={content.socialLinks.youtubeUrl} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground-secondary hover:bg-[#FF0000] hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md" aria-label="YouTube">
                  <i className="fa-brands fa-youtube fa-fw"></i>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-foreground">
              {content.quickLinksTitle ? (content.quickLinksTitle?.[lang] || content.quickLinksTitle?.en || '') : ''}
            </h3>
            <ul className="space-y-4">
              {content.quickLinks?.aboutLink && (
                <li>
                  <Link href={content.quickLinks.aboutLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.quickLinks.aboutLink.text?.[lang] || content.quickLinks.aboutLink.text?.en || ''}
                  </Link>
                </li>
              )}
              {content.quickLinks?.projectsLink && (
                <li>
                  <Link href={content.quickLinks.projectsLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.quickLinks.projectsLink.text?.[lang] || content.quickLinks.projectsLink.text?.en || ''}
                  </Link>
                </li>
              )}
              {content.quickLinks?.ebooksLink && (
                <li>
                  <Link href={content.quickLinks.ebooksLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.quickLinks.ebooksLink.text?.[lang] || content.quickLinks.ebooksLink.text?.en || ''}
                  </Link>
                </li>
              )}
              {content.quickLinks?.bookstoreLink && (
                <li>
                  <Link href={content.quickLinks.bookstoreLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.quickLinks.bookstoreLink.text?.[lang] || content.quickLinks.bookstoreLink.text?.en || ''}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-foreground">
              {content.supportTitle ? (content.supportTitle?.[lang] || content.supportTitle?.en || '') : ''}
            </h3>
            <ul className="space-y-4">
              {content.supportLinks?.contactLink && (
                <li>
                  <Link href={content.supportLinks.contactLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.supportLinks.contactLink.text?.[lang] || content.supportLinks.contactLink.text?.en || ''}
                  </Link>
                </li>
              )}
              {content.supportLinks?.notificationsLink && (
                <li>
                  <Link href={content.supportLinks.notificationsLink.url} className="text-foreground-secondary hover:text-primary transition-colors inline-flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors"></span>
                    {content.supportLinks.notificationsLink.text?.[lang] || content.supportLinks.notificationsLink.text?.en || ''}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-bold mb-2 text-foreground">
              {content.newsletter?.title ? (content.newsletter.title?.[lang] || content.newsletter.title?.en || 'Newsletter') : 'Newsletter'}
            </h3>
            <p className="text-sm text-foreground-secondary mb-4">
              {content.newsletter?.description ? (content.newsletter.description?.[lang] || content.newsletter.description?.en || '') : ''}
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={content.newsletter?.emailPlaceholder ? (content.newsletter.emailPlaceholder?.[lang] || content.newsletter.emailPlaceholder?.en || 'Enter your email') : 'Enter your email'} 
                className="flex-1 bg-white dark:bg-slate-900 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                aria-label="Email" 
              />
              <button className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 transition-colors duration-300" aria-label="Subscribe to newsletter">
                <IconRenderer iconName={content.newsletter?.buttonIcon || 'fa-solid fa-paper-plane'} className="fa-fw" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground-muted text-center md:text-left">
            {content.copyright ? (typeof content.copyright === 'string' ? content.copyright : (content.copyright?.[lang] || content.copyright?.en || '')) : ''}
          </p>
          <div className="text-xs text-foreground-muted">
            Made with <span className="text-red-500">♥</span> by Tamil Language Society
          </div>
        </div>
      </div>
    </footer>
  );
}
