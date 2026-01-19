"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import { IconRenderer } from './ui/IconRenderer';

interface Bilingual {
  en: string;
  ta: string;
}

interface StatItem {
  label: Bilingual;
  value: string;
  suffix?: string;
  icon?: string;
  color?: string;
}

interface StatsContent {
  title?: Bilingual;
  stats: StatItem[];
  layout?: 'horizontal' | 'grid';
  animated?: boolean;
}

interface ComponentRecord {
  type: string;
  content: StatsContent;
}

export default function Stats({ page = 'home', bureau, data: propData }: { page?: string; bureau?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<StatsContent | null>(null);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as StatsContent);
      setLoading(false);
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
            if (bureau) u.searchParams.set('bureau', bureau);
            return u.toString();
          } catch {
            const qs = new URLSearchParams({ page, ...(bureau ? { bureau } : {}) });
            return `/api/components/page?${qs.toString()}`;
          }
        })();
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'stats');
        if (record?.content) {
          setData(record.content);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error('Failed to load stats', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, bureau, propData]);

  useEffect(() => {
    if (!data) return;
    const targets = data.stats.map((s) => Number.parseInt(s.value, 10) || 0);
    if (!data.animated) {
      setValues(targets);
      return;
    }
    setValues(targets.map(() => 0));
    const rafIds: number[] = [];
    const timeouts: number[] = [];
    targets.forEach((target, idx) => {
      const duration = 1200 + idx * 200;
      const startFn = () => {
        const t0 = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - t0) / duration, 1);
          const current = Math.floor(progress * target);
          setValues((prev) => {
            const next = [...prev];
            next[idx] = current;
            return next;
          });
          if (progress < 1) {
            rafIds[idx] = requestAnimationFrame(step);
          }
        };
        rafIds[idx] = requestAnimationFrame(step);
      };
      timeouts[idx] = window.setTimeout(startFn, idx * 50);
    });
    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      timeouts.forEach((id) => clearTimeout(id));
      setValues(targets);
    };
  }, [data]);

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-20 aurora-bg">
        <div className="layout-container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="card-morphism h-32 animate-pulse rounded-2xl border border-white/10" />
            <div className="card-morphism h-32 animate-pulse rounded-2xl border border-white/10" />
            <div className="card-morphism h-32 animate-pulse rounded-2xl border border-white/10" />
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-20 aurora-bg relative overflow-hidden">
      <div className="layout-container relative z-10">
        {data.title ? (
          <h3 className="text-4xl font-bold mb-16 text-center text-white drop-shadow-lg animate-slide-in-up">
            <span className="animate-text-glow">{data.title?.[lang] || data.title?.en || ''}</span>
          </h3>
        ) : null}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.stats.map((s, idx) => (
            <div 
              key={idx} 
              className="card-morphism p-8 text-center hover-lift flex flex-col items-center justify-center group animate-slide-in-up rounded-3xl border border-white/10 shadow-xl"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {s.icon ? (
                <div className="mb-6 p-4 rounded-2xl bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:scale-110 shadow-lg shadow-primary/20 border border-white/10 group-hover:border-primary/50">
                  <IconRenderer iconName={s.icon} className="text-3xl" />
                </div>
              ) : null}
              
              <div className="text-5xl font-black text-white mb-3 flex items-baseline justify-center tracking-tight drop-shadow-md">
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400 group-hover:from-white group-hover:to-primary/50 transition-all">
                  {(values[idx] ?? (Number.parseInt(s.value, 10) || 0))}
                </span>
                {s.suffix ? <span className="text-2xl ml-1 text-primary font-bold">{s.suffix}</span> : ''}
              </div>
              
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest border-t border-white/10 pt-4 w-full group-hover:text-gray-300 transition-colors">
                {s.label?.[lang] || s.label?.en || ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
