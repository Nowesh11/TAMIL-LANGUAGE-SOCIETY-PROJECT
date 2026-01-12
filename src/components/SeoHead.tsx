import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type SeoContent = { title?: Bilingual; description?: Bilingual };
type ComponentRecord = { type: string; content: SeoContent };

export default function SeoHead({ page = 'home', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<SeoContent | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as SeoContent);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const res = await fetch(`/api/components/page?page=${encodeURIComponent(page)}`);
        const json = await res.json();
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const seo = list.find((c) => c.type === 'seo');
        if (seo?.content) setData(seo.content);
      } catch {}
    }
    load();
  }, [page, propData]);

  const title = data?.title || { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' };
  const description = data?.description || { en: 'Promoting Tamil language, culture, and heritage', ta: 'தமிழ் மொழி, பண்பாடு, பாரம்பரியத்தை மேம்படுத்துதல்' };

  return (
    <Head>
      <title>{title?.[lang] || title?.en || 'Tamil Language Society'}</title>
      <meta name="description" content={description?.[lang] || description?.en || 'Promoting Tamil language, culture, and heritage'} />
      <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
    </Head>
  );
}