import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, cleanProject } from '../api';
import { ArrowLeft } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/v1/projects/${id}`);
        setProject(cleanProject(res.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-slate-500 font-medium">Loading project details...</div>;
  if (!project) return <div className="text-center py-12 text-slate-500 font-medium">Project not found.</div>;

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <button onClick={() => navigate(-1)} className="relative z-10 flex items-center text-indigo-200 hover:text-white mb-8 transition-colors text-sm font-bold tracking-wider uppercase">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full text-xs font-bold tracking-wider uppercase shadow-sm border border-white/10">
              {project.project_id}
            </div>
            {project.project_status && (
              <div className="px-3 py-1 bg-green-500/20 backdrop-blur text-green-300 rounded-full text-xs font-bold tracking-wider uppercase border border-green-500/30">
                {project.project_status}
              </div>
            )}
            {project.rera_number && (
              <div className="px-3 py-1 bg-purple-500/20 backdrop-blur text-purple-300 rounded-full text-xs font-bold tracking-wider uppercase border border-purple-500/30">
                RERA: {project.rera_number}
              </div>
            )}
          </div>
          <h3 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-sm mb-2">
            {project.apartment_name || project.name}
          </h3>
          <p className="text-lg text-indigo-200 font-medium tracking-wide">
            Developed by <span className="text-white font-bold">{project.developer_name || 'Independent Developer'}</span>
          </p>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Locality</p>
            <span className="text-2xl font-extrabold text-slate-900 capitalize">{project.locality}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-50 px-6 py-4 rounded-2xl text-center border border-slate-100 min-w-[140px]">
              <span className="block text-2xl font-bold text-slate-900">{project.total_listings}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">Total Listings</span>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-2xl text-center border border-slate-100 min-w-[140px]">
              <span className="block text-2xl font-bold text-indigo-600">{project.avg_price_per_sqft ? `₹${project.avg_price_per_sqft}` : 'N/A'}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 block">Avg / Sq.Ft</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{project.total_units || 'N/A'}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Towers</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{project.total_towers || 'N/A'}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Floors</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{project.total_floors || 'N/A'}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Possession Date</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">{project.possession_date ? new Date(project.possession_date).toLocaleDateString() : 'N/A'}</dd>
          </div>

          <div className="col-span-2">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Area Range</dt>
            <dd className="mt-2 text-lg font-semibold text-slate-900">
              {project.min_area_sqft || 0} - {project.max_area_sqft || 0} Sq.Ft
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</dt>
            <dd className="mt-2 text-lg font-semibold text-indigo-600">
              {project.price_min > 0 ? formatter.format(project.price_min) : 'N/A'} - {project.price_max > 0 ? formatter.format(project.price_max) : 'N/A'}
            </dd>
          </div>

          {project.amenities && project.amenities.length > 0 && (
            <div className="col-span-2 sm:col-span-4 mt-4">
              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Amenities</dt>
              <dd className="flex flex-wrap gap-2">
                {project.amenities.map((amenity: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium capitalize border border-slate-200">
                    {amenity}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
