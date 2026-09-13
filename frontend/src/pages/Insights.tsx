import { BarChart, AlertTriangle, Info } from 'lucide-react';
import answersData from '../data/answers.json';

export default function Insights() {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-indigo-600 rounded-lg shadow p-6 text-white">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <BarChart className="w-8 h-8" /> 
          Mumbai Real Estate Insights
        </h2>
        <p className="mt-2 text-indigo-100">
          Analytics generated from a complete, cleaned dataset of {answersData.total_listing_records} records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Active Properties</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{answersData.active_listings}</p>
          <p className="text-sm text-gray-500 mt-1">out of {answersData.unique_properties} unique properties total</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Avg 2BHK Price per SqFt</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatter.format(answersData.avg_price_per_sqft_2bhk)}</p>
          <p className="text-sm text-gray-500 mt-1">Across all valid, active 2BHK listings</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Andheri West Total Rent</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatter.format(answersData.total_monthly_rent)}/mo</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Costliest Project</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{answersData.costliest_project.project_id}</p>
          <p className="text-sm text-gray-500 mt-1">Max Price: {formatter.format(answersData.costliest_project.price_max_inr)}</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 text-gray-900">Data Quality Audit & Discoveries</h3>
      
      <div className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-900">Corrupted Listings Removed ({answersData.corrupt_listing_ids.length})</h4>
            <p className="text-sm text-red-700 mt-1">
              We identified and removed listings with physically impossible dimensions (e.g. carpet area greater than super built up area), negative prices, impossible floors (floor &gt; total floors), or coordinates completely outside of Mumbai.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-yellow-900">Fake / Bait Listings Detected ({answersData.fake_listing_ids.length})</h4>
            <p className="text-sm text-yellow-800 mt-1">
              Identified listings specifically designed to generate fake enquiries using suspicious phrases like "Site visit only after the booking amount is paid." and "Below market price, this week only."
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex gap-4">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900">Square Meters vs Square Feet Bug</h4>
            <p className="text-sm text-blue-800 mt-1">
              Despite the documentation claiming all areas are in Square Feet, we discovered that listings from the `magichomes` platform often report dimensions in Square Meters. We corrected these on the fly by identifying absurdly high price-per-area ratios.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex gap-4">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900">Broken Project Counts ({answersData.projects_with_wrong_listing_count})</h4>
            <p className="text-sm text-blue-800 mt-1">
              We found {answersData.projects_with_wrong_listing_count} projects where the `total_listings` property does not match the actual number of listings available on the platform for that project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
