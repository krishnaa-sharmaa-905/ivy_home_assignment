const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
let listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf8'));
const rentals = JSON.parse(fs.readFileSync(path.join(dataDir, 'rentals.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(dataDir, 'projects.json'), 'utf8'));

// Fix sqm to sqft for magichomes listings
// Evidence: magichomes reports carpet_area in sqm; price/sqm ratio > 100k is the giveaway
listings.forEach(l => {
  if (l.website === 'magichomes' && l.price > 0 && l.carpet_area > 0) {
    if (l.price / l.carpet_area > 100000) {
      l.carpet_area = Math.round(l.carpet_area * 10.7639);
      l.super_built_up_area = Math.round(l.super_built_up_area * 10.7639);
    }
  }
});

// ── 1. total_listing_records
const total_listing_records = listings.length;

// ── 2. unique_properties
// Deduplicate by composite key: locality + apartment_name + type + bedroom + floor + carpet_area
const propertyKeys = new Set(
  listings.map(l =>
    `${l.locality}|${l.apartment_name}|${l.property_type}|${l.bedroom}|${l.floor}|${Math.round(l.carpet_area)}`
  )
);
const unique_properties = propertyKeys.size;

// ── 3. active_listings
// API sends inactive listings too (is_live: false) despite docs claiming otherwise
const active_listings = listings.filter(l => l.is_live === true).length;

// ── 4. corrupt_listing_ids
// A listing is corrupt if any of these physical impossibilities are true:
const corrupt = listings.filter(l => {
  if (l.carpet_area > l.super_built_up_area) return true;   // impossible geometry
  if (l.price <= 0 || l.carpet_area <= 0) return true;      // zero/negative price or area
  if (l.floor > l.total_floors) return true;                 // floor exceeds building height
  if (l.bathroom > l.bedroom + 4) return true;               // absurd bathroom count
  // lat/lng outside Mumbai bounding box (city_id 5)
  if (l.latitude < 18 || l.latitude > 20 || l.longitude < 72 || l.longitude > 74) return true;
  return false;
});
const corrupt_listing_ids = corrupt.map(l => l.listing_id).sort();

// ── 5. total_monthly_rent
// Sum of monthly rent across all retrievable rental records in assigned locality
const assignedLocality = (process.env.ASSIGNED_LOCALITY || '').toLowerCase();
const localRentals = rentals.filter(r => r.locality.toLowerCase() === assignedLocality);
const total_monthly_rent = localRentals.reduce((sum, r) => sum + r.price, 0);

// ── 9. fake_listing_ids
const fake = listings.filter(l =>
  /visit only|below market|booking amount/i.test(l.description)
);
const fake_listing_ids = fake.map(l => l.listing_id).sort();

// ── 6. avg_price_per_sqft_2bhk
const fake_listing_ids_set = new Set(fake_listing_ids);
const excludeIds = new Set([...corrupt_listing_ids, ...fake_listing_ids]);

// ── 6. avg_price_per_sqft_2bhk (now excludeIds is complete)
const valid_2bhk = listings.filter(
  l => l.is_live && l.bedroom === 2 && !excludeIds.has(l.listing_id)
);
const avg_price_per_sqft_2bhk = valid_2bhk.length
  ? parseFloat(
      (valid_2bhk.reduce((sum, l) => sum + l.price / l.carpet_area, 0) / valid_2bhk.length).toFixed(2)
    )
  : 0;

// ── 7. costliest_project
// price_max in projects is in crores — convert to integer rupees (* 10,000,000)
let costliestProject = projects[0];
for (const p of projects) {
  if (p.price_max > costliestProject.price_max) costliestProject = p;
}
const costliest_project = {
  project_id: costliestProject.project_id,
  price_max_inr: Math.round(costliestProject.price_max * 10000000)
};

// ── 8. listings_last_7_days
// REFERENCE = 2026-09-10T00:00:00+05:30 (fixed anchor from assignment statement)
// Count listings posted in the 7-day window BEFORE this reference point
const REFERENCE = new Date('2026-09-10T00:00:00+05:30').getTime();
const sevenDaysAgo = REFERENCE - 7 * 24 * 60 * 60 * 1000;
const listings_last_7_days = listings.filter(l => {
  const t = new Date(l.posted_at).getTime();
  return t >= sevenDaysAgo && t < REFERENCE;
}).length;

// ── 10. projects_with_wrong_listing_count
// Count actual listings per project from listings data, compare vs project.total_listings
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

// ── Output
const result = {
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
};

console.log(JSON.stringify(result, null, 2));

// Also save to data/answers.json for gen_submission.js
fs.writeFileSync(path.join(dataDir, 'answers.json'), JSON.stringify(result, null, 2));
console.error('\n✅ Saved to data/answers.json');
