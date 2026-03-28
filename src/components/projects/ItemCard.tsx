import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../hooks/LanguageContext';
import { FaArrowRight } from 'react-icons/fa';

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
    media_public_relations: { en: 'Media & Public Relations Bureau', ta: 'ஊடகம் & மக்கள் தொடர்பு கழகம்' },
  };
  const bureauLabel = item.bureau ? (bureauLabels[item.bureau] || { en: item.bureau, ta: item.bureau })[lang] : undefined;
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;
  const roundedPct = typeof pct === 'number' ? Math.max(0, Math.min(100, Math.round(pct / 5) * 5)) : undefined;

  return (
    <div className="card-morphism group hover:shadow-2xl transition-all duration-500 overflow-hidden relative bg-surface border border-border rounded-3xl">
      <div className="project-card-content relative z-20 h-full flex flex-col">
        <div className="relative h-56 w-full overflow-hidden mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={img} 
            alt={
              typeof item.title === 'string' 
                ? item.title 
                : item.title?.[lang] || item.title?.en || ''
            } 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
          
          {bureauLabel ? (
            <div className="absolute top-4 left-4">
              <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-primary/80 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                {bureauLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="project-content p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors leading-tight tracking-tighter uppercase">
            {typeof item.title === 'string' 
              ? item.title 
              : item.title?.[lang] || item.title?.en || ''}
          </h3>
          
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${['completed', 'active'].includes((item.status || '').toLowerCase()) ? 'bg-success shadow-glow' : 'bg-warning'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">{translatedStatus}</span>
          </div>

          <p className="text-foreground-secondary text-sm font-medium line-clamp-3 mb-6 leading-relaxed">
            {typeof item.shortDesc === 'string' 
              ? item.shortDesc 
              : item.shortDesc?.[lang] || item.shortDesc?.en || ''}
          </p>

          {typeof pct === 'number' ? (
            <div className="project-progress mb-8">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground-muted mb-2">
                <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                <span className="text-primary">{pct}%</span>
              </div>
              <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden border border-border shadow-inner">
                {typeof roundedPct === 'number' ? (
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 relative"
                    style={{ width: `${pct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="project-actions mt-auto">
            <Link href={href} className="w-full btn-primary !rounded-2xl group/btn">
              <span className="uppercase tracking-widest font-black text-xs">{lang === 'en' ? 'Explore Details' : 'விவரங்களைப் பார்க்க'}</span> 
              <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}