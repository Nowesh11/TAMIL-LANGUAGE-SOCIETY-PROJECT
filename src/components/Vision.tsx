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

export default function Vision({ page = 'about', data: propData }: { page?: string; data?: any }) {
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
        const record = list.find((c) => c.type === 'text' && c.slug === 'vision');
        if (record?.content) {
          setData(record.content);
        } else {
          setData(null);
          setError('Vision content not found in database');
        }
      } catch (e) {
        console.error('Failed to load vision', e);
        setError('Failed to load vision content');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden aurora-bg">
        <div className="layout-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[400px] bg-white/10 rounded-3xl animate-pulse" />
            <div className="space-y-6">
              <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
              <div className="w-3/4 h-12 bg-white/10 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-full h-4 bg-white/10 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) return null;

  return (
    <section className="py-24 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual Content */}
          <div className="relative animate-fade-in">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-[4/5] lg:aspect-square transform hover:-rotate-2 transition-transform duration-500 card-morphism">
               <Image
                 src="/images/vision-hero.jpg"
                 alt={lang === 'en' ? 'Our Vision' : 'எங்கள் பார்வை'}
                 fill
                 className="object-cover opacity-80"
                 unoptimized
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwQzMwNS4yMjggMTUwIDM1MCAyMDUuMjI4IDM1MCAyNjBDMzUwIDMxNC43NzIgMzA1LjIyOCAzNzAgMjUwIDM3MEM5NC43NzIgMzcwIDE1MCAzMTQuNzcyIDE1MCAyNjBDMTUwIDIwNS4yMjggMTk0Ljc3MiAxNTAgMjUwIDE1MFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIzMCAyMDBIMjcwVjMyMEgyMzBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIzMEgzMDBWMjkwSDIwMFYyMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPlZpc2lvbiBJbWFnZTwvdGV4dD4KPC9zdmc+Cg==';
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30">
                 <div className="text-4xl md:text-5xl font-black text-white mb-2">2030</div>
                 <div className="text-sm font-bold text-white uppercase tracking-widest">{lang === 'en' ? 'Vision' : 'பார்வை'}</div>
               </div>
             </div>
             
             {/* Decorative Elements */}
             <div className="absolute -top-10 -left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
             <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary font-bold text-sm uppercase tracking-wider animate-fade-in border border-secondary/20">
              <span>🔮</span>
              {lang === 'en' ? 'Our Vision' : 'எங்கள் பார்வை'}
            </div>
            
            {data.title && (
              <h2 className="text-4xl md:text-5xl font-bold leading-tight animate-slide-in-up text-white drop-shadow-lg">
                {data.title?.[lang] || data.title?.en || ''}
              </h2>
            )}
            
            <p className="text-lg text-gray-300 leading-relaxed animate-slide-in-up drop-shadow-md" style={{ animationDelay: '0.1s' }}>
              {data.content?.[lang] || data.content?.en || ''}
            </p>
            
            <div className="space-y-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-secondary/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform border border-yellow-500/30">
                  🌟
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-yellow-400 transition-colors">{lang === 'en' ? 'Global Recognition' : 'உலகளாவிய அங்கீகாரம்'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Making Tamil a globally recognized and celebrated language' : 'தமிழை உலகளவில் அங்கீகரிக்கப்பட்ட மற்றும் கொண்டாடப்படும் மொழியாக மாற்றுதல்'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform border border-sky-500/30">
                  🚀
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-sky-400 transition-colors">{lang === 'en' ? 'Digital Innovation' : 'டிஜிட்டல் புதுமை'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Leading Tamil language technology and digital transformation' : 'தமிழ் மொழி தொழில்நுட்பம் மற்றும் டிஜிட்டல் மாற்றத்தில் முன்னணியில் இருத்தல்'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors group card-morphism hover:bg-white/10">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform border border-green-500/30">
                  🌱
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1 text-white group-hover:text-green-400 transition-colors">{lang === 'en' ? 'Future Generations' : 'எதிர்கால சந்ததியினர்'}</h3>
                  <p className="text-sm text-gray-400">
                    {lang === 'en' ? 'Inspiring young minds to embrace and advance Tamil culture' : 'இளம் மனங்களை தமிழ் கலாச்சாரத்தை ஏற்று முன்னேற்ற ஊக்குவித்தல்'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <button className="bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-secondary/25 transform hover:-translate-y-1 transition-all duration-300 group flex items-center">
                <span>{lang === 'en' ? 'Be Part of Our Vision' : 'எங்கள் பார்வையின் பகுதியாக இருங்கள்'}</span>
                <i className="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
              </button>
              <button className="px-6 py-3 rounded-xl font-medium border border-white/20 hover:bg-white/10 text-white transition-all backdrop-blur-sm">
                {lang === 'en' ? 'Explore More' : 'மேலும் ஆராயுங்கள்'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
