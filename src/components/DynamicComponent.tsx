"use client";
import dynamic from 'next/dynamic';

const Hero = dynamic(() => import('./Hero'));
const Features = dynamic(() => import('./Features'));
const Stats = dynamic(() => import('./Stats'));
const Gallery = dynamic(() => import('./Gallery'));
const TextSection = dynamic(() => import('./TextSection'));
const CTA = dynamic(() => import('./CTA'));
const Timeline = dynamic(() => import('./Timeline'));
const FAQ = dynamic(() => import('./FAQ'));
const SocialLinks = dynamic(() => import('./SocialLinks'));
const Banner = dynamic(() => import('./Banner'));
const Image = dynamic(() => import('./Image'));
const Testimonials = dynamic(() => import('./Testimonials'));
const ContactForm = dynamic(() => import('./ContactForm'));
const Newsletter = dynamic(() => import('./Newsletter'));
const Video = dynamic(() => import('./Video'));
const NavBar = dynamic(() => import('./NavBar'));
const Footer = dynamic(() => import('./Footer'));
const SeoHead = dynamic(() => import('./SeoHead'));
const PosterSlider = dynamic(() => import('./PosterSlider'));
const Countdown = dynamic(() => import('./Countdown'));
const Team = dynamic(() => import('./Team'));
const TeamHierarchyLayout = dynamic(() => import('./TeamHierarchyLayout'));
const Mission = dynamic(() => import('./Mission'));
const Vision = dynamic(() => import('./Vision'));

// (unused type removed)
type Component = {
  _id: string;
  type: string;
  page: string;
  content: Record<string, unknown>;
  order: number;
  slug?: string;
};

export default function DynamicComponent({ component }: { component: Component }) {
  const { type, page, content, slug } = component;
  switch (type) {
    case 'seo':
      return <SeoHead page={page} data={content} />;
    case 'navbar':
      return <NavBar page={page} data={content} />;
    case 'footer':
      return <Footer page={page} data={content} />;
    case 'poster':
      return <PosterSlider page={page} data={content} />;
    case 'hero':
      return <Hero page={page} data={content} />;
    case 'banner':
      return <Banner page={page} data={content} />;
    case 'features':
      return <Features page={page} data={content} />;
    case 'stats':
      return <Stats page={page} data={content} />;
    case 'gallery':
      return <Gallery page={page} data={content} />;
    case 'image':
      return <Image page={page} data={content} />;
    case 'text':
      if (slug === 'mission') return <Mission page={page} data={content} />;
      if (slug === 'vision') return <Vision page={page} data={content} />;
      return <TextSection page={page} slug={slug} data={content} />;
    case 'cta':
      return <CTA page={page} data={content} />;
    case 'timeline':
      return <Timeline page={page} data={content} />;
    case 'testimonials':
      return <Testimonials page={page} data={content} />;
    case 'faq':
      return <FAQ page={page} data={content} />;
    case 'contact-form':
      return <ContactForm page={page} data={content} />;
    case 'newsletter':
      return <Newsletter page={page} data={content} />;
    case 'video':
      return <Video page={page} data={content} />;
    case 'social-links':
      return <SocialLinks page={page} data={content} />;
    case 'countdown':
      return <Countdown page={page} data={content} />;
    case 'team':
      return <Team page={page} data={content} />;
    case 'team-hierarchy':
      return <TeamHierarchyLayout page={page} data={content} />;
    default:
      // Unknown component types should not render anything
      return null;
  }
}
