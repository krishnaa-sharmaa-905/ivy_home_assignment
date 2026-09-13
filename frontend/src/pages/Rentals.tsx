import { useState, useEffect } from 'react';
import { api, cleanListing, isValidListing } from '../api';
import { Link } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function Rentals() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [localityFilter, setLocalityFilter] = useState('');
  const [dynamicMinPrice, setDynamicMinPrice] = useState(0);
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(500000); // 5L
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  
  const [sortBy, setSortBy] = useState('');
  const [order, setOrder] = useState('asc');

  const loadRentals = async () => {
    setLoading(true);
    const currentOffset = (page - 1) * limit;
    
    try {
      const params: any = { offset: currentOffset, limit };
      if (localityFilter) params.locality = localityFilter.toLowerCase().trim();
      if (priceRange[0] > dynamicMinPrice) params.min_price = priceRange[0];
      if (priceRange[1] < dynamicMaxPrice) params.max_price = priceRange[1];
      if (sortBy) {
        params.sort_by = sortBy;
        params.order = order;
      }
      
      const res = await api.get('/v1/rentals', { params });
      const rawResults = res.data.results || [];
      
      let valid = rawResults.map(cleanListing).filter(isValidListing);

      setRentals(valid);
      setTotal(res.data.total || 0);

      if (page === 1 && valid.length > 0) {
        const computedMax = Math.max(...valid.map((l: any) => l.price));
        const computedMin = Math.min(...valid.map((l: any) => l.price));
        
        const roundedMax = Math.ceil(computedMax / 10000) * 10000;
        const roundedMin = Math.floor(computedMin / 5000) * 5000;
        
        const nextMin = roundedMin < dynamicMinPrice || dynamicMinPrice === 0 ? roundedMin : dynamicMinPrice;
        const nextMax = roundedMax > dynamicMaxPrice ? roundedMax : dynamicMaxPrice;
        
        setDynamicMinPrice(nextMin);
        setDynamicMaxPrice(nextMax);
        
        setPriceRange(prev => [
            prev[0] <= dynamicMinPrice || prev[0] === 0 ? nextMin : prev[0],
            prev[1] >= dynamicMaxPrice ? nextMax : prev[1]
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [localityFilter, priceRange, sortBy, order]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadRentals();
    }, 400);
    return () => clearTimeout(handler);
  }, [page, localityFilter, priceRange, sortBy, order]);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="md:w-1/3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rentals</h2>
            <p className="mt-2 text-slate-500">Discover rental properties across the city.</p>
          </div>
          <div className="w-full md:w-2/3 flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
              <input type="text" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                     value={localityFilter} onChange={e => setLocalityFilter(e.target.value)} placeholder="Exact locality..." />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
              <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                      value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="">Relevance</option>
                <option value="price">Rent Price</option>
                <option value="carpet_area">Carpet Area</option>
                <option value="posted_at">Date Posted</option>
                <option value="bedroom">Bedrooms</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order</label>
              <select className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all"
                      value={order} onChange={e => setOrder(e.target.value)} disabled={!sortBy}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200/60">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Rent Range / mo</label>
          <div className="px-2 pt-1 pb-2">
            <Slider 
              range 
              min={dynamicMinPrice} 
              max={dynamicMaxPrice} 
              step={5000} 
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
                  {rental.property_type !== 'plot' && rental.property_type !== 'land' && (
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase">
                      {rental.furnishing}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {rental.bedroom > 0 ? `${rental.bedroom} BHK ${rental.property_type}` : rental.property_type.charAt(0).toUpperCase() + rental.property_type.slice(1)} in {rental.apartment_name || 'Independent'}
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
      
      <div className="flex justify-between items-center mt-12 pb-12">
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{rentals.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> rentals
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
