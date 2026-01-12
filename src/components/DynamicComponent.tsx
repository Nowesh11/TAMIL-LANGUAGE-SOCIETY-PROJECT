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
import Banner from './Banner';
import Image from './Image';
import Testimonials from './Testimonials';
import ContactForm from './ContactForm';
import Newsletter from './Newsletter';
import Video from './Video';
import NavBar from './NavBar';
import Footer from './Footer';
import SeoHead from './SeoHead';
import PosterSlider from './PosterSlider';
import Countdown from './Countdown';
import Team from './Team';
import TeamHierarchyLayout from './TeamHierarchyLayout';

// (unused type removed)
type Component = {
  _id: string;
  type: string;
  page: string;
  content: Record<string, unknown>;
  order: number;
};

export default function DynamicComponent({ component }: { component: Component }) {
  const { type, page, content } = component;
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
      return <TextSection page={page} data={content} />;
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
