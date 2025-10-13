"use client";
import React from 'react';

type FilterBarProps = {
  value?: string;
  onChange: (bureau?: string) => void;
};

const options: { label: string; value: string }[] = [
  { label: 'Sports & Leadership Bureau', value: 'sports_leadership' },
  { label: 'Education & Intellectual Bureau', value: 'education_intellectual' },
  { label: 'Arts & Culture Bureau', value: 'arts_culture' },
  { label: 'Social Welfare & Voluntary Bureau', value: 'social_welfare_voluntary' },
  { label: 'Language & Literature Bureau', value: 'language_literature' },
];

export default function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="layout-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <button className="btn-primary" onClick={() => onChange(undefined)} style={{ padding: '0.5rem 1rem', borderRadius: '999px' }}>
        All Bureaus
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          className="btn-primary"
          onClick={() => onChange(opt.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '999px', opacity: value === opt.value ? 1 : 0.8 }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}