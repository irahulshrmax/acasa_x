import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/app/contact-us/ContactSection"; // Change this
import PopularLinksSection from "@/components/PopularLinksSection";
interface PageProps {
  params: { id: string };
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <ContactSection /> 
      <PopularLinksSection />
      <Footer />
    </main>
  );
}