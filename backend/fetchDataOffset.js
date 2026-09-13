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

async function login() {
  const res = await api.post('/auth/login', {
    email: 'demo1@ivy.homes',
    password: PASSWORD
  });
  if (res.status === 200) {
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
  } else {
    process.exit(1);
  }
}

async function fetchPaginated(endpoint) {
  let offset = 0;
  const limit = 200; 
  let allResults = [];
  
  while (true) {
    try {
      const response = await api.get(endpoint, { params: { offset, limit } });
      if (response.status !== 200) break;
      
      const data = response.data;
      const results = data.results || data.data || [];
      allResults = allResults.concat(results);
      
      if (results.length === 0 || allResults.length >= data.total) {
        break;
      }
      offset += results.length;
    } catch (e) {
      break;
    }
  }
  return allResults;
}

async function main() {
  await login();
  console.log('Fetching listings...');
  fs.writeFileSync(path.join(dataDir, 'listings.json'), JSON.stringify(await fetchPaginated('/v1/listings'), null, 2));
  
  console.log('Fetching rentals...');
  fs.writeFileSync(path.join(dataDir, 'rentals.json'), JSON.stringify(await fetchPaginated('/v1/rentals'), null, 2));
  
  console.log('Fetching projects...');
  fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(await fetchPaginated('/v1/projects'), null, 2));
  console.log('Done');
}

main().catch(console.error);
