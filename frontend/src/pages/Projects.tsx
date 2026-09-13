import { useState, useEffect } from 'react';
import { api, cleanProject } from '../api';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadProjects = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await api.get('/v1/projects', { params: { offset, limit: 50 } });
      const rawResults = res.data.results || [];
      const newOffset = offset + rawResults.length;
      
      const valid = rawResults.map(cleanProject);

      setProjects(prev => [...prev, ...valid]);
      setOffset(newOffset);
      setHasMore(rawResults.length > 0 && newOffset < res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, idx) => (
          <div key={`${project.project_id}-${idx}`} className="bg-white rounded-lg shadow p-5">
            <h3 className="text-lg font-bold text-gray-900 truncate">{project.apartment_name}</h3>
            <p className="text-sm text-indigo-600 mb-2">{project.developer_name}</p>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-sm font-medium text-gray-700">
                Price: {formatter.format(project.price_min)} - {formatter.format(project.price_max)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2 capitalize">{project.locality}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">{project.total_units}</span> Units</div>
              <div className="capitalize">{project.project_status}</div>
              <div><span className="font-semibold">{project.total_listings}</span> Active Listings (Reported)</div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={() => loadProjects()} disabled={loading} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
