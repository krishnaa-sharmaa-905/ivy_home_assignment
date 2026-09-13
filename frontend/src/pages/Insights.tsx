import { useState, useEffect } from 'react';
import answersData from '../../../data/answers.json';
import findingsData from '../../../submission.json';

export default function Insights() {
  const [data, setData] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    setData(answersData);
    setFindings(findingsData.findings || []);
  }, []);

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (!data) return <div className="text-center py-12 text-slate-500 font-medium">Loading insights...</div>;

  return (
    <div className="space-y-10 pb-12">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 shadow-xl text-white">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">API Insights & Discoveries</h2>
        <p className="text-indigo-100 text-lg max-w-2xl">
          We computed the exact analytics demanded by the assignment by systematically scrubbing the dataset for corrupt listings and fraudulent properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Listings" value={data.total_listing_records.toLocaleString()} subtitle="Retrievable across all pages" color="bg-blue-50 text-blue-700" />
        <StatCard title="Unique Properties" value={data.unique_properties.toLocaleString()} subtitle="Deduplicated real properties" color="bg-indigo-50 text-indigo-700" />
        <StatCard title="Active Listings" value={data.active_listings.toLocaleString()} subtitle="Listings with is_live = true" color="bg-emerald-50 text-emerald-700" />
        
        <StatCard title="Monthly Rent (Andheri West)" value={formatter.format(data.total_monthly_rent)} subtitle="Sum of all rental prices" color="bg-purple-50 text-purple-700" />
        <StatCard title="Avg 2BHK Price/SqFt" value={`₹${data.avg_price_per_sqft_2bhk}`} subtitle="Excluding fake/corrupt data" color="bg-amber-50 text-amber-700" />
        <StatCard title="Costliest Project" value={formatter.format(data.costliest_project.price_max_inr)} subtitle={`Project ID: ${data.costliest_project.project_id}`} color="bg-rose-50 text-rose-700" />
        
        <StatCard title="7-Day Volume" value={data.listings_last_7_days.toLocaleString()} subtitle="Listings posted last week" color="bg-cyan-50 text-cyan-700" />
        <StatCard title="Corrupt Listings" value={data.corrupt_listing_ids.length} subtitle="Physically impossible properties" color="bg-red-50 text-red-700" />
        <StatCard title="Fake Listings" value={data.fake_listing_ids.length} subtitle="Scams and bait properties" color="bg-orange-50 text-orange-700" />
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-10 border-b border-slate-100 bg-slate-50">
          <h3 className="text-2xl font-bold text-slate-900">API Documentation Discrepancies</h3>
          <p className="mt-2 text-slate-500">The 16 structural lies we found while reverse-engineering the endpoints.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {findings.map((f, i) => (
            <div key={i} className="p-8 sm:p-10 hover:bg-slate-50/50 transition-colors">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wider uppercase">
                  {f.category}
                </div>
                <div className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                  {f.endpoint}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Documented Behavior</h4>
                  <p className="text-slate-700 leading-relaxed bg-red-50/50 p-4 rounded-xl border border-red-100/50">{f.documented}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actual Behavior</h4>
                  <p className="text-slate-900 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">{f.actual}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }: any) {
  return (
    <div className={`p-8 rounded-3xl shadow-sm border border-slate-100 bg-white flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-1`}>
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <div>
        <p className={`text-4xl font-extrabold ${color.split(' ')[1]} mb-2`}>{value}</p>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
