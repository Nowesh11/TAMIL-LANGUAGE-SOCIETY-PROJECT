import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import Team from '../components/Team';
import { safeFetchJson } from '../lib/safeFetch';

export default function AboutPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      const res = await safeFetchJson('/api/components/page?page=about');
      if (res?.success) {
        setComponents(res.components || []);
      } else {
        setComponents([]);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4 shadow-lg shadow-primary/25"></div>
          <p className="text-gray-400 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Sort components by order
  const sortedComponents = components.sort((a, b) => a.order - b.order);

  // Filter components by type for organized rendering
  const seoComponents = sortedComponents.filter(c => c.type === 'seo');
  const navbarComponents = sortedComponents.filter(c => c.type === 'navbar');
  const heroComponents = sortedComponents.filter(c => c.type === 'hero');
  
  // Exclude 'team' type from dynamic content if we are hardcoding it, to avoid duplication
  const contentComponents = sortedComponents.filter(c => 
    c.type !== 'seo' && c.type !== 'navbar' && c.type !== 'hero' && c.type !== 'footer' && c.type !== 'team'
  );
  const footerComponents = sortedComponents.filter(c => c.type === 'footer');

  return (
    <>
      {/* SEO Components */}
      {seoComponents.map((component) => (
        <DynamicComponent key={component._id} component={component} />
      ))}
      
      <div className="font-sans min-h-screen aurora-bg layout-page">
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

          {/* Hardcoded Team Component */}
          <Team />
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <>
            {footerComponents.map((component) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
