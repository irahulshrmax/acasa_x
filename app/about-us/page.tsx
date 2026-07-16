import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutListingPage from "@/app/about-us/AboutListingPage";
import PopularLinksSection from "@/components/PopularLinksSection";


interface PageProps {
  params: { id: string };
}

export default function AboutDetailPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <AboutListingPage />
      <PopularLinksSection />
      <Footer />
    </main>
  );
}