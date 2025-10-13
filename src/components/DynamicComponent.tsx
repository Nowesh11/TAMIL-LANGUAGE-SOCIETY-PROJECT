"use client";
import Hero from './Hero';
import Features from './Features';
import Stats from './Stats';
import Gallery from './Gallery';
import TextSection from './TextSection';
import CTA from './CTA';
import Timeline from './Timeline';
import FAQ from './FAQ';
import SocialLinks from './SocialLinks';

// (unused type removed)
type Component = {
  _id: string;
  type: string;
  page: string;
  content: Record<string, unknown>;
  order: number;
};

export default function DynamicComponent({ component }: { component: Component }) {
  const { type, page } = component;
  switch (type) {
    case 'hero':
      return <Hero page={page} />;
    case 'features':
      return <Features page={page} />;
    case 'stats':
      return <Stats page={page} />;
    case 'gallery':
      return <Gallery page={page} />;
    case 'text':
      return <TextSection page={page} />;
    case 'cta':
      return <CTA page={page} />;
    case 'timeline':
      return <Timeline page={page} />;
    case 'faq':
      return <FAQ page={page} />;
    case 'social-links':
      return <SocialLinks page={page} />;
    default:
      return <div className="container"><div>{type}</div></div>;
  }
}