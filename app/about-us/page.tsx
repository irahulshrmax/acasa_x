import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutListingPage from "@/app/about-us/AboutListingPage";



interface PageProps {
  params: { id: string };
}

export default function AboutDetailPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <AboutListingPage />
      <Footer />
    </main>
  );
}