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
  let offset = 0;
  const limit = 50; // API hard-caps at 50 regardless of what you send
  let allResults = [];

  while (true) {
    await ensureFreshToken();

    try {
      const response = await api.get(endpoint, { params: { offset, limit } });

      if (response.status !== 200) {
        console.error(`\n  [error] HTTP ${response.status} at offset ${offset}:`, response.data);
        break;
      }

      const data = response.data;
      const results = data.results || data.data || [];

      // ✅ KEY FIX: stop ONLY when the API returns an empty page.
      // Do NOT use data.total — the API's total field under-reports the real count.
      if (results.length === 0) break;

      allResults = allResults.concat(results);
      offset += results.length;
      process.stdout.write(`\r  fetched ${allResults.length} records (API total claims: ${data.total})...`);

    } catch (e) {
      console.error('\n  [exception]', e.message);
      break;
    }
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
