// app/dubai-lifestyle-properties/layout.tsx

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PopularLinksSection from "@/components/PopularLinksSection";

export default function DevelopersLayout({
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