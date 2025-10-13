"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';

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

export default function Stats({ page = 'home', bureau }: { page?: string; bureau?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<StatsContent | null>(null);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
          // Fallback default content to avoid empty UI
          setData({
            title: { en: 'Statistics', ta: 'புள்ளிவிவரங்கள்' },
            stats: [
              { label: { en: 'Members', ta: 'உறுப்பினர்கள்' }, value: '0', icon: 'fa-solid fa-users' },
              { label: { en: 'Projects', ta: 'திட்டங்கள்' }, value: '0', icon: 'fa-solid fa-diagram-project' },
              { label: { en: 'Events', ta: 'நிகழ்வுகள்' }, value: '0', icon: 'fa-solid fa-calendar-days' },
            ],
            layout: 'grid',
            animated: false,
          });
        }
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, bureau]);

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

  const content = data;
  if (!content) return null;

  return (
    <section className="stats bg-section-gradient py-10">
      <div className="container">
        {content.title ? (
          <h3 className="section-title gradient-title text-3xl font-bold mb-6 text-center"><span className="animate-text-glow">{content.title[lang]}</span></h3>
        ) : null}
        <div className="stats-grid grid grid-cols-1 sm:grid-cols-3 gap-6">
          {content.stats.map((s, idx) => (
            <div key={idx} className="stat-item card-morphism card-gradient text-white animate-slide-in-up hover-lift hover-glow">
              <div className="flex items-center gap-3">
                {s.icon ? <i className={`${s.icon} fa-fw stat-icon text-white`}></i> : null}
                <div className="stat-number animate-text-glow text-3xl font-bold">
                  {(values[idx] ?? (Number.parseInt(s.value, 10) || 0))}
                  {s.suffix ? s.suffix : ''}
                </div>
              </div>
              <div className="stat-label animate-fade-in animate-stagger-1 opacity-90">{s.label[lang]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}