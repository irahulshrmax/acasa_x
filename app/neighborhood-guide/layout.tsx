import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopularLinksSection from "@/components/PopularLinksSection";
export default function neighborhoodGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
       <PopularLinksSection />
      <Footer />
    </>
  );
}