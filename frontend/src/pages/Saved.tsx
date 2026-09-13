import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';
import { Link } from 'react-router-dom';

export default function Saved() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    try {
      const res = await api.get('/v1/saved');
      const rawResults = res.data.results || res.data.data || [];
      const valid = rawResults.map(cleanListing).filter(isValidListing);
      setSaved(valid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Saved Properties</h2>
          <p className="mt-2 text-slate-500">Listings you've bookmarked for later.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading saved properties...</div>
      ) : saved.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xl font-semibold text-slate-600">You haven't saved any listings yet.</p>
          <Link to="/" className="mt-6 inline-block px-8 py-3 bg-indigo-600 text-white font-bold rounded-full shadow-md hover:bg-indigo-700 transition-colors">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((listing, idx) => (
            <Link key={`${listing.listing_id}-${idx}`} to={`/listings/${listing.listing_id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden block border border-slate-100 flex flex-col hover:-translate-y-1">
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
                      {listing.property_type}
                    </div>
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase">
                      {listing.furnishing}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                    {listing.bedroom} BHK in {listing.apartment_name || 'Independent'}
                  </h3>
                  <p className="text-sm text-slate-500 capitalize flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                    {listing.locality}
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Area</span>
                    <span className="font-bold text-slate-900">{Math.round(listing.carpet_area)} sqft</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Price</span>
                    <span className="font-bold text-indigo-600 text-lg">{formatter.format(listing.price)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
