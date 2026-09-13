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
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Locality</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
                 value={filters.locality} onChange={e => setFilters({...filters, locality: e.target.value})} placeholder="e.g. Andheri West" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
          <input type="number" className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
                 value={filters.bhk} onChange={e => setFilters({...filters, bhk: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Price</label>
          <input type="number" className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
                 value={filters.min_price} onChange={e => setFilters({...filters, min_price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Price</label>
          <input type="number" className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" 
                 value={filters.max_price} onChange={e => setFilters({...filters, max_price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Furnishing</label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  value={filters.furnishing} onChange={e => setFilters({...filters, furnishing: e.target.value})}>
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-furnished</option>
            <option value="fully-furnished">Fully-furnished</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, idx) => (
          <Link key={`${listing.listing_id}-${idx}`} to={`/listings/${listing.listing_id}`} className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden block">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900 truncate">{listing.bedroom} BHK {listing.property_type}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {formatter.format(listing.price)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 capitalize">{listing.locality}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">{Math.round(listing.carpet_area)}</span> sqft
                </div>
                <div className="capitalize">
                  {listing.furnishing}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-6">
          <button 
            onClick={() => loadListings()} 
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      {!hasMore && listings.length > 0 && (
        <p className="text-center text-gray-500 mt-6">No more listings</p>
      )}
    </div>
  );
}
