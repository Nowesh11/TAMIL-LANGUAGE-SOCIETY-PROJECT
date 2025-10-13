"use client";
import BookCard from './BookCard';

export default function BooksGrid({ books, loading, onAddToCart, onBuyNow, onLoadMore, hasMore }: {
  books: any[];
  loading: boolean;
  onAddToCart: (bookId: string) => void;
  onBuyNow: (book: any) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  return (
    <div className="section-stack">
      {loading && <div className="layout-card">Loading...</div>}
      <div className="projects-grid">
        {books.map((b) => (
          <BookCard key={b._id} book={b} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
        ))}
      </div>
      {!loading && !books.length && <div className="layout-card text-center">No books found.</div>}
      {hasMore && (
        <div className="layout-card flex-center">
          <button className="btn btn-secondary" onClick={onLoadMore}>Load More</button>
        </div>
      )}
    </div>
  );
}