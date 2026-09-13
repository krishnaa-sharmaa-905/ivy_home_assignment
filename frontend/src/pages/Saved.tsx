import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, cleanListing } from '../api';
import { Trash2 } from 'lucide-react';

export default function Saved() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const res = await api.get('/v1/saved');
      setListings(res.data.results.map(cleanListing));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.delete(`/v1/saved/${id}`);
      setListings(prev => prev.filter(l => l.listing_id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Saved Listings</h2>
      {listings.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No saved listings yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link key={listing.listing_id} to={`/listings/${listing.listing_id}`} className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden block relative">
              <button 
                onClick={(e) => removeSaved(listing.listing_id, e)}
                className="absolute top-2 right-2 p-2 text-red-500 bg-red-50 rounded-full hover:bg-red-100 z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="p-5">
                <div className="flex justify-between items-start mr-8">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{listing.bedroom} BHK {listing.property_type}</h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {formatter.format(listing.price)}
                </span>
                <p className="text-sm text-gray-500 mt-1 capitalize">{listing.locality}</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><span className="font-semibold">{Math.round(listing.carpet_area)}</span> sqft</div>
                  <div className="capitalize">{listing.furnishing}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
