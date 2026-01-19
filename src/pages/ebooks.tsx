import { useEffect, useState } from 'react';
import DynamicComponent from '../components/DynamicComponent';
import EbooksSearchBar from '../components/EbooksSearchBar';
import FeaturedEbooks from '../components/FeaturedEbooks';
import EbooksGrid from '../components/EbooksGrid';
import CategoryCards from '../components/CategoryCards';
import EbooksStats from '../components/EbooksStats';
import { useLanguage } from '../hooks/LanguageContext';

type IEBook = any;
type IComponent = any;

export default function EbooksPage() {
  const { lang } = useLanguage();
  const [components, setComponents] = useState<IComponent[]>([]);
  const [ebooks, setEbooks] = useState<IEBook[]>([]);
  const [featuredEbooks, setFeaturedEbooks] = useState<IEBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    language: 'all',
    sort: 'latest'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { fetchComponents(); }, []);
  useEffect(() => { fetchEbooks(); }, [filters, page]);

  async function fetchComponents() {
    try {
      setComponentsLoading(true);
      const res = await fetch('/api/components/page?page=ebooks');
      const data = await res.json();
      if (data.success) {
        setComponents(data.components || []);
      }
    } catch (error) { 
      console.error('Error fetching components:', error);
      setComponents([]);
    } finally {
      setComponentsLoading(false);
    }
  }

  async function fetchEbooks() {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: filters.search,
        category: filters.category,
        language: filters.language,
        sort: filters.sort,
        page: String(page),
        limit: '12'
      });
      const res = await fetch(`/api/ebooks?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        if (page === 1) {
          setEbooks(list);
          setFeaturedEbooks(list.filter((e: any) => e.featured));
        } else {
          setEbooks((prev) => [...prev, ...list]);
        }
        setHasMore(list.length === 12);
      }
    } catch (error) { console.error('Error fetching ebooks:', error); }
    finally { setLoading(false); }
  }

  async function handleDownload(ebookId: string) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      let res = await fetch(`/api/ebooks/${ebookId}/download`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) {
        alert('Please login to download ebooks.');
        return;
      }
      if (!res.ok) {
        const meta = await fetch(`/api/ebooks/${ebookId}`).then(r => r.json()).catch(() => null);
        const path = meta?.ebook?.filePath || '';
        if (path) {
          let serveUrl = '';
          if (/^https?:\/\//i.test(path)) {
            serveUrl = path;
          } else if (path.includes('/api/files/serve')) {
            serveUrl = path;
          } else if (path.toLowerCase().startsWith('uploads/')) {
            serveUrl = `/api/files/serve?path=${encodeURIComponent(path)}`;
          } else if (path.startsWith('/uploads/')) {
            serveUrl = `/api/files/serve?path=${encodeURIComponent(path.replace(/^\/+/, ''))}`;
          } else {
            serveUrl = path;
          }
          res = await fetch(serveUrl);
        }
      }
      if (res.ok) {
        const blob = await res.blob();
        const disp = res.headers.get('Content-Disposition') || '';
        const match = disp.match(/filename="(.+)"/);
        const filename = match ? match[1] : 'ebook.pdf';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        fetchEbooks();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('Download failed:', data?.error || res.statusText);
      }
    } catch (error) { console.error('Download error:', error); }
  }

  async function handleRate(ebookId: string, rating: number) {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      const res = await fetch(`/api/ebooks/${ebookId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rating })
      });
      if (res.status === 401) {
        alert('Please login to rate ebooks.');
        return;
      }
      if (res.ok) fetchEbooks();
    } catch (error) { console.error('Rating error:', error); }
  }

  function handleSearch(newFilters: any) { setFilters(newFilters); setPage(1); }
  function handleLoadMore() { setPage((prev) => prev + 1); }

  if (componentsLoading) {
    return (
      <div className="font-sans min-h-screen aurora-bg layout-page flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary mx-auto shadow-xl shadow-primary/20"></div>
          <p className="mt-6 text-lg text-gray-400 font-medium animate-pulse">Loading page components...</p>
        </div>
      </div>
    );
  }

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

          {/* Search & Filters */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-card">
                <EbooksSearchBar filters={filters} onSearch={handleSearch} />
              </div>
            </div>
          </section>

          {/* Featured Ebooks */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="section-stack">
                <FeaturedEbooks ebooks={featuredEbooks} onDownload={handleDownload} onRate={handleRate} />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="layout-section section-gradient-soft">
            <div className="layout-container">
              <div className="layout-card">
                <CategoryCards onCategoryClick={(cat) => handleSearch({ ...filters, category: cat })} />
              </div>
            </div>
          </section>

          {/* Ebooks Grid */}
          <section className="layout-section">
            <div className="layout-container">
              <h2 className="section-title gradient-title">
                <span className="animate-text-glow">{lang === 'en' ? 'Recent Additions' : 'புதிய நூல்கள்'}</span>
              </h2>
              <div className="section-stack">
                <EbooksGrid
                  ebooks={ebooks}
                  loading={loading}
                  onDownload={handleDownload}
                  onRate={handleRate}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="layout-section">
            <div className="layout-container">
              <div className="layout-card">
                <EbooksStats />
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
    </>
  );
}
