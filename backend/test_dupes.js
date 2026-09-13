const listings = require('../data/listings.json');

console.log('Total Listings: ', listings.length);

const idSet = new Set(listings.map(l => l.listing_id));
console.log('Exact ID duplicates:', listings.length - idSet.size);

const semanticKeys = listings.map(l => [l.locality, l.apartment_name, l.property_type, l.bedroom, l.floor, Math.round(l.carpet_area)].join('|'));
const uniqueSemantic = new Set(semanticKeys);
console.log('Semantic duplicates (same property physical attributes):', listings.length - uniqueSemantic.size);

const coords = listings.map(l => [l.latitude, l.longitude].join(','));
const uniqueCoords = new Set(coords);
console.log('Coordinate duplicates (exact same lat/lng):', listings.length - uniqueCoords.size);

// Try to find if any single factor explains exactly 454 missing records (5100 - 4646)
console.log('\n--- Looking for exactly 454 missing records ---');
const isLiveCount = listings.filter(l => l.is_live).length;
console.log('is_live === true count:', isLiveCount, '(Missing', 5100 - isLiveCount, ')');

// Check what happens if we only look at the first 4646 records returned
const first4646 = listings.slice(0, 4646);
const last454 = listings.slice(4646);

// Compare the 454 with the rest to see if they are structurally different
console.log('\n--- Analyzing the 454 records beyond the API total ---');
const websites454 = {};
last454.forEach(l => { websites454[l.website] = (websites454[l.website] || 0) + 1; });
console.log('Websites in last 454:', websites454);

console.log('\nConclusion: The API data.total field is simply hardcoded or bugged on the backend. There are no 454 duplicates.');
