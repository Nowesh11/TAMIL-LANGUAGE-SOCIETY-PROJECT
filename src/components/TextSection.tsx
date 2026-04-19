"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };
type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: 'plain' | 'markdown' | 'html';
  // ── Typography / colour settings saved from admin DynamicFormFields ──
  fontSize?: string;        // e.g. "24px", "1.5rem"
  fontWeight?: string;      // e.g. "700"
  fontColor?: string;       // e.g. "#ffffff"
  backgroundColor?: string; // e.g. "#1a1a2e"
  textColor?: string;       // legacy alias for fontColor
};

type ComponentRecord = { type: string; content: TextContent; slug?: string };

interface TextSectionProps {
  page?: string;
  slug?: string;
  data?: any;
  alignment?: 'left' | 'center' | 'right';
}

export default function TextSection({ page = 'home', slug, data: propData, alignment: propAlignment = 'left' }: TextSectionProps) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TextContent | null>(propData || null);
  const [loading, setLoading] = useState(!propData);

  useEffect(() => {
    if (propData) { setData(propData); setLoading(false); return; }
    async function load() {
      try {
        const qs = new URLSearchParams({ page });
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(`/api/components/page?${qs}`);
        const list = Array.isArray(json.components) ? json.components : [];
        const record = slug
          ? list.find(c => c.type === 'text' && c.slug === slug)
          : list.find(c => c.type === 'text');
        if (record?.content) setData(record.content);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [page, slug, propData]);

  if (loading) return (
    <section className="py-16 animate-pulse">
      <div className="max-w-4xl mx-auto px-6 space-y-4">
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
      </div>
    </section>
  );

  if (!data) return null;

  // ── Resolve alignment ──────────────────────────────────────────────────────
  const align: 'left' | 'center' | 'right' | 'justify' = data.alignment || propAlignment || 'left';
  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }[align] || 'text-left';

  // ── Typography styles from admin settings ──────────────────────────────────
  const sectionStyle: React.CSSProperties = {};
  const headingStyle: React.CSSProperties = {};
  const bodyStyle: React.CSSProperties = {};

  // Background colour
  if (data.backgroundColor) sectionStyle.backgroundColor = data.backgroundColor;

  // Font size applies to both heading and body
  if (data.fontSize) {
    headingStyle.fontSize = data.fontSize;
    bodyStyle.fontSize = data.fontSize;
    sectionStyle.fontSize = data.fontSize; // so all child elements inherit
  }

  // Font weight
  if (data.fontWeight) {
    headingStyle.fontWeight = data.fontWeight;
    bodyStyle.fontWeight = data.fontWeight;
  }

  // Font colour — support both new (fontColor) and legacy (textColor) field names
  const colour = data.fontColor || data.textColor;
  if (colour) {
    headingStyle.color = colour;
    bodyStyle.color = colour;
  }

  // ── Content text ───────────────────────────────────────────────────────────
  const titleText = data.title?.[lang] || data.title?.en || '';
  const bodyText  = data.content?.[lang] || data.content?.en || '';

  const renderBody = () => {
    if (data.format === 'html') {
      return <div dangerouslySetInnerHTML={{ __html: bodyText }} style={bodyStyle} />;
    }
    // plain / markdown — render as paragraphs split on double newline
    return bodyText.split(/\n\n+/).map((para, i) => (
      <p key={i} className="leading-relaxed mb-4 last:mb-0" style={bodyStyle}>
        {para}
      </p>
    ));
  };

  return (
    <section className={`py-16 px-4 ${textAlignClass}`} style={sectionStyle}>
      <div className="max-w-4xl mx-auto">
        {titleText && (
          <h2
            className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-md"
            style={headingStyle}
          >
            {titleText}
          </h2>
        )}
        <div className="text-gray-300 leading-relaxed text-lg">
          {renderBody()}
        </div>
      </div>
    </section>
  );
}