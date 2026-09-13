import { useState, useEffect } from 'react';
import { api, cleanListing, cleanProject, isCorrupt, isFake } from '../api';

// ─── Fast parallel fetcher ────────────────────────────────────────────────────
// 1. Fetches page 0 to learn data.total (unreliable lower-bound)
// 2. Fires ALL known remaining pages simultaneously via Promise.all
// 3. Sequentially probes beyond data.total until the API returns empty
// Net result: ~10–20× faster than sequential pagination
async function fetchAllPagesFast(endpoint: string): Promise<any[]> {
  const limit = 50;

  // Step 1 — first page (also tells us the API's claimed total)
  const firstRes = await api.get(endpoint, { params: { offset: 0, limit } });
  const firstResults: any[] = firstRes.data.results || [];
  if (firstResults.length === 0) return [];

  const apiTotal: number = firstRes.data.total || 0;

  // Step 2 — fire all remaining "known" pages in parallel
  const knownPageCount = Math.max(1, Math.ceil(apiTotal / limit));
  const parallelOffsets = Array.from(
    { length: knownPageCount - 1 },
    (_, i) => (i + 1) * limit
  );
  const parallelPages = await Promise.all(
    parallelOffsets.map(offset =>
      api.get(endpoint, { params: { offset, limit } }).then(r => r.data.results || [])
    )
  );

  // Step 3 — probe beyond data.total (API under-reports real count)
  let probeOffset = knownPageCount * limit;
  const extraResults: any[] = [];
  while (true) {
    const probeRes = await api.get(endpoint, { params: { offset: probeOffset, limit } });
    const results: any[] = probeRes.data.results || [];
    if (results.length === 0) break;
    extraResults.push(...results);
    const hasMore = probeRes.data.has_more ?? results.length === limit;
    if (!hasMore) break;
    probeOffset += results.length;
  }

  return [...firstResults, ...parallelPages.flat(), ...extraResults];
}

// ─── Stats computation ────────────────────────────────────────────────────────
function computeStats(rawListings: any[], rawRentals: any[], rawProjects: any[]) {
  const listings = rawListings.map(cleanListing);
  const projects = rawProjects.map(cleanProject);

  const totalListingRecords = listings.length;

  const uniqueKeys = new Set(listings.map((l: any) =>
    `${l.locality}|${l.apartment_name}|${l.property_type}|${l.bedroom}|${l.floor}|${Math.round(l.carpet_area)}`
  ));
  const uniqueProperties = uniqueKeys.size;

  const activeListings = listings.filter((l: any) => l.is_live === true).length;

  const corruptIds = listings.filter(isCorrupt).map((l: any) => l.listing_id);
  const fakeIds    = listings.filter(isFake).map((l: any) => l.listing_id);
  const excludeSet = new Set([...corruptIds, ...fakeIds]);

  const totalMonthlyRent = rawRentals.reduce((s: number, r: any) => s + (r.price || 0), 0);

  const valid2bhk = listings.filter((l: any) =>
    l.is_live && l.bedroom === 2 && !excludeSet.has(l.listing_id) && l.carpet_area > 0
  );
  const avgPricePerSqft2bhk = valid2bhk.length
    ? parseFloat((valid2bhk.reduce((s: number, l: any) => s + l.price / l.carpet_area, 0) / valid2bhk.length).toFixed(2))
    : 0;

  const costliestProject = projects.reduce(
    (max: any, p: any) => (p.price_max > (max?.price_max ?? 0) ? p : max),
    projects[0]
  );

  // REFERENCE = 2026-09-10T00:00:00+05:30 (fixed anchor per assignment)
  const REFERENCE    = new Date('2026-09-10T00:00:00+05:30').getTime();
  const sevenDaysAgo = REFERENCE - 7 * 24 * 60 * 60 * 1000;
  const listingsLast7Days = listings.filter((l: any) => {
    const t = new Date(l.posted_at).getTime();
    return t >= sevenDaysAgo && t < REFERENCE;
  }).length;

  const projectCounts: Record<string, number> = {};
  listings.forEach((l: any) => {
    if (l.project_id) projectCounts[l.project_id] = (projectCounts[l.project_id] || 0) + 1;
  });
  const wrongCountProjects = projects.filter(
    (p: any) => (projectCounts[p.project_id] || 0) !== p.total_listings
  ).length;

  return {
    totalListingRecords,
    uniqueProperties,
    activeListings,
    corruptCount: corruptIds.length,
    fakeCount: fakeIds.length,
    totalMonthlyRent,
    avgPricePerSqft2bhk,
    costliestProject,
    listingsLast7Days,
    wrongCountProjects,
    totalRentals: rawRentals.length,
    totalProjects: projects.length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
let memoryCache: any = null;

export default function Insights() {
  const [stats, setStats] = useState<any>(memoryCache);
  const [loading, setLoading] = useState(!memoryCache);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (memoryCache) return; // Skip if already computed in this session

    async function fetchAndCompute() {
      try {
        setLoading(true);

        // Fetch all three endpoints in parallel
        setProgress('Fetching all data in parallel...');
        const [rawListings, rawRentals, rawProjects] = await Promise.all([
          fetchAllPagesFast('/v1/listings'),
          fetchAllPagesFast('/v1/rentals'),
          fetchAllPagesFast('/v1/projects'),
        ]);

        setProgress('Computing analytics...');
        const computed = computeStats(rawListings, rawRentals, rawProjects);
        memoryCache = computed;
        setStats(computed);
      } catch (e: any) {
        setError('Failed to load insights: ' + (e.message || 'unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchAndCompute();
  }, []); // ← empty deps: runs once per mount, cache prevents re-fetch on navigation

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-slate-700 font-semibold text-lg">Computing live insights…</p>
        <p className="text-slate-400 text-sm mt-1">{progress}</p>
        <p className="text-slate-300 text-xs mt-1">Pages fetched in parallel — results will appear shortly</p>
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
          <span className="font-bold text-white">{stats.totalProjects.toLocaleString()}</span> projects —
          fetched with parallel pagination and cached for this session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Listings"         value={stats.totalListingRecords.toLocaleString()}        subtitle="All available listings"    color="bg-blue-50 text-blue-700" />
        <StatCard title="Unique Properties"      value={stats.uniqueProperties.toLocaleString()}           subtitle="Deduplicated real properties"                 color="bg-indigo-50 text-indigo-700" />
        <StatCard title="Active Listings"        value={stats.activeListings.toLocaleString()}             subtitle="is_live = true (API sends inactive ones too)"  color="bg-emerald-50 text-emerald-700" />
        <StatCard title="Total Monthly Rent"     value={formatter.format(stats.totalMonthlyRent)}          subtitle="Sum of all rental prices city-wide"           color="bg-purple-50 text-purple-700" />
        <StatCard title="Avg 2BHK Price / SqFt" value={`₹${stats.avgPricePerSqft2bhk.toLocaleString()}`} subtitle="Excluding fake & corrupt listings"            color="bg-amber-50 text-amber-700" />
        <StatCard title="Costliest Project"      value={formatter.format(stats.costliestProject?.price_max ?? 0)} subtitle={`Project ID: ${stats.costliestProject?.project_id ?? 'N/A'}`} color="bg-rose-50 text-rose-700" />
        <StatCard title="7-Day Listing Volume"   value={stats.listingsLast7Days.toLocaleString()}          subtitle="Posted Sept 3–10 (anchored reference)"        color="bg-cyan-50 text-cyan-700" />
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
