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
  };
  const bureauLabel = item.bureau ? (bureauLabels[item.bureau] || { en: item.bureau, ta: item.bureau })[lang] : undefined;
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;
  const roundedPct = typeof pct === 'number' ? Math.max(0, Math.min(100, Math.round(pct / 5) * 5)) : undefined;

  return (
    <div className="card-morphism group hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-500 overflow-hidden relative bg-[#0a0a0f]/40 border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />
      <div className="project-card-content relative z-20 h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden rounded-t-xl mb-4">
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
        </div>
      <div className="project-content p-4 flex-1 flex flex-col">
        {bureauLabel ? (
          <span className="inline-block px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-900/30 rounded-full border border-cyan-500/20 mb-3 w-fit">
            {bureauLabel}
          </span>
        ) : null}
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
          {typeof item.title === 'string' 
            ? item.title 
            : item.title?.[lang] || item.title?.en || ''}
        </h3>
        <h4 className="text-sm text-gray-400 mb-3 font-medium">{(item.directorName && item.directorName?.[lang]) || ''}</h4>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
          {typeof item.shortDesc === 'string' 
            ? item.shortDesc 
            : item.shortDesc?.[lang] || item.shortDesc?.en || ''}
        </p>

          <div className="project-status flex items-center gap-2 mb-4">
            <span className={`w-2 h-2 rounded-full ${['completed', 'active'].includes((item.status || '').toLowerCase()) ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
            <span className="text-sm text-gray-300 capitalize">{translatedStatus}</span>
          </div>

          {typeof pct === 'number' ? (
            <div className="project-progress mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                <span className="text-cyan-400">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                {typeof roundedPct === 'number' ? (
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${pct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="project-actions mt-auto">
            <Link href={href} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <span>{lang === 'en' ? 'View Details' : 'விவரங்களைப் பார்க்க'}</span> 
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}