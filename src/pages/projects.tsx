import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import FilterBar from '../components/projects/FilterBar';
import ItemsGrid from '../components/projects/ItemsGrid';
import DynamicComponent from '../components/DynamicComponent';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent, getPageSEO } from '../lib/getPageContent';
import { safeFetchJson } from '../lib/safeFetch';

interface ProjectsPageProps {
  pageContent: {
    projects: { en: string; ta: string };
    activities: { en: string; ta: string };
    initiatives: { en: string; ta: string };
  };
  seoData: {
    title: { en: string; ta: string };
    description: { en: string; ta: string };
  };
}

export default function ProjectsPage({ pageContent, seoData }: ProjectsPageProps) {
  const { lang } = useLanguage();
  const [bureau, setBureau] = useState<string | undefined>(undefined);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      const res = await safeFetchJson('/api/components/page?page=projects');
      if (res?.success) {
        setComponents(res.components || []);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="font-sans min-h-screen aurora-gradient layout-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{lang === 'en' ? 'Loading...' : 'ஏற்றுகிறது...'}</p>
        </div>
      </div>
    );
  }

  // Sort components by order
  const sortedComponents = [...components].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter components by type for organized rendering
  const seoComponents = sortedComponents.filter(c => c.type === 'seo');
  const navbarComponents = sortedComponents.filter(c => c.type === 'navbar');
  const heroComponents = sortedComponents.filter(c => c.type === 'hero');
  const contentComponents = sortedComponents.filter(c => 
    c.type !== 'seo' && c.type !== 'navbar' && c.type !== 'hero' && c.type !== 'footer'
  );
  const footerComponents = sortedComponents.filter(c => c.type === 'footer');

  return (
    <>
      {/* SEO Components */}
      {seoComponents.map((component) => (
        <DynamicComponent key={component._id} component={component} />
      ))}
      
      <div className="font-sans min-h-screen aurora-gradient layout-page">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={component._id} component={component} />
        ))}
        
        <main className="space-y-12 layout-container">
          {/* Hero Components */}
          {heroComponents.length > 0 && (
            <section className="-mt-10 hero-gradient">
              <div className="layout-container">
                {heroComponents.map((component) => (
                  <div key={component._id} className="layout-card animate-fade-in">
                    <DynamicComponent component={component} />
                  </div>
                ))}
              </div>
              <div className="divider-glow" />
            </section>
          )}

          {/* Content Components */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="section-stack">
                {contentComponents.map((component) => (
                  <div key={component._id} className="layout-card animate-slide-in-up">
                    <DynamicComponent component={component} />
                  </div>
                ))}
              </div>
            </div>
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
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{pageContent?.projects?.[lang] || (lang === 'en' ? 'Projects' : 'திட்டங்கள்')}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="project" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* Activities */}
          <section className="layout-section section-gradient-soft">
            <div className="layout-container">
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{pageContent?.activities?.[lang] || (lang === 'en' ? 'Activities' : 'செயல்பாடுகள்')}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="activity" bureau={bureau} />
              </div>
            </div>
          </section>

          {/* Initiatives */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title"><span className="animate-text-glow">{pageContent?.initiatives?.[lang] || (lang === 'en' ? 'Initiatives' : 'முயற்சிகள்')}</span></h2>
              <div className="section-stack">
                <ItemsGrid type="initiative" bureau={bureau} />
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <footer className="layout-footer">
            {footerComponents.map((component) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </footer>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const pageContent = await getPageContent('projects');
    const seoData = await getPageSEO('projects');

    return {
      props: {
        pageContent: {
          projects: pageContent?.projects || { en: 'Projects', ta: 'திட்டங்கள்' },
          activities: pageContent?.activities || { en: 'Activities', ta: 'செயல்பாடுகள்' },
          initiatives: pageContent?.initiatives || { en: 'Initiatives', ta: 'முயற்சிகள்' }
        },
        seoData: seoData || {
          title: { en: 'Projects', ta: 'திட்டங்கள்' },
          description: { en: 'Explore our projects, activities, and initiatives', ta: 'எங்கள் திட்டங்கள், செயல்பாடுகள் மற்றும் முயற்சிகளை ஆராயுங்கள்' }
        }
      }
    };
  } catch (error) {
    console.error('Error fetching projects page content:', error);
    return {
      props: {
        pageContent: {
          projects: { en: 'Projects', ta: 'திட்டங்கள்' },
          activities: { en: 'Activities', ta: 'செயல்பாடுகள்' },
          initiatives: { en: 'Initiatives', ta: 'முயற்சிகள்' }
        },
        seoData: {
          title: { en: 'Projects', ta: 'திட்டங்கள்' },
          description: { en: 'Explore our projects, activities, and initiatives', ta: 'எங்கள் திட்டங்கள், செயல்பாடுகள் மற்றும் முயற்சிகளை ஆராயுங்கள்' }
        }
      }
    };
  }
};