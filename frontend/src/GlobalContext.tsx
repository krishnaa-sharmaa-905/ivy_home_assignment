import { createContext, useContext, useState, useEffect } from 'react';
import { api, cleanListing, cleanProject, isCorrupt, isFake } from './api';

export const GlobalContext = createContext<any>(null);

async function fetchAllPagesFast(endpoint: string): Promise<any[]> {
  const limit = 50;
  let combined: any[] = [];
  let currentOffset = 0;
  const CHUNK_SIZE = 20; // Fetch 20 pages (1000 items) in parallel

  while (true) {
    const offsets = Array.from({ length: CHUNK_SIZE }, (_, i) => currentOffset + i * limit);
    const promises = offsets.map(offset => 
      api.get(endpoint, { params: { offset, limit } }).then(r => r.data.results || [])
    );
    
    const results = await Promise.all(promises);
    
    let chunkFinished = false;
    for (const resArray of results) {
      combined.push(...resArray);
      if (resArray.length < limit) {
        chunkFinished = true;
        break;
      }
    }
    
    if (chunkFinished) {
      break;
    }
    
    currentOffset += CHUNK_SIZE * limit;
  }

  return combined;
}

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
  
  const brokerPhones: Record<string, Set<string>> = {};
  for (const l of listings) {
    if (l.posted_by_name && l.posted_by_contact) {
      if (!brokerPhones[l.posted_by_name]) brokerPhones[l.posted_by_name] = new Set();
      brokerPhones[l.posted_by_name].add(l.posted_by_contact);
    }
  }

  const fakeIds = listings.filter((l: any) => {
    if (isFake(l)) return true;
    if (l.posted_by_name && brokerPhones[l.posted_by_name] && brokerPhones[l.posted_by_name].size > 1) return true;
    return false;
  }).map((l: any) => l.listing_id);

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
  const wrongCountProjectIds = projects.filter(
    (p: any) => (projectCounts[p.project_id] || 0) !== p.total_listings
  ).map((p: any) => p.project_id);

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
    wrongCountProjects: wrongCountProjectIds.length,
    wrongCountProjectIds,
    totalRentals: rawRentals.length,
    totalProjects: projects.length,
    corruptIds,
    fakeIds,
  };
}

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        setProgress('Fetching all data in parallel...');
        const [rawListings, rawRentals, rawProjects] = await Promise.all([
          fetchAllPagesFast('/v1/listings'),
          fetchAllPagesFast('/v1/rentals'),
          fetchAllPagesFast('/v1/projects'),
        ]);

        setProgress('Computing analytics...');
        const computed = computeStats(rawListings, rawRentals, rawProjects);
        setStats({
          ...computed,
          rawListings: rawListings.map(cleanListing),
          rawRentals,
          rawProjects: rawProjects.map(cleanProject)
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <GlobalContext.Provider value={{ stats, loading, progress, error }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalData() {
  return useContext(GlobalContext);
}
