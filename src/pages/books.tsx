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

          {/* Action Buttons */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => setCartModalOpen(true)}
                  className="btn btn-primary btn-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  {lang === 'en' ? 'View Cart & Checkout' : 'வண்டி மற்றும் செலுத்துதல்'}
                  {cart.length > 0 && (
                    <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setPurchasesModalOpen(true)}
                  className="btn btn-secondary btn-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {lang === 'en' ? 'My Purchases' : 'எனது வாங்கல்கள்'}
                </button>
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
      {/* Compact floating mini-cart */}
      <MiniCart
        items={cart}
        onItemsChange={setCart}
        onGoToCheckout={() => setCartModalOpen(true)}
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
