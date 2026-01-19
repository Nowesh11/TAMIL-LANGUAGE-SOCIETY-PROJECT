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
    <div className="w-full space-y-8">
      {loading && books.length === 0 && (
        <div className="w-full flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {books.map((b) => (
          <BookCard key={b._id} book={b} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
        ))}
      </div>
      
      {!loading && !books.length && (
        <div className="text-center p-12 card-morphism rounded-2xl mx-4">
          <p className="text-xl text-gray-400">No books found.</p>
        </div>
      )}
      
      {hasMore && (
        <div className="flex justify-center p-8">
          <button 
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg" 
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Books'}
          </button>
        </div>
      )}
    </div>
  );
}