import React, { useState, useEffect } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import { IComponent } from '../models/Component';
import { safeFetchJson } from '../lib/safeFetch';

export default function HomePage() {
  const [components, setComponents] = useState<IComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComponents();
  }, []);

  async function fetchComponents() {
    try {
      const data = await safeFetchJson<{ success: boolean; components: IComponent[] }>('/api/components/page?page=home');
      
      if (data.success && Array.isArray(data.components)) {
        setComponents(data.components);
      } else {
        setComponents([]);
        setError('No components found for home page');
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      setComponents([]);
      setError('Failed to load page content');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-6 shadow-lg shadow-primary/25"></div>
          <p className="text-lg text-gray-400 font-medium animate-pulse">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (error && components.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6">
          <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-foreground-secondary mb-8 text-center max-w-md">{error}</p>
        <button 
          onClick={fetchComponents}
          className="btn-primary"
        >
          Try Again
        </button>
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
      
      <div className="font-sans min-h-screen bg-background text-foreground aurora-bg layout-page">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={String(component._id)} component={component as any} />
        ))}
        
        <main className="space-y-16 layout-container">
          {/* Hero Components */}
          {heroComponents.length > 0 && (
            <section className="-mt-10 hero-gradient">
              {heroComponents.map((component) => (
                <div key={String(component._id)} className="layout-card animate-fade-in">
                  <DynamicComponent component={component as any} />
                </div>
              ))}
            </section>
          )}

          {/* Content Components - Full Width Stack */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="section-stack">
                {contentComponents.map((component) => (
                  <div key={String(component._id)} className="layout-card animate-slide-in-up">
                    <DynamicComponent component={component as any} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <>
            {footerComponents.map((component) => (
              <DynamicComponent key={String(component._id)} component={component as any} />
            ))}
          </>
        )}
      </div>
    </>
  );
}