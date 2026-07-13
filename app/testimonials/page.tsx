import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TestimonialsPage from "./testimonialsPage";

export default function Testimonials() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <TestimonialsPage />
      <Footer />
    </main>
  );
}