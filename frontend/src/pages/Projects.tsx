import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, cleanProject } from '../api';

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [localityFilter, setLocalityFilter] = useState('');
  const [idFilter, setIdFilter] = useState(searchParams.get('id') || '');

  const loadProjects = async (reset = false) => {
    if (!reset && loading) return;
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      if (idFilter) {
        // Fetch single project
        const res = await api.get(`/v1/projects/${idFilter}`);
        const valid = [cleanProject(res.data)];
        setProjects(valid);
        setHasMore(false);
      } else {
        const params: any = { offset: currentOffset, limit: 50 };
        if (localityFilter) params.locality = localityFilter.toLowerCase();
        
        const res = await api.get('/v1/projects', { params });
        const rawResults = res.data.results || [];
        const newOffset = currentOffset + rawResults.length;
        
        const valid = rawResults.map(cleanProject);

        setProjects(prev => reset ? valid : [...prev, ...valid]);
        setOffset(newOffset);
        setHasMore(rawResults.length > 0 && newOffset < res.data.total);
      }
    } catch (err) {
      console.error(err);
      if (reset) setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadProjects(true);
      if (idFilter) {
        setSearchParams({ id: idFilter });
      } else {
        setSearchParams({});
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localityFilter, idFilter]);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h2>
            <p className="mt-2 text-slate-500">Explore large scale real estate developments.</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project ID</label>
              <input type="text" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                     value={idFilter} onChange={e => setIdFilter(e.target.value)} placeholder="e.g. PRJ-123" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locality</label>
              <input type="text" className="block w-full rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border transition-all" 
                     value={localityFilter} onChange={e => setLocalityFilter(e.target.value)} placeholder="e.g. Andheri" disabled={!!idFilter} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, idx) => (
          <div key={`${project.project_id}-${idx}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col hover:-translate-y-1">
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
                    {project.project_id}
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold tracking-wider uppercase">
                    RERA: {project.rera_number || 'N/A'}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-slate-500 capitalize flex items-center">
                  <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                  {project.locality}
                </p>
              </div>
              <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Total Listings</span>
                  <span className="font-bold text-slate-900">{project.total_listings}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Price Range</span>
                  <span className="font-bold text-indigo-600">{formatter.format(project.price_min)} - {formatter.format(project.price_max)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center mt-12 pb-12">
          <button 
            onClick={() => loadProjects()} 
            disabled={loading}
            className="px-8 py-3 border border-transparent text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? 'Loading...' : 'Load More Projects'}
          </button>
        </div>
      )}
      {!hasMore && projects.length > 0 && (
        <p className="text-center text-slate-500 mt-12 pb-12 font-medium">You've reached the end of the projects.</p>
      )}
    </div>
  );
}
