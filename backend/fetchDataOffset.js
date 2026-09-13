require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;
const PASSWORD = 'f26635feae';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },
  validateStatus: () => true
});

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let tokenExpiry = 0;

async function login() {
  const res = await api.post('/auth/login', {
    email: 'demo1@ivy.homes',
    password: PASSWORD
  });
  if (res.status === 200) {
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
    // Schedule refresh 60s before expiry (token valid 900s)
    tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  } else {
    console.error('Login failed:', res.data);
    process.exit(1);
  }
}

async function ensureFreshToken() {
  if (Date.now() >= tokenExpiry) {
    process.stdout.write('\n  [token] Refreshing expired token...\n');
    await login();
  }
}

async function fetchPaginated(endpoint) {
  let currentOffset = 0;
  const limit = 50;
  const CHUNK_SIZE = 20; // 20 concurrent requests
  let allResults = [];

  while (true) {
    await ensureFreshToken();

    const offsets = Array.from({ length: CHUNK_SIZE }, (_, i) => currentOffset + i * limit);
    const promises = offsets.map(offset => 
      api.get(endpoint, { params: { offset, limit } }).then(r => r.data.results || r.data.data || []).catch(e => {
        console.error(`\n  [error] at offset ${offset}:`, e.message);
        return [];
      })
    );

    const chunkResults = await Promise.all(promises);
    
    let chunkFinished = false;
    for (const resArray of chunkResults) {
      allResults.push(...resArray);
      if (resArray.length < limit) {
        chunkFinished = true;
        break;
      }
    }

    process.stdout.write(`\r  fetched ${allResults.length} records...`);
    
    if (chunkFinished) break;
    currentOffset += CHUNK_SIZE * limit;
  }

  process.stdout.write(`\r  fetched ${allResults.length} records total.         \n`);
  return allResults;
}

async function main() {
  console.log('Logging in...');
  await login();

  console.log('Fetching listings...');
  const listings = await fetchPaginated('/v1/listings');
  fs.writeFileSync(path.join(dataDir, 'listings.json'), JSON.stringify(listings, null, 2));

  console.log('Fetching rentals...');
  const rentals = await fetchPaginated('/v1/rentals');
  fs.writeFileSync(path.join(dataDir, 'rentals.json'), JSON.stringify(rentals, null, 2));

  console.log('Fetching projects...');
  const projects = await fetchPaginated('/v1/projects');
  fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects, null, 2));

  console.log('All done!');
  console.log(`  listings : ${listings.length}`);
  console.log(`  rentals  : ${rentals.length}`);
  console.log(`  projects : ${projects.length}`);
}

main().catch(console.error);
