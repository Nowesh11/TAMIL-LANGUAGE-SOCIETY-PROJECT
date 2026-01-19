"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import { useTheme } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { safeFetchJson } from '../lib/safeFetch';

type Lang = "en" | "ta";
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
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (hasInitialized) return;
    setHasInitialized(true);
    
    async function load() {
      try {
        setLoading(true);
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
          try {
            const json = await safeFetchJson<{ components?: ComponentRecord[] }>(buildUrl(p));
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
    
    load();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [hasInitialized]);

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 h-20">
        <div className="layout-container h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
            <div className="w-32 h-6 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-4 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  if (!data) return null;

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  // Do not render NavBar on admin routes
  if (pathname.startsWith('/admin')) return null;

  const isActive = (href: string) => {
    try {
      const target = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000').pathname;
      if (pathname === target) return true;
      if (target !== '/' && pathname.startsWith(target)) return true;
      return false;
    } catch {
      if (href === '/') return pathname === '/';
      return pathname === href || (href !== '/' && pathname.startsWith(href));
    }
  };

  return (
    <div className={`sticky top-0 z-50 w-full transition-all duration-300 flex flex-col ${
      scrolled 
        ? 'card-morphism !rounded-none !border-x-0 !border-t-0 shadow-md' 
        : 'bg-transparent'
    }`}>
      {/* Main Navbar */}
      <div className={`w-full ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className="layout-container flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {data.logo?.image ? (
              <div className="relative w-10 h-10 transition-transform duration-300 group-hover:rotate-12">
                <Image
                  src={resolveUploadUrl(data.logo.image.src)}
                  alt={
                    typeof data.logo.image.alt === 'string' 
                      ? data.logo.image.alt 
                      : data.logo.image.alt?.[lang] || data.logo.image.alt?.en || ''
                  }
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : null}
            {data.logo?.text ? (
              <span className="text-xl font-bold gradient-title">
                {data.logo.text?.[lang] || data.logo.text?.en || ''}
              </span>
            ) : null}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {data.menu?.map((m, idx) => {
              if (user && (m.href === '/login' || m.href === '/signup' || m.href === '/sign' || m.href === '/auth/login' || m.href === '/auth/signup')) {
                return null;
              }
              
              const active = isActive(m.href);
              
              return (
                <Link 
                  href={m.href} 
                  key={idx} 
                  className={`relative text-sm font-medium transition-all duration-300 hover:text-primary ${
                    active ? 'text-primary font-bold' : 'text-foreground-secondary'
                  } ${m.variant === 'neon' ? 'btn-neon !text-white hover:!text-white' : ''}`}
                >
                  {m.isNotification ? (
                    <span className="relative">
                      <i className="fa-solid fa-bell text-lg" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse shadow-md shadow-red-500/30">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="relative group">
                      {m.label[lang]}
                      {active && m.variant !== 'neon' && (
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full animate-fade-in shadow-glow" />
                      )}
                      {!active && m.variant !== 'neon' && (
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 group-hover:w-full" />
                      )}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-4 border-l border-border pl-4">
                <span className="text-sm font-bold text-foreground">
                  {typeof user.name === 'string' ? user.name : user.name?.[lang] || user.name?.en || 'User'}
                </span>
                <button 
                  onClick={logout} 
                  className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  {lang === 'en' ? 'Logout' : 'வெளியேறு'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-foreground transition-all shadow-sm border border-border"
            >
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Utility Bar (Below Navbar) */}
      <div className={`w-full border-b border-white/5 backdrop-blur-sm transition-colors ${scrolled ? 'bg-black/60' : 'bg-black/30'}`}>
        <div className="layout-container py-1.5 flex justify-end items-center gap-3">
           <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 mr-2 flex items-center gap-1">
             <i className="fa-solid fa-sliders"></i> Settings
           </span>
           
           {data.languageToggle?.enabled && (
              <button
                onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === 'ta' 
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30 shadow-sm' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Switch Language"
              >
                <i className="fa-solid fa-language"></i>
                <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
              </button>
            )}

            {data.themeToggle && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                title="Toggle Theme"
              >
                <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'} ${isDark ? 'text-yellow-400' : 'text-cyan-400'}`}></i>
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
            )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 shadow-xl animate-slide-in-up z-40 m-0">
          <div className="p-4 space-y-2">
            {data.menu?.map((m, idx) => {
              if (user && (m.href === '/login' || m.href === '/signup' || m.href === '/sign' || m.href === '/auth/login' || m.href === '/auth/signup')) return null;
              
              return (
                <Link 
                  href={m.href} 
                  key={idx} 
                  className={`block px-4 py-3 rounded-xl transition-all ${
                    isActive(m.href) 
                      ? 'bg-primary/10 text-primary font-bold border border-primary/20' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {m.isNotification ? (
                    <span className="flex items-center gap-3">
                      <i className="fa-solid fa-bell" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md shadow-red-500/30">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    m.label[lang]
                  )}
                </Link>
              );
            })}
            
            {user && (
              <div className="pt-4 border-t border-white/10 mt-2">
                 <div className="px-4 py-2 text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                      {typeof user.name === 'string' ? user.name.charAt(0) : 'U'}
                    </div>
                    {typeof user.name === 'string' ? user.name : user.name?.[lang] || user.name?.en || 'User'}
                 </div>
                 <button 
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium flex items-center gap-2 mt-2"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  {lang === 'en' ? 'Logout' : 'வெளியேறு'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
