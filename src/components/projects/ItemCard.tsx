"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };

export type ItemRecord = {
  _id: string;
  type: 'project' | 'activity' | 'initiative';
  bureau?: string;
  title: Bilingual;
  shortDesc: Bilingual;
  status?: string;
  progress?: string;
  progressPercent?: number;
  directorName?: Bilingual;
  images: string[];
  heroImagePath?: string;
};

export default function ItemCard({ item }: { item: ItemRecord }) {
  const { lang } = useLanguage();
  const img = item.heroImagePath || item.images?.[0] || '/placeholder.png';
  const href = item.type === 'project' ? `/projects/${item._id}` : item.type === 'activity' ? `/activities/${item._id}` : `/initiatives/${item._id}`;

  const progressLabel = (item.progress || item.status || '').replace(/-/g, ' ');

  const bureauLabels: Record<string, Bilingual> = {
    sports_leadership: { en: 'Sports & Leadership Bureau', ta: 'விளையாட்டு & தலைமைக் கழகம்' },
    education_intellectual: { en: 'Education & Intellectual Bureau', ta: 'கல்வி & அறிவாற்றல் கழகம்' },
    arts_culture: { en: 'Arts & Culture Bureau', ta: 'கலை & பண்பாட்டுக் கழகம்' },
    social_welfare_voluntary: { en: 'Social Welfare & Voluntary Bureau', ta: 'சமூக நலன் & தன்னார்வக் கழகம்' },
    language_literature: { en: 'Language & Literature Bureau', ta: 'மொழி & இலக்கியக் கழகம்' },
  };
  const bureauLabel = item.bureau ? (bureauLabels[item.bureau] || { en: item.bureau, ta: item.bureau })[lang] : undefined;
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;

  return (
    <div className="project-card">
      <div className="project-card-content">
        <div className="project-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={item.title[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="project-content">
          {bureauLabel ? <span className="project-category">{bureauLabel}</span> : null}
          <h3>{item.title[lang]}</h3>
          <h4>{(item.directorName && item.directorName[lang]) || ''}</h4>
          <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.shortDesc[lang]}</p>

          <div className="project-status">
            <span className="status-indicator" />
            <span style={{ textTransform: 'capitalize' }}>{progressLabel || (lang === 'en' ? 'status' : 'நிலை') }</span>
          </div>

          {typeof pct === 'number' ? (
            <div className="project-progress">
              <div>
                <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                <span>{pct}%</span>
              </div>
              <div>
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
            <Link href={href} className="feature-link btn-neon hover-pulse">
              <span>{lang === 'en' ? 'View Details' : 'விவரங்களைப் பார்க்க'}</span> <i className="fa-solid fa-arrow-right fa-fw" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}