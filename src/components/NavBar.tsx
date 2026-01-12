"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import { useTheme } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import '../styles/components/NavBar.css';

type Lang = "en" | "ta";
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

export default function NavBar({ page = 'home', data: initialData }: { page?: string, data?: any }) {
  // Context hooks with error handling
  let lang: Lang = 'en';
  let setLang = (newLang: Lang) => {};
  let isDark = false;
  let toggleTheme = () => {};
  let user = null;
  let logout = () => {};

  try {
    const languageContext = useLanguage();
    lang = languageContext.lang;
    setLang = languageContext.setLang;
  } catch (error) {
    console.log('Language context not available, using defaults:', error instanceof Error ? error.message : String(error));
  }

  try {
    const themeContext = useTheme();
    isDark = themeContext.isDark;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    console.log('Theme context not available, using defaults:', error instanceof Error ? error.message : String(error));
  }

  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.log('Auth context not available, using defaults:', error instanceof Error ? error.message : String(error));
  }

  const [data, setData] = useState<NavbarContent | null>(initialData || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(!!initialData);

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

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unread=1');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.items) {
          setUnreadCount(data.items.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  };

  // Load navbar data on mount
  useEffect(() => {
    if (hasInitialized) {
      return;
    }
    
    setHasInitialized(true);
    
    async function load() {
      try {
        setLoading(true);
        
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
          const url = buildUrl(p);
          try {
            const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
            const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
            const navbar = list.find((c) => c.type === 'navbar') || null;
            return navbar;
          } catch (error) {
            console.error('NavBar: Error fetching data:', error);
            return null;
          }
        }

        const navbar = await fetchFor(currentPage);
        if (navbar?.content) {
          setData(navbar.content);
        }
      } catch (e) {
        console.error('Failed to load navbar', e);
      } finally {
        setLoading(false);
      }
    }
    
    // Load navbar data
    load();
    
    // Fetch unread count initially
    fetchUnreadCount();
    
    // Set up interval to refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [hasInitialized]); // Add hasInitialized to dependency array

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="w-32 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            
            {/* Menu items skeleton */}
            <div className="hidden md:flex items-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
            
            {/* Right side skeleton */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  console.log('NavBar: Rendering with data:', data);

  // Use data from database, no hardcoded fallbacks
  if (!data) {
    console.log('NavBar: No data available, rendering empty navbar');
    return (
      <nav className={["navbar","hover-lift", isDark ? 'dark-local' : ''].filter(Boolean).join(' ')} id="navbar">
        <div className="nav-container">
          <div className="nav-logo hover-glow animate-text-glow">
            <span className="logo-text">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  const navClass = ['navbar', 'hover-lift', isDark ? 'dark-local' : ''].filter(Boolean).join(' ');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

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
          {data.logo?.image ? (
            <Image
              src={resolveUploadUrl(data.logo.image.src)}
              alt={
                typeof data.logo.image.alt === 'string' 
                  ? data.logo.image.alt 
                  : data.logo.image.alt?.[lang] || data.logo.image.alt?.en || ''
              }
              width={data.logo.image.width || 40}
              height={data.logo.image.height || 40}
              className="logo-img animate-rotate-3d"
              unoptimized
            />
          ) : null}
          {data.logo?.text ? (
            <span className="logo-text" data-key="global.logo.text">
              {data.logo.text?.[lang] || data.logo.text?.en || ''}
            </span>
          ) : null}
        </div>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`} id="nav-menu">
          {data.menu?.map((m, idx) => {
            // Skip auth links if user is authenticated
            if (user && (m.href === '/login' || m.href === '/signup' || m.href === '/sign' || m.href === '/auth/login' || m.href === '/auth/signup')) {
              return null;
            }
            
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
                    {unreadCount > 0 && (
                      <span className="notification-badge animate-glow-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                ) : (
                  content
                )}
              </Link>
            );
          })}

          {/* Show user info and logout when authenticated */}
          {user && (
            <>
              <div className="nav-user-info hover-glow">
                <span className="user-name">
                  {typeof user.name === 'string' ? user.name : user.name?.[lang] || user.name?.en || 'User'}
                </span>
              </div>
              <button 
                onClick={logout} 
                className="nav-link btn-glass hover-tilt"
                title="Logout"
              >
                {lang === 'en' ? 'Logout' : 'வெளியேறு'}
              </button>
            </>
          )}

          {data.languageToggle?.enabled ? (
            <div className="language-toggle card-morphism hover-lift" id="language-toggle">
              {data.languageToggle.languages.includes('en') && (
                <button
                  className={`lang-btn ${lang === 'en' ? 'active' : ''} btn-neon`}
                  data-lang="en"
                  title="English"
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
              )}
              {data.languageToggle.languages.includes('ta') && (
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

        {data.hamburger ? (
          <div className="hamburger" id="hamburger" onClick={() => setMenuOpen((o) => !o)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        ) : null}

        {data.themeToggle ? (
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