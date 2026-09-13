import { useGlobalData } from '../GlobalContext';

export default function Insights() {
  const { stats, loading, progress, error } = useGlobalData();

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-slate-700 font-semibold text-lg">Computing live insights...</p>
        <p className="text-slate-400 text-sm mt-1">{progress}</p>
        <p className="text-slate-300 text-xs mt-1">Pages fetched in parallel - results will appear shortly</p>
      </div>
    </div>
  );

  if (error) return <div className="text-center py-12 text-red-500 font-medium">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-10 pb-12">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 shadow-xl text-white">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">API Insights &amp; Discoveries</h2>
        <p className="text-indigo-100 text-lg max-w-2xl">
          Live analytics from{' '}
          <span className="font-bold text-white">{stats.totalListingRecords.toLocaleString()}</span> listings,{' '}
          <span className="font-bold text-white">{stats.totalRentals.toLocaleString()}</span> rentals and{' '}
          <span className="font-bold text-white">{stats.totalProjects.toLocaleString()}</span> projects -
          fetched with parallel pagination and computed in the background.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Listings"         value={stats.totalListingRecords.toLocaleString()}        subtitle="All available listings"    color="bg-blue-50 text-blue-700" />
        <StatCard title="Unique Properties"      value={stats.uniqueProperties.toLocaleString()}           subtitle="Deduplicated real properties"                 color="bg-indigo-50 text-indigo-700" />
        <StatCard title="Active Listings"        value={stats.activeListings.toLocaleString()}             subtitle="is_live = true (API sends inactive ones too)"  color="bg-emerald-50 text-emerald-700" />
        <StatCard title="Total Monthly Rent"     value={formatter.format(stats.totalMonthlyRent)}          subtitle="Sum of all rental prices city-wide"           color="bg-purple-50 text-purple-700" />
        <StatCard title="Avg 2BHK Price / SqFt" value={`₹${stats.avgPricePerSqft2bhk.toLocaleString()}`} subtitle="Excluding fake & corrupt listings"            color="bg-amber-50 text-amber-700" />
        <StatCard title="Costliest Project"      value={formatter.format(stats.costliestProject?.price_max ?? 0)} subtitle={`Project ID: ${stats.costliestProject?.project_id ?? 'N/A'}`} color="bg-rose-50 text-rose-700" />
        <StatCard title="7-Day Listing Volume"   value={stats.listingsLast7Days.toLocaleString()}          subtitle="Posted Sept 3-10 (anchored reference)"        color="bg-cyan-50 text-cyan-700" />
        <StatCard title="Corrupt Listings"       value={stats.corruptCount.toLocaleString()}               subtitle="Impossible geometry, price, floor or coords"  color="bg-red-50 text-red-700" />
        <StatCard title="Fake Listings"          value={stats.fakeCount.toLocaleString()}                  subtitle="Scam / bait-and-switch descriptions"          color="bg-orange-50 text-orange-700" />
        <StatCard title="Projects: Wrong Count"  value={stats.wrongCountProjects.toLocaleString()}         subtitle="total_listings disagrees with actual count"   color="bg-slate-100 text-slate-700" />
        <StatCard title="Total Rentals"          value={stats.totalRentals.toLocaleString()}               subtitle="Rental listings city-wide"                   color="bg-teal-50 text-teal-700" />
        <StatCard title="Total Projects"         value={stats.totalProjects.toLocaleString()}              subtitle="Builder projects in the city"                color="bg-violet-50 text-violet-700" />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle: string; color: string }) {
  return (
    <div className="p-8 rounded-3xl shadow-sm border border-slate-100 bg-white flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-1">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <div>
        <p className={`text-4xl font-extrabold ${color.split(' ')[1]} mb-2`}>{value}</p>
        <p className="text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
