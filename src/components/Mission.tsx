"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: 'plain' | 'markdown' | 'html';
};
type ComponentRecord = { type: string; content: TextContent; slug?: string };

export default function Mission({ page = 'about', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TextContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as TextContent);
      setLoading(false);
      setError(null);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const url = (() => {
          try {
            const base = typeof window !== 'undefined' ? window.location.origin : '';
            const u = new URL('/api/components/page', base || 'http://localhost:3000');
            u.searchParams.set('page', page);
            return u.toString();
          } catch {
            const qs = new URLSearchParams({ page });
            return `/api/components/page?${qs.toString()}`;
          }
        })();
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'text' && c.slug === 'mission');
        if (record?.content) setData(record.content);
        else {
          setData(null);
          setError('Mission content not found in database');
        }
      } catch (e) {
        console.error('Failed to load mission', e);
        setData(null);
        setError('Failed to load mission content');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  const content: TextContent | null = data;

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden aurora-bg">
        <div className="layout-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
              <div className="w-3/4 h-12 bg-white/10 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="relative h-[400px] bg-white/10 rounded-3xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !content) return null;

  return (
    <section className="py-24 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-bold text-sm uppercase tracking-wider animate-fade-in border border-primary/20">
              <span>🎯</span>
              {lang === 'en' ? 'Our Mission' : 'எங்கள் பணி'}
            </div>
            
            {content.title && (
              <h2 className="text-4xl md:text-5xl font-bold leading-tight animate-slide-in-up text-white drop-shadow-lg">
                {content.title?.[lang] || content.title?.en || ''}
              </h2>
            )}
            
            <p className="text-lg text-gray-300 leading-relaxed animate-slide-in-up drop-shadow-md" style={{ animationDelay: '0.1s' }}>
              {content.content?.[lang] || content.content?.en || ''}
            </p>
            
            <div className="grid grid-cols-1 gap-6 pt-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform border border-indigo-500/30">
                  📚
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-primary transition-colors">{lang === 'en' ? 'Educational Excellence' : 'கல்வி சிறப்பு'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Promoting Tamil language education and literacy worldwide' : 'உலகம் முழுவதும் தமிழ் மொழி கல்வி மற்றும் எழுத்தறிவை ஊக்குவித்தல்'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform border border-emerald-500/30">
                  🌍
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-emerald-400 transition-colors">{lang === 'en' ? 'Cultural Preservation' : 'கலாச்சார பாதுகாப்பு'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Preserving and celebrating Tamil heritage for future generations' : 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தை பாதுகாத்து கொண்டாடுதல்'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform border border-amber-500/30">
                  🤝
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-amber-400 transition-colors">{lang === 'en' ? 'Community Building' : 'சமூக கட்டமைப்பு'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Connecting Tamil communities across the globe' : 'உலகம் முழுவதும் தமிழ் சமூகங்களை இணைத்தல்'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/25 transform hover:-translate-y-1 transition-all duration-300 group flex items-center">
                <span>{lang === 'en' ? 'Join Our Mission' : 'எங்கள் பணியில் சேருங்கள்'}</span>
                <i className="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
              </button>
              <button className="px-6 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/10 text-white transition-all backdrop-blur-sm">
                {lang === 'en' ? 'Learn More' : 'மேலும் அறிக'}
              </button>
            </div>
          </div>
          
          {/* Visual Content */}
          <div className="order-1 lg:order-2 relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-[4/5] lg:aspect-square transform hover:rotate-2 transition-transform duration-500 card-morphism">
              <Image
                src="/images/mission-hero.jpg"
                alt={lang === 'en' ? 'Our Mission' : 'எங்கள் பணி'}
                fill
                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwQzMwNS4yMjggMTUwIDM1MCAyMDUuMjI4IDM1MCAyNjBDMzUwIDMxNC43NzIgMzA1LjIyOCAzNzAgMjUwIDM3MEM5NC43NzIgMzcwIDE1MCAzMTQuNzcyIDE1MCAyNjBDMTUwIDIwNS4yMjggMTk0Ljc3MiAxNTAgMjUwIDE1MFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIzMCAyMDBIMjcwVjMyMEgyMzBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIzMEgzMDBWMjkwSDIwMFYyMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk1pc3Npb24gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-xs text-white/80 uppercase tracking-wider">{lang === 'en' ? 'Years' : 'ஆண்டுகள்'}</div>
                </div>
                <div className="text-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-white/80 uppercase tracking-wider">{lang === 'en' ? 'Members' : 'உறுப்பினர்கள்'}</div>
                </div>
                <div className="text-center p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-white">100+</div>
                  <div className="text-xs text-white/80 uppercase tracking-wider">{lang === 'en' ? 'Events' : 'நிகழ்வுகள்'}</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}
