import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';
import { Link } from 'react-router-dom';

export default function Rentals() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadRentals = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await api.get('/v1/rentals', { params: { offset, limit: 50 } });
      const rawResults = res.data.results || [];
      const newOffset = offset + rawResults.length;
      
      const valid = rawResults.map(cleanListing).filter(isValidListing);

      setRentals(prev => [...prev, ...valid]);
      setOffset(newOffset);
      setHasMore(rawResults.length > 0 && newOffset < res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rentals</h2>
          <p className="mt-2 text-slate-500">Discover rental properties across the city.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.map((rental, idx) => (
          <Link key={`${rental.listing_id}-${idx}`} to={`/listings/${rental.listing_id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden block border border-slate-100 flex flex-col hover:-translate-y-1">
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
                    {rental.property_type}
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase">
                    {rental.furnishing}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {rental.bedroom} BHK in {rental.apartment_name || 'Independent'}
                </h3>
                <p className="text-sm text-slate-500 capitalize flex items-center">
                  <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                  {rental.locality}
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Rent / mo</span>
                  <span className="font-bold text-slate-900">{formatter.format(rental.price)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Deposit</span>
                  <span className="font-bold text-indigo-600 text-lg">{formatter.format(rental.deposit)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-12 pb-12">
          <button 
            onClick={() => loadRentals()} 
            disabled={loading}
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? 'Loading...' : 'Load More Rentals'}
          </button>
        </div>
      )}
      {!hasMore && rentals.length > 0 && (
        <p className="text-center text-slate-500 mt-12 pb-12 font-medium">You've reached the end of the rentals.</p>
      )}
    </div>
  );
}
