const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
let listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf8'));
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf8'));

// Fix sqm to sqft for magichomes
listings.forEach(l => {
  if (l.website === 'magichomes' && l.price > 0 && l.carpet_area > 0) {
    if (l.price / l.carpet_area > 100000) {
      l.carpet_area = l.carpet_area * 10.7639;
      l.super_built_up_area = l.super_built_up_area * 10.7639;
    }
  }
});

// 1. total_listing_records
const total_listing_records = listings.length;

// 2. unique_properties
const properties = new Set(listings.map(l => `${l.locality}|${l.apartment_name}|${l.property_type}|${l.bedroom}|${l.floor}|${Math.round(l.carpet_area)}`));
const unique_properties = properties.size;

// 3. active_listings
const active_listings = listings.filter(l => l.is_live === true).length;

// 4. corrupt_listing_ids
const corrupt = listings.filter(l => {
  if (l.carpet_area > l.super_built_up_area) return true;
  if (l.price <= 0 || l.carpet_area <= 0) return true;
  if (l.floor > l.total_floors) return true;
  if (l.bathroom > l.bedroom + 4) return true; 
  if (l.latitude < 18 || l.latitude > 20 || l.longitude < 72 || l.longitude > 74) return true;
  return false;
});
const corrupt_listing_ids = corrupt.map(l => l.listing_id).sort();

// 5. total_monthly_rent in "andheri west"
const total_monthly_rent = rentals
  .filter(r => r.locality === 'andheri west')
  .reduce((sum, r) => sum + r.price, 0);

// 9. fake_listing_ids
const fake_listing_ids = listings
  .filter(l => /visit only|below market|booking amount/i.test(l.description)) 
  .map(l => l.listing_id).sort();

// 6. avg_price_per_sqft_2bhk
const excludeIds = new Set([...corrupt_listing_ids, ...fake_listing_ids]);
const valid_2bhk = listings.filter(l => l.is_live && l.bedroom === 2 && !excludeIds.has(l.listing_id));
const avg_price_per_sqft_2bhk = valid_2bhk.length ? parseFloat((valid_2bhk.reduce((sum, l) => sum + (l.price / l.carpet_area), 0) / valid_2bhk.length).toFixed(2)) : 0;

// 7. costliest_project
let costliest = projects[0];
for (const p of projects) {
  if (p.price_max > costliest.price_max) costliest = p;
}
const costliest_project = {
  project_id: costliest.project_id,
  price_max_inr: Math.round(costliest.price_max * 10000000)
};

// 8. listings_last_7_days
const refTime = new Date('2026-09-10T00:00:00+05:30').getTime();
const sevenDaysBefore = refTime - (7 * 24 * 60 * 60 * 1000);
const listings_last_7_days = listings.filter(l => {
  const t = new Date(l.posted_at).getTime();
  return t >= sevenDaysBefore && t < refTime;
}).length;

// 10. projects_with_wrong_listing_count
const projectListingCounts = {};
for (const l of listings) {
  if (l.project_id) {
    projectListingCounts[l.project_id] = (projectListingCounts[l.project_id] || 0) + 1;
  }
}
let projects_with_wrong_listing_count = 0;
for (const p of projects) {
  const actual = projectListingCounts[p.project_id] || 0;
  if (actual !== p.total_listings) {
    projects_with_wrong_listing_count++;
  }
}

console.log(JSON.stringify({
  total_listing_records,
  unique_properties,
  active_listings,
  corrupt_listing_ids,
  total_monthly_rent,
  avg_price_per_sqft_2bhk,
  costliest_project,
  listings_last_7_days,
  fake_listing_ids,
  projects_with_wrong_listing_count
}, null, 2));
