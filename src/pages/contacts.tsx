import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import ChatModal from '../components/ChatModal';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { FiMessageSquare } from 'react-icons/fi';

export default function ContactsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => { fetchComponents(); }, []);
  
  useEffect(() => {
    // Fetch unread messages count if user is logged in
    const fetchMessageCount = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await safeFetchJson('/api/chat?limit=50', { headers });
        if (res?.success && Array.isArray(res.messages)) {
          const userId = user.id;
          // Count messages not sent by me (incoming)
          // Ideally we would check for unread status, but for now we show count of recent incoming messages
          // to indicate activity.
          // Refined logic: Count messages where senderId != userId and status != 'read' if status is available
          const incoming = res.messages.filter((m: any) => {
             const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
             return senderId !== userId;
          });
          setMessageCount(incoming.length);
        }
      } catch (e) {
        console.error('Failed to fetch message count', e);
      }
    };
    fetchMessageCount();
  }, [user]);

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
      <div className="font-sans min-h-screen aurora-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary mx-auto shadow-xl shadow-primary/20"></div>
          <p className="mt-6 text-lg text-gray-400 font-medium animate-pulse">{lang === 'en' ? 'Loading...' : 'ஏற்றுகிறது...'}</p>
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
      
      <div className="font-sans min-h-screen aurora-bg layout-page">
        {/* Navbar Components */}
        {navbarComponents.map((component) => (
          <DynamicComponent key={component._id} component={component} />
        ))}
        
        <main className="space-y-12 layout-container">
          {/* Hero Components */}
          {heroComponents.length > 0 && (
            <section className="-mt-10 hero-gradient">
               {heroComponents.map((component) => (
                 <div key={component._id} className="layout-card animate-fade-in">
                   <DynamicComponent component={component} />
                 </div>
               ))}
            </section>
          )}

          {/* Content Components */}
          <section className="layout-section">
            <div className="layout-container">
              {/* If we have multiple content components, try to use the grid layout */}
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
          <>
            {footerComponents.map((component) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </>
        )}

        <button
          onClick={() => setOpenChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50"
          aria-label="Open Chat"
        >
          <FiMessageSquare className="text-2xl" />
          {messageCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
              {messageCount}
            </span>
          )}
        </button>
        <ChatModal open={openChat} onClose={() => setOpenChat(false)} logo={logo} />
      </div>
    </>
  );
}