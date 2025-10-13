"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

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
  const [data, setData] = useState<NavbarContent | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
        // Fetch global navbar by type; prefer 'home' page definition if present
        const res = await fetch(`/api/components/type?type=navbar&preferPage=home`);
        const json = await res.json();
        const doc = json?.component as ComponentRecord | null;
        if (doc?.content) setData(doc.content);
      } catch (e) {
        console.error('Failed to load navbar', e);
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

  // Render deterministic structure even before data loads
  const content = data || {
    themeToggle: true,
    logo: {
      text: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
    },
    menu: [
      { label: { en: 'Home', ta: 'முகப்பு' }, href: '/', active: true },
      { label: { en: 'About Us', ta: 'எங்களை பற்றி' }, href: '/about' },
      { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
      { label: { en: 'Ebooks', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
      { label: { en: 'Book Store', ta: 'புத்தக அங்காடி' }, href: '/books' },
      { label: { en: 'Contact Us', ta: 'எங்களை தொடர்பு கொள்ள' }, href: '/contacts' },
      { label: { en: 'Notifications', ta: 'அறிவிப்புகள்' }, href: '/noti', isNotification: true },
      { label: { en: 'Login', ta: 'உள்நுழை' }, href: '/login' },
      { label: { en: 'Sign Up', ta: 'பதிவு செய்' }, href: '/sign' },
    ],
    languageToggle: { enabled: true, languages: ['en', 'ta'], defaultLang: 'en' },
    hamburger: true,
  } as NavbarContent;

  const navClass = ['navbar', 'hover-lift', isDark ? 'dark-local' : ''].filter(Boolean).join(' ');
  return (
    <nav className={navClass} id="navbar">
      <div className="nav-container">
        <div className="nav-logo hover-glow animate-text-glow">
          {content.logo?.image ? (
            <Image
              src={content.logo.image.src}
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
              m.active ? 'active' : '',
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