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
  
  // Status translations
  const statusTranslations: Record<string, Bilingual> = {
    'active': { en: 'Active', ta: 'செயலில்' },
    'completed': { en: 'Completed', ta: 'முடிந்தது' },
    'in progress': { en: 'In Progress', ta: 'நடைபெற்று வருகிறது' },
    'upcoming': { en: 'Upcoming', ta: 'விரைவில்' },
    'on hold': { en: 'On Hold', ta: 'நிறுத்தப்பட்டது' },
    'cancelled': { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
    'planning': { en: 'Planning', ta: 'திட்டமிடல்' },
    'draft': { en: 'Draft', ta: 'வரைவு' }
  };
  
  const translatedStatus = statusTranslations[progressLabel.toLowerCase()] 
    ? statusTranslations[progressLabel.toLowerCase()][lang] 
    : progressLabel || (lang === 'en' ? 'Status' : 'நிலை');

  const bureauLabels: Record<string, Bilingual> = {
    sports_leadership: { en: 'Sports & Leadership Bureau', ta: 'விளையாட்டு & தலைமைக் கழகம்' },
    education_intellectual: { en: 'Education & Intellectual Bureau', ta: 'கல்வி & அறிவாற்றல் கழகம்' },
    arts_culture: { en: 'Arts & Culture Bureau', ta: 'கலை & பண்பாட்டுக் கழகம்' },
    social_welfare_voluntary: { en: 'Social Welfare & Voluntary Bureau', ta: 'சமூக நலன் & தன்னார்வக் கழகம்' },
    language_literature: { en: 'Language & Literature Bureau', ta: 'மொழி & இலக்கியக் கழகம்' },
  };
  const bureauLabel = item.bureau ? (bureauLabels[item.bureau] || { en: item.bureau, ta: item.bureau })[lang] : undefined;
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;
  const roundedPct = typeof pct === 'number' ? Math.max(0, Math.min(100, Math.round(pct / 5) * 5)) : undefined;

  return (
    <div className="project-card">
      <div className="project-card-content">
        <div className="project-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={img} 
            alt={
              typeof item.title === 'string' 
                ? item.title 
                : item.title?.[lang] || item.title?.en || ''
            } 
            className="project-image-img" 
          />
      </div>
      <div className="project-content">
        {bureauLabel ? <span className="project-category">{bureauLabel}</span> : null}
        <h3>
          {typeof item.title === 'string' 
            ? item.title 
            : item.title?.[lang] || item.title?.en || ''}
        </h3>
        <h4>{(item.directorName && item.directorName?.[lang]) || ''}</h4>
        <p className="line-clamp-2">
          {typeof item.shortDesc === 'string' 
            ? item.shortDesc 
            : item.shortDesc?.[lang] || item.shortDesc?.en || ''}
        </p>

          <div className="project-status">
            <span className="status-indicator" />
            <span className="text-capitalize">{translatedStatus}</span>
          </div>

          {typeof pct === 'number' ? (
            <div className="project-progress">
              <div>
                <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                <span>{pct}%</span>
              </div>
              <div className="bar">
                {typeof roundedPct === 'number' ? (
                  <div className={`bar-fill w-pct-${roundedPct}`} />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="project-actions">
            <Link href={href} className="feature-link btn-neon hover-pulse">
              <span>{lang === 'en' ? 'View Details' : 'விவரங்களைப் பார்க்க'}</span> <i className="fa-solid fa-arrow-right fa-fw" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}