// app/apartments-for-sale-in-dubai/[slug]/page.tsx
import { Suspense } from 'react';
import ApartmentDetailClient from './ApartmentDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function ApartmentDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#192334] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading property details...</p>
        </div>
      </div>
    }>
      <ApartmentDetailClient />
    </Suspense>
  );
}