import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import ChatModal from '../components/ChatModal';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import { FiMessageSquare } from 'react-icons/fi';
import '../styles/pages/contacts.css';

export default function ContactsPage() {
  const { lang } = useLanguage();
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => { fetchComponents(); }, []);

  async function fetchComponents() {
    try {
      const res = await safeFetchJson('/api/components/page?page=contacts');
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
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19] flex items-center justify-center">
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

  // Extract logo from navbar for ChatModal
  const logo = navbarComponents[0]?.content?.logo;

  return (
    <>
      {/* SEO Components */}
      {seoComponents.map((component) => (
        <DynamicComponent key={component._id} component={component} />
      ))}
      
      <div className="contacts-page">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={component._id} component={component} />
        ))}
        
        <main>
          {/* Hero Components */}
          {heroComponents.length > 0 && (
            <section className="contacts-hero">
               {heroComponents.map((component) => (
                 <div key={component._id} className="contacts-hero-content">
                   <DynamicComponent component={component} />
                 </div>
               ))}
            </section>
          )}

          {/* Content Components */}
          <div className="contacts-content">
            <div className="contacts-container">
              {/* If we have multiple content components, try to use the grid layout */}
              <div className={contentComponents.length > 1 ? "contacts-layout" : "contacts-single-layout"}>
                {contentComponents.map((component) => (
                  <div key={component._id} className="animate-slide-up">
                    <DynamicComponent component={component} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer Components */}
        {footerComponents.length > 0 && (
          <footer className="mt-auto">
            {footerComponents.map((component) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </footer>
        )}

        <button
          onClick={() => setOpenChat(true)}
          className="chat-fab"
          aria-label="Open Chat"
        >
          <FiMessageSquare />
        </button>
        <ChatModal open={openChat} onClose={() => setOpenChat(false)} logo={logo} />
      </div>
    </>
  );
}