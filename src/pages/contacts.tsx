import { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import DynamicComponent from '../components/DynamicComponent';
import ChatModal from '../components/ChatModal';
import { safeFetchJson } from '../lib/safeFetch';

export default function ContactsPage() {
  const [components, setComponents] = useState<any[]>([]);
  const [openChat, setOpenChat] = useState(false);

  useEffect(() => { fetchComponents(); }, []);

  async function fetchComponents() {
    const res = await safeFetchJson('/api/components/page?page=contacts');
    if (res?.success) {
      const items = (res.components || [])
        .filter((c: any) => c.type !== 'nav' && c.type !== 'footer' && c.type !== 'seo')
        .filter((c: any) => c.type !== 'text' || c.slug === 'map');
      setComponents(items);
    }
  }

  return (
    <>
      <SeoHead page="contacts" />
      <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0b1020] dark:via-[#0d0f1a] dark:to-[#0b0e19]">
        <NavBar page="contacts" />
        <main className="space-y-12 layout-container">
          <section className="layout-section">
            {components.map((component: any) => (
              <DynamicComponent key={component._id} component={component} />
            ))}
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="contacts" />
        </footer>

        <button
          onClick={() => setOpenChat(true)}
          className="chat-fab"
          aria-label="Open Chat"
        >
          <i className="fa-solid fa-comments" aria-hidden="true" />
        </button>
        <ChatModal open={openChat} onClose={() => setOpenChat(false)} />
      </div>
    </>
  );
}