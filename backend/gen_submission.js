const fs = require('fs');
const path = require('path');

const answers = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'answers.json'), 'utf8'));

const template = {
  "api_key": "IVY26-FCD509DB52CF",
  "candidate": {
    "name": "Krishna Sharma",
    "email": "demo1@ivy.homes", 
    "repo_url": "https://github.com/krishna-sharma/ivy-assignment",
    "demo_url": "https://krishna-ivy.vercel.app"
  },
  "answers": answers,
  "findings": [
    {
      "endpoint": "*",
      "category": "auth",
      "documented": "Send API key as api_key query parameter",
      "actual": "API requires X-API-Key header instead of query parameter",
      "how_found": "Getting 401 when using api_key in query",
      "impact": "All endpoints will 401 without this fix",
      "evidence": []
    },
    {
      "endpoint": "/auth/login",
      "category": "auth",
      "documented": "Returns token, valid for 86400s, no refresh flow",
      "actual": "Returns access_token, refresh_token, valid for 900s",
      "how_found": "Inspecting the /auth/login response payload",
      "impact": "Need to implement token refresh flow and read access_token",
      "evidence": []
    },
    {
      "endpoint": "*",
      "category": "auth",
      "documented": "Implies public endpoints like /v1/listings are unauthenticated",
      "actual": "All /v1/* endpoints require Authorization Bearer token",
      "how_found": "Getting 401 missing bearer token on /v1/listings",
      "impact": "Must force user login before browsing listings",
      "evidence": []
    },
    {
      "endpoint": "*",
      "category": "pagination",
      "documented": "Uses page parameter for pagination",
      "actual": "Uses offset parameter. page parameter is ignored, returning same records",
      "how_found": "Getting 50 duplicate listing_ids across 93 pages when using page param",
      "impact": "Fails to fetch entire dataset unless offset is used",
      "evidence": []
    },
    {
      "endpoint": "*",
      "category": "pagination",
      "documented": "limit parameter maximum 200",
      "actual": "Server caps the limit at 50",
      "how_found": "Requesting limit=200 returns 50 records",
      "impact": "Must iterate by +50 instead of +200",
      "evidence": []
    },
    {
      "endpoint": "/v1/analytics/summary",
      "category": "missing_endpoint",
      "documented": "Returns analytics summary for the city",
      "actual": "Returns 404 Not Found",
      "how_found": "Automated endpoint sweeper",
      "impact": "Must compute analytics manually on frontend/backend",
      "evidence": []
    },
    {
      "endpoint": "/v1/listing/{id}",
      "category": "missing_endpoint",
      "documented": "A single listing endpoint",
      "actual": "Returns 404 Not Found. The correct endpoint is /v1/listings/{id}",
      "how_found": "Automated endpoint sweeper",
      "impact": "Updated API client to use plural form",
      "evidence": []
    },
    {
      "endpoint": "/v1/listings/{id}/similar",
      "category": "missing_endpoint",
      "documented": "Returns similar listings",
      "actual": "Returns 404 Not Found",
      "how_found": "Automated endpoint sweeper",
      "impact": "Similar listings feature cannot be built using API",
      "evidence": []
    },
    {
      "endpoint": "/v1/favourites",
      "category": "missing_endpoint",
      "documented": "Endpoint for saved listings",
      "actual": "Returns 404 Not Found. The correct endpoint is /v1/saved",
      "how_found": "Fuzzing URLs after 404",
      "impact": "Updated API client to use /v1/saved",
      "evidence": []
    },
    {
      "endpoint": "/v1/saved",
      "category": "completeness",
      "documented": "POST requires {'id': '...'}",
      "actual": "POST requires {'listing_id': '...'}",
      "how_found": "POSTing with id returned 422 Unprocessable Entity",
      "impact": "Updated request body payload",
      "evidence": []
    },
    {
      "endpoint": "/v1/projects",
      "category": "units",
      "documented": "price_min and price_max are in Indian rupees, integer",
      "actual": "They are returned in crores",
      "how_found": "Noticed 4.03 as max price instead of millions",
      "impact": "Converted to integer rupees during data analysis",
      "evidence": ["P50001", "P50016"]
    },
    {
      "endpoint": "/v1/listings",
      "category": "units",
      "documented": "carpet_area and super_built_up_area are in square feet",
      "actual": "magichomes listings report areas in square meters",
      "how_found": "Noticed 82 sqft for 2BHK and extreme price/sqft ratios (>100k)",
      "impact": "Converted sqm to sqft for magichomes where price/area ratio is high",
      "evidence": ["MAG-5002204", "MAG-5001874", "MAG-5000775"]
    },
    {
      "endpoint": "/v1/listings",
      "category": "completeness",
      "documented": "Returns active listings; inactive excluded server side",
      "actual": "Endpoint returns listings with is_live: false",
      "how_found": "Saw is_live parameter in listing payload",
      "impact": "Client must manually filter active listings",
      "evidence": ["SQU-5001676", "100-5003165"]
    },
    {
      "endpoint": "/v1/listings",
      "category": "data_quality",
      "documented": "Implied valid physical properties",
      "actual": "Corrupt listings exist (negative price, floor > total_floors, lat/long outside Mumbai)",
      "how_found": "Data filtering scripts",
      "impact": "Excluded corrupt properties from analytics",
      "evidence": ["100-5003914", "DWE-5002623", "MAG-5002818", "DWE-5003960"]
    },
    {
      "endpoint": "/v1/listings",
      "category": "fraud",
      "documented": "Implied genuine listings",
      "actual": "Fake listings asking for booking amount upfront or 'Below market price, this week only'",
      "how_found": "Searching descriptions for suspicious patterns",
      "impact": "Excluded fake properties from analytics",
      "evidence": ["100-5000232", "100-5003534"]
    },
    {
      "endpoint": "/v1/projects",
      "category": "consistency",
      "documented": "total_listings always agrees with GET /v1/listings?project_id=...",
      "actual": "418 projects have a total_listings count that disagrees with actual listings",
      "how_found": "Comparing aggregated listings by project_id against projects data",
      "impact": "Cannot trust total_listings field from projects",
      "evidence": ["P50001", "P50002"]
    }
  ]
};

fs.writeFileSync(path.join(__dirname, '..', 'submission.json'), JSON.stringify(template, null, 2));
console.log('Done writing submission.json');
