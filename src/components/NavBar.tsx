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
  // Typography/colour from admin
  backgroundColor?: string;
  textColor?: string;
  fontColor?: string;
  hoverColor?: string;
  fontSize?: string;
  fontWeight?: string;
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
  const [overrideLogoUrl, setOverrideLogoUrl] = useState<string | null>(null);

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
            const candidates = list.filter((c) => c.type === 'navbar');
            // Prefer one that has an uploaded logo image path, else bureau-specific, else first
            const hasUploaded = (c: any) => {
              const src = c?.content?.logo?.image?.src || '';
              const s = String(src).toLowerCase();
              return s.includes('/api/files/serve') || s.includes('uploads/');
            };
            const byUploaded = candidates.find(hasUploaded);
            const withBureau = candidates.find((c: any) => !!c.bureau);
            const navbar = byUploaded || withBureau || candidates[0] || null;
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

  useEffect(() => {
    async function resolveLatestLogo() {
      try {
        const current = data?.logo?.image?.src || '';
        const isDefault = current === '/globe.svg' || !current;
        if (isDefault) {
          const res = await fetch('/api/components/files?type=navbar', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const first = json.files?.[0]?.url;
            if (first) setOverrideLogoUrl(first);
          }
        }
      } catch {}
    }
    resolveLatestLogo();
  }, [data]);

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

  const fallbackData: NavbarContent = {
    logo: { text: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' } },
    menu: [
      { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
      { label: { en: 'Books', ta: 'நூல்கள்' }, href: '/books' },
      { label: { en: 'Ebooks', ta: 'மின் நூல்கள்' }, href: '/ebooks' },
      { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
      { label: { en: 'Contacts', ta: 'தொடர்புகள்' }, href: '/contacts' },
    ],
    languageToggle: { enabled: true, languages: ['en', 'ta'], defaultLang: 'en' },
    themeToggle: true,
    hamburger: true,
  };
  const navData = data || fallbackData;
  const displayTitle = (
    (navData.logo?.text?.[lang]) ||
    (navData.logo?.text?.en) ||
    (typeof navData.logo?.image?.alt === 'string' ? navData.logo?.image?.alt : (navData.logo?.image?.alt?.[lang] || navData.logo?.image?.alt?.en)) ||
    'Tamil Language Society'
  );

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

  // ── Typography / colour settings from admin ──
  const navStyle: React.CSSProperties = {};
  const navTextStyle: React.CSSProperties = {};
  const navColour = (navData as any)?.fontColor || (navData as any)?.textColor;
  if ((navData as any)?.backgroundColor) navStyle.backgroundColor = (navData as any).backgroundColor;
  if ((navData as any)?.fontSize) { navStyle.fontSize = (navData as any).fontSize; navTextStyle.fontSize = (navData as any).fontSize; }
  if ((navData as any)?.fontWeight) navTextStyle.fontWeight = (navData as any).fontWeight;
  if (navColour) navTextStyle.color = navColour;

  return (
    <div className={`sticky top-0 z-50 w-full transition-all duration-500 flex flex-col ${
      scrolled 
        ? 'card-morphism !rounded-none !border-x-0 !border-t-0 shadow-lg !bg-surface/80 backdrop-blur-xl' 
        : 'bg-transparent'
    }`} style={navStyle}>
      {/* Main Navbar */}
      <div className={`w-full transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="layout-container flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            {(typeof (navData as any)?.logo === 'string' || (navData as any)?.logo?.image || (navData as any)?.logo?.src) && (
              <div className="relative w-12 h-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[10deg]">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/40 transition-all duration-500"></div>
                <Image
                  src={
                    overrideLogoUrl ||
                    resolveUploadUrl(
                      typeof (navData as any)?.logo === 'string'
                        ? ((navData as any).logo as string)
                        : ((navData as any)?.logo?.image?.src || (navData as any)?.logo?.src || '')
                    )
                  }
                  alt={displayTitle}
                  fill
                  className="object-contain relative z-10 drop-shadow-md"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black gradient-title tracking-tighter">
                {displayTitle}
              </span>
              {!scrolled && (
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground-muted animate-fade-in">
                  Official Website
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navData.menu?.map((m, idx) => {
              if (user && (m.href === '/login' || m.href === '/signup' || m.href === '/sign' || m.href === '/auth/login' || m.href === '/auth/signup')) {
                return null;
              }
              
              const active = isActive(m.href);
              
              return (
                <Link 
                  href={m.href} 
                  key={idx} 
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 relative group ${
                    active ? 'text-primary' : 'text-foreground-secondary hover:text-primary hover:bg-primary/5'
                  } ${m.variant === 'neon' ? 'btn-neon !px-6 ml-2' : ''}`}
                >
                  {m.isNotification ? (
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/10 transition-colors">
                      <i className="fa-solid fa-bell text-xl" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-bounce shadow-glow ring-2 ring-background">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    <>
                      {m.label[lang]}
                      {active && m.variant !== 'neon' && (
                        <span className="absolute bottom-1 left-4 right-4 h-1 bg-primary rounded-full shadow-glow"></span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}

            {/* User Profile / Logout */}
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">
                    {typeof user.name === 'string' ? user.name : user.name?.[lang] || user.name?.en || 'User'}
                  </span>
                  <button 
                    onClick={logout}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    {lang === 'en' ? 'Logout' : 'வெளியேறு'}
                  </button>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[2px] shadow-md hover:scale-105 transition-transform cursor-pointer">
                   <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center font-black text-primary">
                     {(typeof user.name === 'string' ? user.name : 'U').charAt(0).toUpperCase()}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-border text-foreground shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45' : '-translate-y-2'}`}></span>
                <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute left-0 top-1/2 w-6 h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45' : 'translate-y-2'}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className={`w-full border-y border-border transition-all duration-300 ${scrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-10 opacity-100'}`}>
        <div className="layout-container h-full flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-foreground-muted">
             <span className="flex items-center gap-1.5 text-primary">
               <i className="fa-solid fa-circle-check animate-pulse"></i> System Active
             </span>
          </div>
          <div className="flex items-center gap-2">
            {navData.languageToggle?.enabled && (
              <button
                onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                  lang === 'ta' 
                    ? 'bg-primary text-white border-primary shadow-glow' 
                    : 'bg-surface text-foreground-muted border-border hover:border-primary/50'
                }`}
              >
                {lang === 'en' ? 'தமிழ்' : 'English'}
              </button>
            )}
            {navData.themeToggle && (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-foreground-muted hover:text-primary hover:border-primary transition-all"
              >
                <i className={`fa-solid ${isDark ? 'fa-sun text-yellow-500' : 'fa-moon text-indigo-500'}`}></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[calc(5rem+1px)] bg-background/95 backdrop-blur-2xl z-40 animate-fade-in overflow-y-auto">
          <div className="p-6 space-y-3">
            <div className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em] mb-4 pl-4">Navigation</div>
            {navData.menu?.map((m, idx) => {
              if (user && (m.href === '/login' || m.href === '/signup' || m.href === '/sign' || m.href === '/auth/login' || m.href === '/auth/signup')) return null;
              const active = isActive(m.href);
              return (
                <Link 
                  href={m.href} 
                  key={idx} 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
                    active 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                      : 'text-foreground-secondary hover:bg-surface border border-transparent'
                  }`}
                >
                  <span className="text-lg font-bold">{m.label[lang]}</span>
                  {active && <i className="fa-solid fa-chevron-right text-sm"></i>}
                  {m.isNotification && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-black">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {user && (
              <div className="mt-8 pt-8 border-t border-border space-y-4">
                <div className="flex items-center gap-4 px-4">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg">
                     {(typeof user.name === 'string' ? user.name : 'U').charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-black uppercase tracking-wider text-foreground">
                       {typeof user.name === 'string' ? user.name : user.name?.[lang] || user.name?.en || 'User'}
                     </span>
                     <span className="text-[10px] text-foreground-muted uppercase tracking-widest">Logged In</span>
                   </div>
                </div>
                <button 
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all duration-300"
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