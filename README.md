# Ivy Homes Assignment

This project contains a comprehensive audit of the Ivy Homes real estate API, a complete data extract, and a React frontend to navigate the data truthfully.

## Project Structure
- `/backend`: Node.js scripts used to fuzz endpoints, download the dataset using the correct pagination, and compute the exact analytical answers while stripping corrupted/fraudulent data.
- `/frontend`: The React (Vite) application that serves as the end-user product, built specifically to sidestep the API's lies.
- `submission.json`: The final computed answers and findings for the assignment.
- `API_REFERENCE.md`: The corrected API documentation, patched with the truth.

## How to Run the Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Log in using `demo1@ivy.homes` and password `f26635feae`.
*(The app automatically handles token refresh for sessions longer than 15 minutes).*

## Process for Finding Discrepancies
The hunt for the API's lies was conducted in three phases:
1. **Endpoint Sweeping**: We wrote a Node script (`sweep.js`) to brute-force and fuzz endpoints, discovering that `/auth/login` returns different keys (`access_token`, `refresh_token`), that `/v1/listings` requires auth, and that pagination uses `offset` instead of `page`. We also found the 404s and their correct alternatives (e.g. `/v1/saved`).
2. **Data Extraction & Validation**: Once we could reliably paginate, we downloaded the entire dataset. We then wrote validation scripts (`analyze.js`) looking for mathematically impossible constraints. This revealed the corrupt listings (negative prices, impossible floors, bad coordinates).
3. **Hypothesis Testing**: We looked for anomalies. Why were some 2BHKs 80 sqft? We cross-referenced area against price and discovered the `magichomes` platform was returning Square Meters instead of Square Feet. Why were projects 4.03 rupees? We realized it was Crores. Why were some properties heavily underpriced? We read the descriptions and found the "booking amount" scams.

## Hypotheses that turned out to be fine
- **Duplicate IDs**: We hypothesized that there might be duplicate `listing_id`s across different pages, but after fixing the `offset` pagination, all IDs were perfectly unique.
- **Missing Cities**: We hypothesized that listings might bleed over from other cities due to missing filters, but aside from a few corrupted coordinate outliers, the dataset legitimately belonged to Mumbai.
- **RERA Numbers**: We hypothesized that project RERA numbers might be fake or incorrectly formatted, but no actionable corruption was found there.

## What I would do with two more days
1. **Server-Side Data Mirroring**: Since the API's filtering is unreliable and the API returns corrupt data natively, the ideal architecture would be to sync the Ivy Homes API into our own PostgreSQL database via a cron job. We would run the cleaning scripts on ingest, and the frontend would query our clean database instead of the live API.
2. **Advanced Analytics**: Build a richer "Insights" dashboard using Chart.js to visualize price trends across different localities, instead of just the static numbers computed for the assignment.
3. **Automated Fraud Detection Pipeline**: Move the regex-based "scam description" detection into a more robust NLP classification model to flag suspicious listings automatically.
