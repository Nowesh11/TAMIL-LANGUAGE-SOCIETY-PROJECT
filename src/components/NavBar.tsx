"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };

type MenuItem = {
  label: Bilingual;
  href: string;
  active?: boolean;
  variant?: 'link' | 'glass' | 'neon';
  dataKey?: string;
  testId?: string;
  isNotification?: boolean;
};

type NavbarContent = {
  themeToggle?: boolean;
  logo?: {
    image?: { src: string; alt: Bilingual; width?: number; height?: number };
    text?: Bilingual;
  };
  menu: MenuItem[];
  languageToggle?: { enabled: boolean; languages: ('en' | 'ta')[]; defaultLang?: 'en' | 'ta' };
  hamburger?: boolean;
};

type ComponentRecord = {
  _id: string;
  type: string;
  page: string;
  content: NavbarContent;
};

export default function NavBar({ page = 'home' }: { page?: string }) {
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<NavbarContent | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  function resolveUploadUrl(src: string) {
    try {
      const s = src || '';
      if (s.startsWith('/api/')) return s;
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(s, base);
      const path = url.pathname.replace(/^[/]+/, '');
      if (path.toLowerCase().startsWith('uploads/')) {
        return `/api/uploads/image?p=${encodeURIComponent(path)}`;
      }
      return s;
    } catch {
      const p = (src || '').replace(/^https?:\/\/[^/]+/, '').replace(/^[/]+/, '');
      if (p.toLowerCase().startsWith('uploads/')) {
        return `/api/uploads/image?p=${encodeURIComponent(p)}`;
      }
      return src;
    }
  }

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' && localStorage.getItem('theme');
    if (storedTheme) {
      const dark = storedTheme === 'dark';
      setIsDark(dark);
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        dark ? root.classList.add('dark') : root.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Always fetch global navbar from 'home' page to use single DB entry across site
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
          const json = await safeFetchJson<{ components?: ComponentRecord[] }>(buildUrl(p));
          const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
          return list.find((c) => c.type === 'navbar') || null;
        }

        const navbar = await fetchFor(currentPage);
        if (navbar?.content) setData(navbar.content);
      } catch (e) {
        console.error('Failed to load navbar', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      const root = document.documentElement;
      isDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((d) => !d);

  if (loading) {
    return (
      <nav className={["navbar","hover-lift", isDark ? 'dark-local' : ''].filter(Boolean).join(' ')} id="navbar">
        <div className="nav-container">
          <div className="nav-logo hover-glow animate-text-glow">
            <div className="logo-img shimmer" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <span className="logo-text shimmer" style={{ display: 'inline-block', width: 180, height: 18 }} />
          </div>
          <div className="nav-menu" id="nav-menu">
            <span className="nav-link shimmer" style={{ width: 80, height: 16 }} />
            <span className="nav-link shimmer" style={{ width: 80, height: 16 }} />
            <span className="nav-link shimmer" style={{ width: 80, height: 16 }} />
          </div>
        </div>
      </nav>
    );
  }

  const content = data;
  if (!content) return null;

  const navClass = ['navbar', 'hover-lift', isDark ? 'dark-local' : ''].filter(Boolean).join(' ');
  const pathname = router?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const isActive = (href: string) => {
    try {
      const target = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000').pathname;
      if (pathname === target) return true;
      // Consider base path matching for nested routes (e.g., /projects/[id])
      if (target !== '/' && pathname.startsWith(target)) return true;
      return false;
    } catch {
      // Fallback: simple startsWith check
      if (href === '/') return pathname === '/';
      return pathname === href || (href !== '/' && pathname.startsWith(href));
    }
  };
  return (
    <nav className={navClass} id="navbar">
      <div className="nav-container">
        <div className="nav-logo hover-glow animate-text-glow">
          {content.logo?.image ? (
            <Image
              src={resolveUploadUrl(content.logo.image.src)}
              alt={content.logo.image.alt[lang]}
              width={content.logo.image.width || 40}
              height={content.logo.image.height || 40}
              className="logo-img animate-rotate-3d"
              unoptimized
            />
          ) : null}
          {content.logo?.text ? (
            <span className="logo-text" data-key="global.logo.text">
              {content.logo.text[lang]}
            </span>
          ) : null}
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`} id="nav-menu">
          {content.menu?.map((m, idx) => {
            const className = [
              'nav-link',
              isActive(m.href) ? 'active' : '',
              'hover-tilt',
              m.variant === 'glass' ? 'btn-glass' : '',
              m.variant === 'neon' ? 'btn-neon hover-glow' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const content = m.label[lang];
            return (
              <Link href={m.href} key={idx} className={className} data-key={m.dataKey} data-testid={m.testId}>
                {m.isNotification ? (
                  <span className="notification-icon hover-glow animate-pulse-3d">
                    <i className="fa-solid fa-bell fa-fw" />
                    <span className="notification-dot animate-glow-pulse" id="notification-dot" />
                  </span>
                ) : (
                  content
                )}
              </Link>
            );
          })}

          {content.languageToggle?.enabled ? (
            <div className="language-toggle card-morphism hover-lift" id="language-toggle">
              {content.languageToggle.languages.includes('en') && (
                <button
                  className={`lang-btn ${lang === 'en' ? 'active' : ''} btn-neon`}
                  data-lang="en"
                  title="English"
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
              )}
              {content.languageToggle.languages.includes('ta') && (
                <button
                  className={`lang-btn ${lang === 'ta' ? 'active' : ''} btn-glass`}
                  data-lang="ta"
                  title="Tamil"
                  onClick={() => setLang('ta')}
                >
                  TA
                </button>
              )}
            </div>
          ) : null}
        </div>

        {content.hamburger ? (
          <div className="hamburger" id="hamburger" onClick={() => setMenuOpen((o) => !o)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        ) : null}

        {content.themeToggle ? (
          <div className="theme-toggle card-morphism hover-lift">
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              aria-label="Toggle between light and dark theme"
              className="btn-neon hover-glow animate-rotate-3d"
            >
              <i id="theme-icon" className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} animate-glow-pulse`}></i>
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}