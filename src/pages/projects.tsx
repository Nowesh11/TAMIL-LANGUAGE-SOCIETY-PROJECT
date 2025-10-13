import { useState } from 'react';
import dynamic from 'next/dynamic';
const NavBar = dynamic(() => import('../components/NavBar'), { ssr: false });
const Hero = dynamic(() => import('../components/Hero'), { ssr: false });
const Stats = dynamic(() => import('../components/Stats'), { ssr: false });
const CTA = dynamic(() => import('../components/CTA'), { ssr: false });
const Footer = dynamic(() => import('../components/Footer'), { ssr: false });
import SeoHead from '../components/SeoHead';
import FilterBar from '../components/projects/FilterBar';
import ItemsGrid from '../components/projects/ItemsGrid';
import { useLanguage } from '../hooks/LanguageContext';

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const [bureau, setBureau] = useState<string | undefined>(undefined);

  return (
    <>
      <SeoHead page="projects" />
      <div className="font-sans min-h-screen aurora-gradient layout-page">
        <NavBar page="projects" />
        <main className="space-y-12 layout-container">
          {/* Hero */}
          <section className="-mt-10">
            <Hero page="projects" bureau={bureau} />
            <div className="divider-glow" />
          </section>

          {/* Bureau Filters */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-card">
                <FilterBar value={bureau} onChange={setBureau} />
              </div>
            </div>
          </section>

          {/* Projects */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{lang === 'en' ? 'Projects' : 'திட்டங்கள்'}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="project" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* Activities */}
          <section className="layout-section section-gradient-soft">
            <div className="layout-container">
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{lang === 'en' ? 'Activities' : 'செயல்பாடுகள்'}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="activity" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* Initiatives */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{lang === 'en' ? 'Initiatives' : 'முயற்சிகள்'}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="initiative" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-card">
                <Stats page="projects" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-card">
                <CTA page="projects" bureau={bureau} />
              </div>
            </div>
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="projects" />
        </footer>
      </div>
    </>
  );
}