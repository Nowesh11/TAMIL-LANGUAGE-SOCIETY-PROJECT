"use client";
import EbookCard from './EbookCard';

export default function EbooksGrid({ ebooks, loading, onDownload, onRate, onLoadMore, hasMore }: {
  ebooks: any[];
  loading: boolean;
  onDownload: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  return (
    <div className="w-full space-y-8">
      {loading && ebooks.length === 0 && (
        <div className="w-full flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {ebooks.map((e) => (
          <EbookCard key={e._id} ebook={e} onDownload={onDownload} onRate={onRate} />
        ))}
      </div>
      
      {!loading && !ebooks.length && (
        <div className="text-center p-12 card-morphism rounded-2xl mx-4">
          <p className="text-xl text-gray-400">No ebooks found.</p>
        </div>
      )}
      
      {hasMore && (
        <div className="flex justify-center p-8">
          <button 
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg" 
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Ebooks'}
          </button>
        </div>
      )}
    </div>
  );
}