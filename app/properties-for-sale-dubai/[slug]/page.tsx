  import { Suspense } from 'react';
  import PropertyDetailClient from './PropertyDetailClient';

  export const dynamic = 'force-dynamic';
  export const runtime = 'nodejs';

  export default function PropertyDetailPage() {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#192334] border-t-transparent mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading property...</p>
          </div>
        </div>
      }>
        <PropertyDetailClient />
      </Suspense>
    );
  }