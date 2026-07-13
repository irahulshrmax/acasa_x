import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PressPage from "./pressPage";

export default function Press() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <PressPage />
      <Footer />
    </main>
  );
}