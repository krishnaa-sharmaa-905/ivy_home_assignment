import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, cleanListing } from '../api';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/v1/listings/${id}`);
        setListing(cleanListing(res.data));
        
        // Check if saved
        const savedRes = await api.get('/v1/saved');
        const isS = savedRes.data.results.some((s: any) => s.listing_id === id);
        setIsSaved(isS);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const toggleSave = async () => {
    setSaving(true);
    try {
      if (isSaved) {
        await api.delete(`/v1/saved/${id}`);
        setIsSaved(false);
      } else {
        await api.post('/v1/saved', { listing_id: id });
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!listing) return <div className="text-center py-12">Listing not found</div>;

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-5xl mx-auto">
      <div className="h-64 sm:h-80 w-full relative">
        <img src={`https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80`} alt="Property Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div>
            <div className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold tracking-wider uppercase mb-3 shadow-lg">
              {listing.property_type}
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              {listing.bedroom} BHK in {listing.apartment_name || 'Independent Property'}
            </h3>
          </div>
          <button 
            onClick={toggleSave}
            disabled={saving}
            className={`p-4 rounded-full backdrop-blur-md shadow-xl transition-all hover:scale-105 active:scale-95 ${isSaved ? 'text-indigo-400 bg-white/90' : 'text-white bg-white/20 hover:bg-white/30'}`}
          >
            {isSaved ? <BookmarkCheck className="w-7 h-7" /> : <Bookmark className="w-7 h-7" />}
          </button>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-10 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Asking Price</p>
            <span className="text-4xl font-extrabold text-indigo-600 block mt-1">{formatter.format(listing.price)}</span>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-50 px-6 py-4 rounded-2xl text-center">
              <span className="block text-2xl font-bold text-slate-900">{Math.round(listing.carpet_area)}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sq.Ft</span>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-2xl text-center">
              <span className="block text-2xl font-bold text-slate-900">{formatter.format(listing.price / listing.carpet_area)}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per Sq.Ft</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Locality</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900 capitalize">{listing.locality}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Furnishing</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900 capitalize">{listing.furnishing}</dd>
          </div>
          <div className="col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Floor</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{listing.floor} <span className="text-sm text-slate-500 font-normal">of {listing.total_floors}</span></dd>
          </div>
          <div className="col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bathrooms</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{listing.bathroom}</dd>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posted By</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900 capitalize flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3">
                {listing.posted_by_name?.charAt(0) || 'A'}
              </div>
              <div>
                {listing.posted_by_name}
                <span className="block text-sm text-slate-500 font-normal">{listing.posted_by}</span>
              </div>
            </dd>
          </div>
          {listing.project_id && (
            <div className="col-span-2 sm:col-span-2">
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project details</dt>
              <dd className="mt-2 text-lg font-semibold text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors" onClick={() => navigate('/projects')}>
                View Project {listing.project_id} &rarr;
              </dd>
            </div>
          )}
          <div className="col-span-2 sm:col-span-4 mt-4 bg-slate-50 rounded-2xl p-6 sm:p-8">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">About this property</dt>
            <dd className="text-base text-slate-700 whitespace-pre-wrap leading-relaxed">{listing.description}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
