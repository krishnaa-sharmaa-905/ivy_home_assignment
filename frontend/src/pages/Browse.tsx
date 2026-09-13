import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, cleanListing, isValidListing } from '../api';

export default function Browse() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [filters, setFilters] = useState({
    locality: '',
    bhk: '',
    min_price: '',
    max_price: '',
    furnishing: ''
  });

  const loadListings = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    
    const currentOffset = reset ? 0 : offset;
    
    try {
      const params: any = { offset: currentOffset, limit: 50 };
      if (filters.locality) params.locality = filters.locality.toLowerCase();
      if (filters.bhk) params.bhk = parseInt(filters.bhk);
      if (filters.min_price) params.min_price = parseInt(filters.min_price);
      if (filters.max_price) params.max_price = parseInt(filters.max_price);
      if (filters.furnishing) params.furnishing = filters.furnishing;

      const res = await api.get('/v1/listings', { params });
      
      const rawResults = res.data.results || [];
      const newOffset = currentOffset + rawResults.length;
      
      // The assignment explicitly requires dropping corrupt/fake listings, and adjusting sqm.
      let valid = rawResults.map(cleanListing).filter(isValidListing);
      
      // Client-side fallback filtering (in case server ignores params)
      if (filters.locality) valid = valid.filter((l: any) => l.locality === params.locality);
      if (filters.bhk) valid = valid.filter((l: any) => l.bedroom === params.bhk);
      if (filters.min_price) valid = valid.filter((l: any) => l.price >= params.min_price);
      if (filters.max_price) valid = valid.filter((l: any) => l.price <= params.max_price);
      if (filters.furnishing) valid = valid.filter((l: any) => l.furnishing === params.furnishing);

      setListings(prev => reset ? valid : [...prev, ...valid]);
      setOffset(newOffset);
      setHasMore(rawResults.length > 0 && newOffset < res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings(true);
  }, [filters]);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap gap-5 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
          <input type="text" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                 value={filters.locality} onChange={e => setFilters({...filters, locality: e.target.value})} placeholder="e.g. Andheri West" />
        </div>
        <div className="w-24">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BHK</label>
          <input type="number" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                 value={filters.bhk} onChange={e => setFilters({...filters, bhk: e.target.value})} />
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Min Price</label>
          <input type="number" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                 value={filters.min_price} onChange={e => setFilters({...filters, min_price: e.target.value})} placeholder="0" />
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Price</label>
          <input type="number" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                 value={filters.max_price} onChange={e => setFilters({...filters, max_price: e.target.value})} placeholder="Any" />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Furnishing</label>
          <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                  value={filters.furnishing} onChange={e => setFilters({...filters, furnishing: e.target.value})}>
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-furnished</option>
            <option value="fully-furnished">Fully-furnished</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, idx) => (
          <Link key={`${listing.listing_id}-${idx}`} to={`/listings/${listing.listing_id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden block border border-slate-100 flex flex-col">
            <div className="h-48 bg-slate-100 overflow-hidden relative">
              <img src={`https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80&sig=${idx}`} alt="Property" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
                {listing.property_type.toUpperCase()}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{listing.bedroom} BHK in {listing.apartment_name || listing.locality}</h3>
                </div>
                <p className="text-sm text-slate-500 mt-2 capitalize flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
                  {listing.locality}
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Area</span>
                  <span className="font-bold text-slate-900">{Math.round(listing.carpet_area)} sqft</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Price</span>
                  <span className="font-bold text-indigo-600 text-lg">{formatter.format(listing.price)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-12 pb-12">
          <button 
            onClick={() => loadListings()} 
            disabled={loading}
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? 'Loading more properties...' : 'Load More Listings'}
          </button>
        </div>
      )}
      {!hasMore && listings.length > 0 && (
        <p className="text-center text-slate-500 mt-12 pb-12 font-medium">You've reached the end of the listings.</p>
      )}
    </div>
  );
}
