import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArchiveProjectsPageClient from "./ArchiveProjectsPageDetailClient";

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <ArchiveProjectsPageClient />
      <Footer />
    </main>
  );
}