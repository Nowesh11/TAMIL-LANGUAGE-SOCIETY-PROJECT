"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type Member = {
  _id: string;
  name: Bilingual;
  role: string;
  bio: Bilingual;
  slug: string;
  email: string;
  phone?: string;
  department?: string;
  imageUrl?: string | null;
  socialLinks?: Record<string, string>;
};

export default function TeamSection() {
  const { lang } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/team?sort=hierarchy');
        const json = await res.json();
        const list = Array.isArray(json.members) ? (json.members as Member[]) : [];
        setMembers(list);
      } catch (e) {
        console.error('Failed to load team', e);
      }
    }
    load();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="text-3xl font-bold mb-6">{lang === 'en' ? 'Our Team' : 'எங்கள் குழு'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((m) => (
          <div key={m._id} className="rounded-xl border border-black/5 dark:border-white/10 p-4 bg-white/70 dark:bg-white/[0.02] card-morphism">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                {m.imageUrl ? (
                  <Image src={m.imageUrl} alt={m.name[lang]} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">{m.name[lang][0]}</div>
                )}
              </div>
              <div>
                <div className="font-semibold">{m.name[lang]}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{m.role}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{m.bio[lang]}</p>
            {m.socialLinks && (
              <div className="mt-3 flex gap-3 text-slate-500 dark:text-slate-400">
                {Object.entries(m.socialLinks).map(([key, url]) => (
                  url ? (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      <i className={`fa-brands fa-${key}`}></i>
                    </a>
                  ) : null
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}