import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';
import { Link } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function Browse() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [filters, setFilters] = useState({
    locality: '',
    bhk: '',
    property_type: '',
    furnishing: ''
  });
  
  // Price slider state
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(100000000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]); // initial max

  const loadListings = async (reset = false) => {
    if (!reset && loading) return;
    setLoading(true);
    let currentOffset = reset ? 0 : offset;
    
    try {
      let combined = reset ? [] : [...listings];
      let hasMoreData = true;
      let loadedInThisBatch = 0;
      let fetchCount = 0;

      while (loadedInThisBatch < 10 && hasMoreData && fetchCount < 5) {
        fetchCount++;
        const params: any = { offset: currentOffset, limit: 50 };
        // We DO NOT pass locality to backend because backend requires exact match,
        // and we want substring search on the client side.
        if (filters.bhk) params.bhk = parseInt(filters.bhk);
        if (filters.property_type) params.property_type = filters.property_type;
        if (priceRange[0] > 0) params.min_price = priceRange[0];
        if (priceRange[1] < dynamicMaxPrice) params.max_price = priceRange[1];
        if (filters.furnishing) params.furnishing = filters.furnishing;

        const res = await api.get('/v1/listings', { params });
        
        const rawResults = res.data.results || [];
        currentOffset += rawResults.length;
        hasMoreData = rawResults.length > 0 && currentOffset < res.data.total;
        
        let valid = rawResults.map(cleanListing).filter(isValidListing);
        
        // Client-side fallback filtering
        if (filters.locality) valid = valid.filter((l: any) => l.locality.toLowerCase().includes(filters.locality.toLowerCase()));
        if (filters.bhk) valid = valid.filter((l: any) => l.bedroom === parseInt(filters.bhk));
        if (filters.property_type) valid = valid.filter((l: any) => l.property_type.toLowerCase() === filters.property_type.toLowerCase());
        if (priceRange[0] > 0) valid = valid.filter((l: any) => l.price >= priceRange[0]);
        if (priceRange[1] < dynamicMaxPrice) valid = valid.filter((l: any) => l.price <= priceRange[1]);
        if (filters.furnishing) valid = valid.filter((l: any) => l.furnishing === filters.furnishing);

        combined = [...combined, ...valid];
        loadedInThisBatch += valid.length;
      }

      setListings(combined);
      setOffset(currentOffset);
      setHasMore(hasMoreData);

      if (combined.length > 0) {
        const computedMax = Math.max(...combined.map((l: any) => l.price));
        const roundedMax = Math.ceil(computedMax / 1000000) * 1000000;
        
        if (priceRange[1] >= dynamicMaxPrice) {
            setDynamicMaxPrice(roundedMax > 10000000 ? roundedMax : 100000000);
            setPriceRange([priceRange[0], roundedMax > 10000000 ? roundedMax : 100000000]);
        } else {
            setDynamicMaxPrice(Math.max(dynamicMaxPrice, roundedMax));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadListings(true);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters, priceRange]);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-6">
        <div className="flex flex-wrap gap-5 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
            <input type="text" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                   value={filters.locality} onChange={e => setFilters({...filters, locality: e.target.value})} placeholder="e.g. Andheri West" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BHK</label>
            <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                    value={filters.bhk} onChange={e => setFilters({...filters, bhk: e.target.value})}>
              <option value="">Any</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5+ BHK</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
            <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                    value={filters.property_type} onChange={e => setFilters({...filters, property_type: e.target.value})}>
              <option value="">Any</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="independent floor">Independent Floor</option>
              <option value="independent house">Independent House</option>
              <option value="plot">Plot</option>
              <option value="land">Land</option>
              <option value="studio">Studio</option>
              <option value="duplex">Duplex</option>
              <option value="penthouse">Penthouse</option>
            </select>
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

        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <div className="flex justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range (Dynamic)</label>
              <span className="text-xs font-bold text-indigo-600">{formatter.format(priceRange[0])} - {priceRange[1] >= dynamicMaxPrice ? 'Any' : formatter.format(priceRange[1])}</span>
            </div>
            <div className="px-2 pt-2 pb-1">
              <Slider 
                range 
                min={0} 
                max={dynamicMaxPrice} 
                step={100000} 
                value={priceRange} 
                onChange={(val: any) => setPriceRange(val)} 
                trackStyle={[{ backgroundColor: '#4f46e5' }]} 
                handleStyle={[{ borderColor: '#4f46e5', backgroundColor: '#4f46e5' }, { borderColor: '#4f46e5', backgroundColor: '#4f46e5' }]} 
              />
            </div>
            <div className="flex gap-4 mt-4">
              <input type="number" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border transition-all" 
                   value={priceRange[0]} onChange={e => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])} placeholder="Min Price" />
              <input type="number" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border transition-all" 
                   value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value) || dynamicMaxPrice])} placeholder="Max Price" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, idx) => (
          <Link key={`${listing.listing_id}-${idx}`} to={`/listings/${listing.listing_id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden block border border-slate-100 flex flex-col hover:-translate-y-1">
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
                    {listing.property_type}
                  </div>
                  {listing.property_type !== 'plot' && listing.property_type !== 'land' && (
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase">
                      {listing.furnishing}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {listing.bedroom > 0 ? `${listing.bedroom} BHK ${listing.property_type}` : listing.property_type.charAt(0).toUpperCase() + listing.property_type.slice(1)} in {listing.apartment_name || 'Independent'}
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

      {hasMore && (
        <div className="text-center mt-12 pb-12">
          <button 
            onClick={() => loadListings(false)} 
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
