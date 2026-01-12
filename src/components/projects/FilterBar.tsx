"use client";
import React from 'react';
import { useLanguage } from '@/hooks/LanguageContext';

type FilterBarProps = {
  value?: string;
  onChange: (bureau?: string) => void;
};

const options: { label: { en: string; ta: string }; value: string }[] = [
  { 
    label: { 
      en: 'Sports & Leadership Bureau', 
      ta: 'விளையாட்டு மற்றும் தலைமைத்துவ பணியகம்' 
    }, 
    value: 'sports_leadership' 
  },
  { 
    label: { 
      en: 'Education & Intellectual Bureau', 
      ta: 'கல்வி மற்றும் அறிவுசார் பணியகம்' 
    }, 
    value: 'education_intellectual' 
  },
  { 
    label: { 
      en: 'Arts & Culture Bureau', 
      ta: 'கலை மற்றும் கலாச்சார பணியகம்' 
    }, 
    value: 'arts_culture' 
  },
  { 
    label: { 
      en: 'Social Welfare & Voluntary Bureau', 
      ta: 'சமூக நலன் மற்றும் தன்னார்வ பணியகம்' 
    }, 
    value: 'social_welfare_voluntary' 
  },
  { 
    label: { 
      en: 'Language & Literature Bureau', 
      ta: 'மொழி மற்றும் இலக்கிய பணியகம்' 
    }, 
    value: 'language_literature' 
  },
];

export default function FilterBar({ value, onChange }: FilterBarProps) {
  const { lang } = useLanguage();

  return (
    <div className="layout-container filter-bar">
      <button className="btn-primary filter-btn" onClick={() => onChange(undefined)}>
        {lang === 'ta' ? 'அனைத்து பணியகங்கள்' : 'All Bureaus'}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`btn-primary filter-btn ${value === opt.value ? 'filter-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {typeof opt.label === 'string' 
            ? opt.label 
            : opt.label?.[lang] || opt.label?.en || ''}
        </button>
      ))}
    </div>
  );
}