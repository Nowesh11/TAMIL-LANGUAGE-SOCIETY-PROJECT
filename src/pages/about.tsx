import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
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
      <div className="min-h-screen flex items-center justify-center aurora-gradient">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <footer className="mt-10">
            {footerComponents.map((component) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </footer>
        )}
      </div>
    </>
  );
}