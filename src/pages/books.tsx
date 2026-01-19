import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import BooksGrid from '../components/BooksGrid';
import dynamic from 'next/dynamic';
// MiniCart uses fixed positioning and client-side state, so keep ssr: false
const MiniCart = dynamic(() => import('../components/MiniCart'), { ssr: false });
import BuyNowModal from '../components/BuyNowModal';
import CartModal from '../components/CartModal';
import UserPurchasesModal from '../components/UserPurchasesModal';
import { useLanguage } from '../hooks/LanguageContext';

export default function BooksPage() {
  const { lang } = useLanguage();
  const [components, setComponents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'all', language: 'all', sort: 'latest' });
  const [cart, setCart] = useState<{ bookId: string; title: { en: string; ta?: string }; price: number; quantity: number }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBook, setModalBook] = useState<any>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [purchasesModalOpen, setPurchasesModalOpen] = useState(false);

  useEffect(() => {
    // Check for query param to open modal
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('modal') === 'purchases') {
      setPurchasesModalOpen(true);
      // Clean up URL without reload
      window.history.replaceState({}, '', '/books');
    }
  }, []);

  useEffect(() => { fetchComponents(); }, []);
  useEffect(() => { fetchBooks(); }, [filters, page]);

  async function fetchComponents() {
    try {
      const res = await fetch('/api/components/page?page=books');

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
    }
  }

  async function fetchBooks() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: filters.search,
        category: filters.category,
        language: filters.language,
        sort: filters.sort,
        page: String(page),
        limit: '12'
      });

      const res = await fetch(`/api/books?${params}`);

      if (!res.ok) {
        console.error('Books API error:', res.status);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('Books API returned non-JSON');
        return;
      }

      const data = await res.json();
      if (data.success) {
        const list = Array.isArray(data.items) ? data.items : [];
        if (page === 1) setBooks(list); 
        else setBooks((prev) => [...prev, ...list]);
        setHasMore(list.length === 12);
      }
    } catch (error) { 
      console.error('Error fetching books:', error); 
    } finally { 
      setLoading(false); 
    }
  }

  function handleSearch(newFilters: any) { setFilters(newFilters); setPage(1); }
  function handleLoadMore() { setPage((prev) => prev + 1); }
  function addToCart(bookId: string) {
    const b = books.find((x) => x._id === bookId);
    if (!b) return;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.bookId === bookId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { bookId, title: b.title, price: b.price, quantity: 1 }];
    });
  }
  function openBuyNow(book: any) { setModalBook(book); setModalOpen(true); }
  function onPurchased(_result: any) { /* optionally refresh purchases */ }

  if (loading) {
    return (
      <div className="font-sans min-h-screen aurora-bg layout-page flex items-center justify-center">
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

          {/* Books Grid */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title">
                <span className="animate-text-glow">{lang === 'en' ? 'Book Store' : 'பததக அஙகட'}</span>
              </h2>
              <div className="section-stack">
                <BooksGrid
                  books={books}
                  loading={loading}
                  onAddToCart={addToCart}
                  onBuyNow={openBuyNow}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
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
      </div>
      {/* Compact floating mini-cart */}
      <MiniCart
        items={cart}
        onItemsChange={setCart}
        onGoToCheckout={() => setCartModalOpen(true)}
        onOpenPurchases={() => setPurchasesModalOpen(true)}
      />
      
      {/* Modals */}
      <BuyNowModal book={modalBook} open={modalOpen} onClose={() => setModalOpen(false)} onPurchased={onPurchased} />
      <CartModal 
        isOpen={cartModalOpen} 
        onClose={() => setCartModalOpen(false)} 
        items={cart} 
        onItemsChange={setCart} 
        onOrderPlaced={(res) => { setCart([]); onPurchased(res); setCartModalOpen(false); }} 
      />
      <UserPurchasesModal 
        isOpen={purchasesModalOpen} 
        onClose={() => setPurchasesModalOpen(false)} 
      />
    </>
  );
}
