"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Stats.css';

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
      <section className="stats bg-section-gradient py-10">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card-morphism h-24 shimmer" />
            <div className="card-morphism h-24 shimmer" />
            <div className="card-morphism h-24 shimmer" />
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="stats bg-section-gradient py-10">
      <div className="container">
        {data.title ? (
          <h3 className="section-title gradient-title text-3xl font-bold mb-6 text-center"><span className="animate-text-glow">{data.title?.[lang] || data.title?.en || ''}</span></h3>
        ) : null}
        <div className="stats-grid grid grid-cols-1 sm:grid-cols-3 gap-6">
          {data.stats.map((s, idx) => (
            <div key={idx} className="stat-item card-morphism card-gradient text-white animate-slide-in-up hover-lift hover-glow">
              <div className="flex items-center gap-3">
                {s.icon ? <i className={`${s.icon} fa-fw stat-icon text-white`}></i> : null}
                <div className="stat-number animate-text-glow text-3xl font-bold">
                  {(values[idx] ?? (Number.parseInt(s.value, 10) || 0))}
                  {s.suffix ? s.suffix : ''}
                </div>
              </div>
              <div className="stat-label animate-fade-in animate-stagger-1 opacity-90">{s.label?.[lang] || s.label?.en || ''}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}