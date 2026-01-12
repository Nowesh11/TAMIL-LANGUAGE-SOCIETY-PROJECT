"use client";
import EbookCard from './EbookCard';
import '../styles/components/EbooksGrid.css';

export default function EbooksGrid({ ebooks, loading, onDownload, onRate, onLoadMore, hasMore }: {
  ebooks: any[];
  loading: boolean;
  onDownload: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  return (
    <div className="section-stack">
      {loading && <div className="layout-card">Loading...</div>}
      <div className="projects-grid">
        {ebooks.map((e) => (
          <EbookCard key={e._id} ebook={e} onDownload={onDownload} onRate={onRate} />
        ))}
      </div>
      {!loading && !ebooks.length && <div className="layout-card text-center">No ebooks found.</div>}
      {hasMore && (
        <div className="layout-card flex-center">
          <button className="btn btn-secondary" onClick={onLoadMore}>Load More</button>
        </div>
      )}
    </div>
  );
}