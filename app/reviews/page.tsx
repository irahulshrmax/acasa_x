"use client";

import { useState, useEffect } from "react";
import { Star, Quote, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Review = {
  id: number;
  name: string;
  designation: string;
  testimonial: string;
  t_user_image: string | null;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#577C8E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading reviews...</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-light font-['Playfair_Display',serif] text-[#1a2233] mb-3">
              Client Reviews
          </h1>
            <div className="w-12 h-0.5 bg-[#577C8E] mx-auto mb-4" />
            <p className="text-gray-500 max-w-2xl mx-auto">
              What our clients say about their experience with ACASA
            </p>
          </div>

          {/* Rating Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-12 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-3xl font-bold text-[#1a2233]">5.0</p>
            <p className="text-gray-500 text-sm">Based on {reviews.length} reviews</p>
          </div>

          {/* Reviews Grid */}
          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <Quote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">
                    "{review.testimonial}"
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className="w-10 h-10 bg-[#577C8E]/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#577C8E]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a2233]">{review.name}</p>
                      <p className="text-xs text-gray-400">{review.designation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}