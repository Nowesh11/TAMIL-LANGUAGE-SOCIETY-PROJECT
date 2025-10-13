import { useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import DynamicComponent from '../components/DynamicComponent';
import BooksGrid from '../components/BooksGrid';
import CartCheckout from '../components/CartCheckout';
import dynamic from 'next/dynamic';
const MiniCart = dynamic(() => import('../components/MiniCart'), { ssr: false });
import BuyNowModal from '../components/BuyNowModal';
import UserPurchases from '../components/UserPurchases';
import { useLanguage } from '../hooks/LanguageContext';

export default function BooksPage() {
  const { lang } = useLanguage();
  const [components, setComponents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'all', language: 'all', sort: 'latest' });
  const [cart, setCart] = useState<{ bookId: string; title: { en: string; ta: string }; price: number; quantity: number }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBook, setModalBook] = useState<any>(null);
  const checkoutRef = useRef<HTMLElement | null>(null);

  useEffect(() => { fetchComponents(); }, []);
  useEffect(() => { fetchBooks(); }, [filters, page]);

  async function fetchComponents() {
    try {
      const res = await fetch('/api/components/page?page=books');
      if (!res.ok) {
        console.error('Components API error:', res.status, res.statusText);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Components API returned non-JSON');
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.components)) {
        setComponents(data.components);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
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
      const data = await res.json();
      if (data.success) {
        const list = data.items || [];
        if (page === 1) setBooks(list); else setBooks((prev) => [...prev, ...list]);
        setHasMore(list.length === 12);
      }
    } catch (error) { console.error('Error fetching books:', error); }
    finally { setLoading(false); }
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

  const dynamicComponents = components
    .filter((c: any) => c?.type !== 'nav' && c?.type !== 'footer' && c?.type !== 'seo' && c?.type !== 'text')
    .map((component: any) => (
      <DynamicComponent key={component._id} component={component} />
    ));

  return (
    <>
      <SeoHead page="books" />
      <div className="font-sans min-h-screen aurora-gradient layout-page">
        <NavBar page="books" />
        <main className="space-y-12 layout-container">
          {/* Dynamic components from database */}
          <section className="layout-section">
            {dynamicComponents}
            <div className="divider-glow" />
          </section>

          {/* Books Grid */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title">
                <span className="animate-text-glow">{lang === 'en' ? 'Book Store' : 'புத்தக அங்காடி'}</span>
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

          {/* Cart & Checkout */}
          <section className="layout-section section-gradient-soft" ref={checkoutRef as any}>
            <div className="layout-container">
              <CartCheckout items={cart} onItemsChange={setCart} onOrderPlaced={(res) => { setCart([]); onPurchased(res); }} />
            </div>
          </section>

          {/* My Purchases - visible only when logged in */}
          <section className="layout-section">
            <div className="layout-container">
              <UserPurchases />
            </div>
          </section>
        </main>
        <footer className="mt-10">
          <Footer page="books" />
        </footer>
      </div>
      {/* Compact floating mini-cart */}
      <MiniCart
        items={cart}
        onItemsChange={setCart}
        onGoToCheckout={() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />
      <BuyNowModal book={modalBook} open={modalOpen} onClose={() => setModalOpen(false)} onPurchased={onPurchased} />
    </>
  );
}