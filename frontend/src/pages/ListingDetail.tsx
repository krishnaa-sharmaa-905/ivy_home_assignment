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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-2xl font-bold leading-6 text-gray-900">
          {listing.bedroom} BHK {listing.property_type} in {listing.apartment_name || 'Independent Property'}
        </h3>
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-indigo-600">{formatter.format(listing.price)}</span>
          <button 
            onClick={toggleSave}
            disabled={saving}
            className={`p-2 rounded-full ${isSaved ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 bg-gray-100 hover:text-gray-500'}`}
          >
            {isSaved ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <div className="px-6 py-5">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Locality</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{listing.locality}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Area</dt>
            <dd className="mt-1 text-sm text-gray-900">{Math.round(listing.carpet_area)} sqft (Carpet)</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Furnishing</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{listing.furnishing}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Floor</dt>
            <dd className="mt-1 text-sm text-gray-900">{listing.floor} out of {listing.total_floors}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
            <dd className="mt-1 text-sm text-gray-900">{listing.bathroom}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Balconies</dt>
            <dd className="mt-1 text-sm text-gray-900">{listing.balcony}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Posted By</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{listing.posted_by_name} ({listing.posted_by})</dd>
          </div>
          {listing.project_id && (
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Project ID</dt>
              <dd className="mt-1 text-sm text-indigo-600 cursor-pointer" onClick={() => navigate('/projects')}>
                {listing.project_id}
              </dd>
            </div>
          )}
          <div className="sm:col-span-4">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{listing.description}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
