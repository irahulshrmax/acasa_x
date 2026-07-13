// app/search/page.tsx
import { Suspense } from 'react';
import SearchPage from './SearchPage'; // ← Aapka main component

// ✅ IMPORTANT - Yeh exports add karo
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#192334] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}