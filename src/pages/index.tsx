import React, { useState, useEffect } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import { IComponent } from '../models/Component';

export default function HomePage() {
  const [components, setComponents] = useState<IComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      const res = await fetch('/api/components/page?page=home');

      if (!res.ok) {
        console.error('Components API error:', res.status, res.statusText);
        setComponents([]);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('API returned non-JSON response');
        setComponents([]);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.components)) {
        setComponents(data.components);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19]">
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
        <DynamicComponent key={String(component._id)} component={component as any} />
      ))}
      
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19]">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={String(component._id)} component={component as any} />
        ))}
        
        <main className="space-y-12 layout-container">
          {/* Hero Components */}
          {heroComponents.length > 0 && (
            <section className="-mt-10">
              {heroComponents.map((component) => (
                <DynamicComponent key={String(component._id)} component={component as any} />
              ))}
              <div className="divider-glow" />
            </section>
          )}

          {/* Content Components */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-grid two-col section-stack">
                <div className="space-y-8">
                  {contentComponents.map((component) => (
                    <div key={String(component._id)} className="layout-card animate-slide-in-up">
                      <DynamicComponent component={component as any} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <footer className="mt-10">
            {footerComponents.map((component) => (
              <DynamicComponent key={String(component._id)} component={component as any} />
            ))}
          </footer>
        )}
      </div>
    </>
  );
}