import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';
import { Link } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useGlobalData } from '../GlobalContext';

export default function Browse() {
  const { stats } = useGlobalData();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [filters, setFilters] = useState({
    locality: '',
    bhk: '',
    property_type: '',
    furnishing: '',
    sort_by: '',
    order: 'asc'
  });
  
  // Price slider state
  const [dynamicMinPrice, setDynamicMinPrice] = useState(0);
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(100000000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]); // initial


  const loadListings = async () => {
    setLoading(true);
    const currentOffset = (page - 1) * limit;
    
    try {
      const params: any = { offset: currentOffset, limit };
      if (filters.locality) params.locality = filters.locality.toLowerCase().trim();
      if (filters.bhk) params.bhk = parseInt(filters.bhk);
      if (filters.property_type) params.property_type = filters.property_type;
      if (priceRange[0] > dynamicMinPrice) params.min_price = priceRange[0];
      if (priceRange[1] < dynamicMaxPrice) params.max_price = priceRange[1];
      if (filters.furnishing) params.furnishing = filters.furnishing;
      if (filters.sort_by) {
        params.sort_by = filters.sort_by;
        params.order = filters.order;
      }

      const res = await api.get('/v1/listings', { params });
      const rawResults = res.data.results || [];
      
      let valid = rawResults.map(cleanListing).filter(isValidListing);

      setListings(valid);
      
      const isFiltering = filters.locality || filters.bhk || filters.property_type || priceRange[0] !== dynamicMinPrice || priceRange[1] !== dynamicMaxPrice;
      if (!isFiltering && stats?.totalListingRecords) {
        setTotal(stats.totalListingRecords);
      } else if (isFiltering && stats?.rawListings) {
        // Calculate EXACT total manually since backend total is wrong for filtered queries
        let count = 0;
        for (const l of stats.rawListings) {
          if (filters.locality && !l.locality.toLowerCase().includes(filters.locality.toLowerCase())) continue;
          if (filters.bhk && l.bedroom !== parseInt(filters.bhk)) continue;
          if (filters.property_type && l.property_type !== filters.property_type) continue;
          if (priceRange[0] !== dynamicMinPrice && l.price < priceRange[0]) continue;
          if (priceRange[1] !== dynamicMaxPrice && l.price > priceRange[1]) continue;
          count++;
        }
        setTotal(count);
      } else {
        setTotal(res.data.total || 0);
      }

      // Only update slider limits if we're on page 1 and no price filter is applied
      if (page === 1 && valid.length > 0) {
        const computedMax = Math.max(...valid.map((l: any) => l.price));
        const computedMin = Math.min(...valid.map((l: any) => l.price));
        
        const roundedMax = Math.ceil(computedMax / 1000000) * 1000000;
        const roundedMin = Math.floor(computedMin / 100000) * 100000;
        
        const nextMin = roundedMin < dynamicMinPrice || dynamicMinPrice === 0 ? roundedMin : dynamicMinPrice;
        const nextMax = roundedMax > dynamicMaxPrice ? roundedMax : dynamicMaxPrice;
        
        if (dynamicMinPrice !== nextMin) setDynamicMinPrice(nextMin);
        if (dynamicMaxPrice !== nextMax) setDynamicMaxPrice(nextMax);
        
        setPriceRange(prev => {
            const newMin = prev[0] <= dynamicMinPrice || prev[0] === 0 ? nextMin : prev[0];
            const newMax = prev[1] >= dynamicMaxPrice || prev[1] === 100000000 ? nextMax : prev[1];
            if (prev[0] === newMin && prev[1] === newMax) return prev;
            return [newMin, newMax];
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [page]);

  useEffect(() => {
    const isFiltering = filters.locality || filters.bhk || filters.property_type || priceRange[0] !== dynamicMinPrice || priceRange[1] !== dynamicMaxPrice;
    if (!isFiltering && stats?.totalListingRecords) {
      setTotal(stats.totalListingRecords);
    } else if (isFiltering && stats?.rawListings) {
      let count = 0;
      for (const l of stats.rawListings) {
        if (filters.locality && !l.locality.toLowerCase().includes(filters.locality.toLowerCase())) continue;
        if (filters.bhk && l.bedroom !== parseInt(filters.bhk)) continue;
        if (filters.property_type && l.property_type !== filters.property_type) continue;
        if (priceRange[0] !== dynamicMinPrice && l.price < priceRange[0]) continue;
        if (priceRange[1] !== dynamicMaxPrice && l.price > priceRange[1]) continue;
        count++;
      }
      setTotal(count);
    }
  }, [stats]);

  const handleSearch = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadListings();
    }
  };

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

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
            <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                    value={filters.sort_by} onChange={e => setFilters({...filters, sort_by: e.target.value})}>
              <option value="">Relevance</option>
              <option value="price">Price</option>
              <option value="carpet_area">Carpet Area</option>
              <option value="posted_at">Date Posted</option>
              <option value="bedroom">Bedrooms</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order</label>
            <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                    value={filters.order} onChange={e => setFilters({...filters, order: e.target.value})} disabled={!filters.sort_by}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 h-[46px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range</label>
              <div className="px-2 pt-1 pb-2">
                <Slider 
                  range 
                  min={dynamicMinPrice} 
                  max={dynamicMaxPrice} 
                  step={100000} 
                  value={priceRange} 
                  onChange={(val: any) => setPriceRange(val)} 
                  styles={{
                    track: { backgroundColor: '#4f46e5', height: 6 },
                    handle: { borderColor: '#4f46e5', height: 18, width: 18, marginTop: -6, backgroundColor: '#fff', opacity: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                    rail: { backgroundColor: '#e2e8f0', height: 6 }
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                <span>{formatter.format(priceRange[0])}</span>
                <span>{formatter.format(priceRange[1])}{priceRange[1] >= dynamicMaxPrice ? '+' : ''}</span>
              </div>
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
          <Link key={`${listing.listing_id}-${idx}`} to={`/listings/${listing.listing_id}`} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden block border border-slate-100 flex flex-col hover:-translate-y-1">
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

      <div className="flex justify-between items-center mt-12 pb-12">
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{listings.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> listings
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 flex items-center text-sm font-medium text-slate-900 bg-slate-100 rounded-lg">
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / limit) || loading}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
