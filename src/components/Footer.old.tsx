"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../hooks/LanguageContext';

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
    if (s.startsWith('/api/')) return s;
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = new URL(s, base);
    const path = url.pathname.replace(/^[/]+/, '');
    if (path.toLowerCase().startsWith('uploads/')) {
      return `/api/uploads/image?p=${encodeURIComponent(path)}`;
    }
    return s;
  } catch {
    const p = (src || '').replace(/^https?:\/\/[^/]+/,'').replace(/^[/]+/,'');
    if (p.toLowerCase().startsWith('uploads/')) {
      return `/api/uploads/image?p=${encodeURIComponent(p)}`;
    }
    return src;
  }
}export default function Footer({ page = 'home' }: { page?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FooterContent | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch global footer by type; prefer 'home' page definition if present
        const res = await fetch(`/api/components/type?type=footer&preferPage=home`);
        const json = await res.json();
        const doc = json?.component as ComponentRecord | null;
        if (doc?.content) setData(doc.content);
      } catch (e) {
        console.error('Failed to load footer', e);
      }
    }
    load();
  }, []);

  const content: FooterContent = data || {
    logo: { text: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' } },
    description: { en: '', ta: '' },
    socialLinks: {},
    quickLinks: {
      aboutLink: { text: { en: 'About Us', ta: 'எங்களை பற்றி' }, url: '/about' },
      projectsLink: { text: { en: 'Projects', ta: 'திட்டங்கள்' }, url: '/projects' },
      ebooksLink: { text: { en: 'Ebooks', ta: 'மின்னூல்கள்' }, url: '/ebooks' },
      bookstoreLink: { text: { en: 'Book Store', ta: 'புத்தக அங்காடி' }, url: '/books' },
    },
    supportLinks: {
      contactLink: { text: { en: 'Contact Us', ta: 'எங்களை தொடர்பு கொள்ள' }, url: '/contacts' },
      notificationsLink: { text: { en: 'Notifications', ta: 'அறிவிப்புகள்' }, url: '/noti' },
    },
    newsletter: {
      title: { en: 'Newsletter', ta: 'செய்திமடல்' },
      description: { en: '', ta: '' },
      emailPlaceholder: { en: 'Enter your email', ta: 'மின்னஞ்சலை உள்ளிடவும்' },
      buttonIcon: 'fa-solid fa-paper-plane'
    },
    copyright: { en: '© Tamil Language Society', ta: '© தமிழ் மொழி சங்கம்' },
    quickLinksTitle: { en: 'Quick Links', ta: 'விரைவு இணைப்புகள்' },
    supportTitle: { en: 'Support', ta: 'ஆதரவு' }
  };

  return (
    <footer className="footer card-morphism">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="footer-content">
          <div className="footer-section hover-lift">
            <div className="footer-logo hover-glow animate-text-glow">
              {content.logo?.image ? (
                <Image src={resolveUploadUrl(content.logo.image.src)} alt={content.logo.image.alt[lang]} width={48} height={48} className="animate-rotate-3d" unoptimized />
              ) : null}
              {content.logo?.text ? <span className="font-extrabold gradient-title">{content.logo.text[lang]}</span> : null}
            </div>
            {content.description ? <p>{content.description[lang]}</p> : null}
            <div className="social-links">
              {content.socialLinks?.facebookUrl && (
                <Link href={content.socialLinks.facebookUrl} className="social-link btn-neon hover-glow animate-pulse-3d" aria-label="Facebook">
                  <i className="fa-brands fa-facebook fa-fw text-white"></i>
                </Link>
              )}
              {content.socialLinks?.twitterUrl && (
                <Link href={content.socialLinks.twitterUrl} className="social-link btn-neon hover-glow animate-pulse-3d" aria-label="Twitter">
                  <i className="fa-brands fa-twitter fa-fw text-white"></i>
                </Link>
              )}
              {content.socialLinks?.instagramUrl && (
                <Link href={content.socialLinks.instagramUrl} className="social-link btn-neon hover-glow animate-pulse-3d" aria-label="Instagram">
                  <i className="fa-brands fa-instagram fa-fw text-white"></i>
                </Link>
              )}
              {content.socialLinks?.youtubeUrl && (
                <Link href={content.socialLinks.youtubeUrl} className="social-link btn-neon hover-glow animate-pulse-3d" aria-label="YouTube">
                  <i className="fa-brands fa-youtube fa-fw text-white"></i>
                </Link>
              )}
            </div>
          </div>

          <div className="footer-section hover-lift">
            <h2 className="animate-text-glow font-bold gradient-title">{(content.quickLinksTitle || { en: 'Quick Links', ta: 'விரைவு இணைப்புகள்' })[lang]}</h2>
            <ul>
              {content.quickLinks?.aboutLink && (
                <li><Link href={content.quickLinks.aboutLink.url} className="hover-tilt">{content.quickLinks.aboutLink.text[lang]}</Link></li>
              )}
              {content.quickLinks?.projectsLink && (
                <li><Link href={content.quickLinks.projectsLink.url} className="hover-tilt">{content.quickLinks.projectsLink.text[lang]}</Link></li>
              )}
              {content.quickLinks?.ebooksLink && (
                <li><Link href={content.quickLinks.ebooksLink.url} className="hover-tilt">{content.quickLinks.ebooksLink.text[lang]}</Link></li>
              )}
              {content.quickLinks?.bookstoreLink && (
                <li><Link href={content.quickLinks.bookstoreLink.url} className="hover-tilt">{content.quickLinks.bookstoreLink.text[lang]}</Link></li>
              )}
            </ul>
          </div>

          <div className="footer-section hover-lift">
            <h2 className="animate-text-glow font-bold gradient-title">{(content.supportTitle || { en: 'Support', ta: 'ஆதரவு' })[lang]}</h2>
            <ul>
              {content.supportLinks?.contactLink && (
                <li><Link href={content.supportLinks.contactLink.url} className="hover-tilt">{content.supportLinks.contactLink.text[lang]}</Link></li>
              )}
              {content.supportLinks?.notificationsLink && (
                <li><Link href={content.supportLinks.notificationsLink.url} className="hover-tilt">{content.supportLinks.notificationsLink.text[lang]}</Link></li>
              )}
            </ul>
          </div>

          <div className="footer-section card-neon hover-lift">
            <h2 className="animate-text-glow font-bold gradient-title">{content.newsletter?.title ? content.newsletter.title[lang] : 'Newsletter'}</h2>
            <p>{content.newsletter?.description ? content.newsletter.description[lang] : ''}</p>
            <div className="newsletter-form">
              <input type="email" placeholder={content.newsletter?.emailPlaceholder ? content.newsletter.emailPlaceholder[lang] : 'Enter your email'} className="newsletter-input btn-glass hover-glow" aria-label="Email" />
              <button className="newsletter-btn btn-neon hover-glow animate-pulse-3d" aria-label="Subscribe to newsletter">
                <i className={(content.newsletter?.buttonIcon || 'fa-solid fa-paper-plane') + ' fa-fw text-white'}></i>
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom card-morphism hover-lift">
          <p className="animate-text-glow">{content.copyright ? content.copyright[lang] : ''}</p>
        </div>
      </div>
    </footer>
  );
}
