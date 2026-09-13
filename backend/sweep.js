require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;
const PASSWORD = 'f26635feae';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },
  validateStatus: () => true 
});

async function sweep() {
  console.log('=== Sweeping Endpoints ===\n');

  // 1. Health
  console.log('GET /health');
  let res = await api.get('/health');
  console.log(`Status: ${res.status}`);
  console.log(`Data:`, res.data);
  console.log('--------------------------\n');

  // 2. Auth Login
  console.log('POST /auth/login');
  res = await api.post('/auth/login', { email: 'demo1@ivy.homes', password: PASSWORD });
  console.log(`Status: ${res.status}`);
  console.log(`Data keys:`, Object.keys(res.data));
  const token = res.data.access_token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('--------------------------\n');

  // 3. Listings
  console.log('GET /v1/listings?offset=0&limit=1');
  res = await api.get('/v1/listings', { params: { offset: 0, limit: 1 } });
  console.log(`Status: ${res.status}`);
  console.log(`Response shape:`, Object.keys(res.data));
  const sampleListing = res.data.results?.[0];
  console.log(`Sample Listing keys:`, sampleListing ? Object.keys(sampleListing) : 'None');
  console.log('--------------------------\n');

  const listingId = sampleListing?.listing_id || 'SQU-5004678';

  // 4. Listing detail (Docs say /v1/listing/{listing_id} - singular)
  console.log(`GET /v1/listing/${listingId}`);
  res = await api.get(`/v1/listing/${listingId}`);
  console.log(`Status: ${res.status}`);
  if (res.status === 404) {
    console.log(`Trying /v1/listings/${listingId} instead...`);
    let res2 = await api.get(`/v1/listings/${listingId}`);
    console.log(`Status of plural: ${res2.status}`);
  }
  console.log('--------------------------\n');

  // 5. Similar listings
  console.log(`GET /v1/listings/${listingId}/similar`);
  res = await api.get(`/v1/listings/${listingId}/similar`);
  console.log(`Status: ${res.status}`);
  console.log('--------------------------\n');

  // 6. Rentals
  console.log('GET /v1/rentals?offset=0&limit=1');
  res = await api.get('/v1/rentals', { params: { offset: 0, limit: 1 } });
  console.log(`Status: ${res.status}`);
  const sampleRental = res.data.results?.[0];
  const rentalId = sampleRental?.listing_id;
  console.log('--------------------------\n');

  // 7. Rental detail
  console.log(`GET /v1/rentals/${rentalId}`);
  res = await api.get(`/v1/rentals/${rentalId}`);
  console.log(`Status: ${res.status}`);
  console.log('--------------------------\n');

  // 8. Projects
  console.log('GET /v1/projects?offset=0&limit=1');
  res = await api.get('/v1/projects', { params: { offset: 0, limit: 1 } });
  console.log(`Status: ${res.status}`);
  const sampleProject = res.data.results?.[0];
  const projectId = sampleProject?.project_id;
  console.log('--------------------------\n');

  // 9. Project detail
  console.log(`GET /v1/projects/${projectId}`);
  res = await api.get(`/v1/projects/${projectId}`);
  console.log(`Status: ${res.status}`);
  console.log('--------------------------\n');

  // 10. Analytics summary
  console.log('GET /v1/analytics/summary');
  res = await api.get('/v1/analytics/summary');
  console.log(`Status: ${res.status}`);
  console.log('--------------------------\n');

  // 11. Favourites
  console.log('GET /v1/favourites');
  res = await api.get('/v1/favourites');
  console.log(`Status: ${res.status}`);
  
  if (res.status === 200) {
    console.log('POST /v1/favourites');
    let favRes = await api.post('/v1/favourites', { id: listingId });
    console.log(`Status: ${favRes.status}`);

    console.log(`DELETE /v1/favourites/${listingId}`);
    let delRes = await api.delete(`/v1/favourites/${listingId}`);
    console.log(`Status: ${delRes.status}`);
  } else if (res.status === 404) {
    console.log('Trying /v1/favorites (US spelling)...');
    let res2 = await api.get('/v1/favorites');
    console.log(`Status: ${res2.status}`);
  }
  console.log('--------------------------\n');

  console.log('POST /auth/logout');
  res = await api.post('/auth/logout');
  console.log(`Status: ${res.status}`);
}

sweep().catch(console.error);
