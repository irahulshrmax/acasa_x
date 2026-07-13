"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";

type PrivacyPolicy = {
  id: number;
  title: string;
  slug: string;
  content: string;
  seo_title: string;
  seo_keywork: string;
  seo_description: string;
};

export default function PrivacyPolicyPage() {
  const [data, setData] = useState<PrivacyPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/privacy-policy")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <PageLoader label="Loading Privacy Policy..." />
        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="bg-white min-h-screen pt-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl mb-3">Page Not Found</h1>
            <p className="text-gray-500">Privacy Policy content not available.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <main className="bg-white min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light font-['Playfair_Display',serif] text-[#1a2233] mb-3">
              {data.title || "Privacy Policy"}
            </h1>
            <div className="w-12 h-0.5 bg-[#577C8E] mx-auto" />
          </div>

          {/* Content */}
          <div 
            className="prose prose-sm max-w-none prose-headings:text-[#1a2233] prose-headings:font-semibold prose-p:text-gray-600 prose-p:leading-relaxed prose-ul:text-gray-600 prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />

          {/* Last Updated Note */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Last updated: January 2024
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}