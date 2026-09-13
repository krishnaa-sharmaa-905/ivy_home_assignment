import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Rentals</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.map((rental, idx) => (
          <div key={`${rental.listing_id}-${idx}`} className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-bold text-gray-900 truncate">{rental.bedroom} BHK {rental.property_type}</h3>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Rent: {formatter.format(rental.price)}/mo
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Dep: {formatter.format(rental.deposit)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2 capitalize">{rental.locality}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">{Math.round(rental.carpet_area)}</span> sqft</div>
              <div className="capitalize">{rental.furnishing}</div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={() => loadRentals()} disabled={loading} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
