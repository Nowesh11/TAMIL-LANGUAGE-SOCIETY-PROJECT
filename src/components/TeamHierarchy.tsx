"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type Member = {
  _id: string;
  name: Bilingual;
  role: string;
  bio: Bilingual;
  email: string;
  phone?: string;
  imageUrl?: string | null;
  department?: string;
  joinedDate?: string | Date;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  achievements?: string[];
  specializations?: string[];
  languages?: string[];
};

const roleLabels: Record<string, Bilingual> = {
  'President': { en: 'President', ta: 'தலைவர்' },
  'Vice President': { en: 'Vice President', ta: 'துணைத் தலைவர்' },
  'Secretary': { en: 'Secretary', ta: 'செயலாளர்' },
  'Treasurer': { en: 'Treasurer', ta: 'பொருளாளர்' },
  'Chief Auditor': { en: 'Chief Auditor', ta: 'தலைமைத் தணிக்கையாளர்' },
  'Auditor': { en: 'Auditor', ta: 'தணிக்கையாளர்' },
  'Media and Public Relations Committee Member': { en: 'Media & PR Committee Member', ta: 'ஊடகம், விளம்பரம் மற்றும் பொதுதொடர்புச் செயலவை உறுப்பினர்' },
  'Sports and Leadership Committee Member': { en: 'Sports & Leadership Committee Member', ta: 'விளையாட்டு & தலைமைத்துவச் செயலவை உறுப்பினர்' },
  'Education and Intellectual Committee Member': { en: 'Education & Intellectual Committee Member', ta: 'கல்வி & அறிவுசார் செயலவை உறுப்பினர்' },
  'Arts & Culture Committee Member': { en: 'Arts & Culture Committee Member', ta: 'கலை & பண்பாட்டுச் செயலவை உறுப்பினர்' },
  'Social Welfare & Voluntary Committee Member': { en: 'Social Welfare & Voluntary Committee Member', ta: 'சமூகநலன் & தன்னார்வாலச் செயலவை உறுப்பினர்' },
  'Language and Literature Committee Member': { en: 'Language & Literature Committee Member', ta: 'மொழி & இலக்கியச் செயலவை உறுப்பினர்' },
};

export default function TeamHierarchy() {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/team?sort=hierarchy');
        const json = await res.json();
        const list = Array.isArray(json.members) ? (json.members as Member[]) : [];
        setMembers(list);
        if (!list.length) setError('No team members found');
      } catch (e) {
        console.error('Failed to load team hierarchy', e);
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const byRole = (r: string) => members.filter(m => m.role === r);
    return {
      president: byRole('President'),
      topThree: [...byRole('Vice President'), ...byRole('Treasurer'), ...byRole('Secretary')],
      executives: [
        ...byRole('Media and Public Relations Committee Member'),
        ...byRole('Sports and Leadership Committee Member'),
        ...byRole('Education and Intellectual Committee Member'),
        ...byRole('Arts & Culture Committee Member'),
        ...byRole('Social Welfare & Voluntary Committee Member'),
        ...byRole('Language and Literature Committee Member'),
      ],
      auditors: [...byRole('Chief Auditor'), ...byRole('Auditor')],
    };
  }, [members]);

  const Card = ({ m }: { m: Member }) => {
    const joinedYear = m.joinedDate ? new Date(m.joinedDate as Date).getFullYear() : null;
    return (
      <div className="rounded-3xl border border-black/5 dark:border-white/10 p-6 card-morphism card-gradient text-white group relative hover:shadow-2xl hover:translate-y-[-4px] hover-glow transition-all">
        <div className="flex items-center gap-6">
          <div className="p-[3px] rounded-2xl ring-gradient">
            <div className="w-40 h-40 rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
              {m.imageUrl ? (
                <Image src={m.imageUrl} alt={m.name[lang]} width={160} height={160} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">{m.name[lang][0]}</div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold animate-text-glow gradient-title">{m.name[lang]}</div>
            <div className="mt-1 text-base opacity-90">{(roleLabels[m.role] || { en: m.role, ta: m.role })[lang]}</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm opacity-90">
              {m.department ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                  <i className="fa-solid fa-building fa-fw" /> {m.department}
                </span>
              ) : null}
              {joinedYear ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10">
                  <i className="fa-solid fa-calendar-days fa-fw" /> Joined {joinedYear}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{m.bio[lang]}</p>
        {m.socialLinks ? (
          <div className="mt-4 flex gap-3 text-slate-600 dark:text-slate-300">
            {m.socialLinks.linkedin ? (
              <a href={m.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                <i className="fa-brands fa-linkedin fa-lg" />
              </a>
            ) : null}
            {m.socialLinks.twitter ? (
              <a href={m.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                <i className="fa-brands fa-twitter fa-lg" />
              </a>
            ) : null}
            {m.socialLinks.facebook ? (
              <a href={m.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                <i className="fa-brands fa-facebook fa-lg" />
              </a>
            ) : null}
            {m.socialLinks.instagram ? (
              <a href={m.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                <i className="fa-brands fa-instagram fa-lg" />
              </a>
            ) : null}
            {m.socialLinks.website ? (
              <a href={m.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                <i className="fa-solid fa-globe fa-lg" />
              </a>
            ) : null}
          </div>
        ) : null}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-black/10 dark:bg-white/5 backdrop-blur-sm rounded-3xl" />
          <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 dark:bg-black/60 backdrop-blur-md p-4 text-sm shadow-xl">
            <div className="font-medium">{m.email}</div>
            {m.phone ? <div>{m.phone}</div> : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="text-3xl font-bold mb-6 text-center">{lang === 'en' ? 'Our Team' : 'எங்கள் குழு'}</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-black/5 dark:border-white/10 p-6 bg-white/80 dark:bg-white/[0.03]">
              <div className="flex items-center gap-6 animate-pulse">
                <div className="w-40 h-40 rounded-2xl bg-slate-200 dark:bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <p className="text-red-700 dark:text-red-300">{lang === 'en' ? 'Unable to load team.' : 'எங்கள் குழுவை ஏற்ற முடியவில்லை.'}</p>
        </div>
      ) : (
        <>
          {/* President */}
          {grouped.president.length ? (
            <div className="grid grid-cols-1 gap-6 mb-8">
              {grouped.president.map((m) => <Card key={m._id} m={m} />)}
            </div>
          ) : null}
          {/* Top three */}
          {grouped.topThree.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {grouped.topThree.map((m) => <Card key={m._id} m={m} />)}
            </div>
          ) : null}
          {/* Executives (five cards) */}
          {grouped.executives.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {grouped.executives.slice(0, 5).map((m) => <Card key={m._id} m={m} />)}
            </div>
          ) : null}
          {/* Auditors (three cards) */}
          {grouped.auditors.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grouped.auditors.slice(0, 3).map((m) => <Card key={m._id} m={m} />)}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}