import { useState, useEffect } from 'react';
import { api, cleanProject } from '../api';
import { useGlobalData } from '../GlobalContext';

export default function Projects() {
  const { stats } = useGlobalData();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [localityFilter, setLocalityFilter] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    const currentOffset = (page - 1) * limit;
    
    try {
      const params: any = { offset: currentOffset, limit };
      if (localityFilter) params.locality = localityFilter.toLowerCase().trim();
      
      const res = await api.get('/v1/projects', { params });
      const rawResults = res.data.results || [];
      const valid = rawResults.map(cleanProject);

      setProjects(valid);
      if (!localityFilter && stats?.totalProjects) {
        setTotal(stats.totalProjects);
      } else {
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [page]);

  useEffect(() => {
    if (!localityFilter && stats?.totalProjects) {
      setTotal(stats.totalProjects);
    }
  }, [stats]);

  const handleSearch = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadProjects();
    }
  };

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h2>
            <p className="mt-2 text-slate-500">Explore large scale real estate developments.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto items-end">
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
              <input type="text" className="block w-full min-w-[250px] rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                     value={localityFilter} onChange={e => setLocalityFilter(e.target.value)} placeholder="Exact locality..." />
            </div>
            <div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, idx) => (
          <div key={`${project.project_id}-${idx}`} onClick={() => window.open(`/projects/${project.project_id}`, '_blank')} className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100 flex flex-col hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="p-8 flex-1 flex flex-col relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase shadow-sm border border-indigo-200">
                  {project.project_id}
                </div>
                {project.project_status && (
                  <div className="inline-flex items-center justify-center px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold tracking-wider uppercase border border-green-100">
                    {project.project_status}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {project.apartment_name || project.name}
                </h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">By {project.developer_name || 'Independent'}</p>
                <p className="text-base text-slate-500 capitalize flex items-center font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-3"></span>
                  {project.locality}
                </p>
              </div>

              <div className="mt-auto">
                <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Listings</span>
                    <span className="text-xl font-black text-slate-800">{project.total_listings}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Avg Price / Sqft</span>
                    <span className="text-lg font-bold text-slate-700">{project.avg_price_per_sqft ? `₹${project.avg_price_per_sqft}` : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Price Range</span>
                  <span className="text-lg font-extrabold text-indigo-600">
                    {project.price_min > 0 ? formatter.format(project.price_min) : 'N/A'} - {project.price_max > 0 ? formatter.format(project.price_max) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-12 pb-12">
        <p className="text-sm text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{projects.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> projects
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
