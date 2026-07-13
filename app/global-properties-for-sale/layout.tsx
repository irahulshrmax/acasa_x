// app/global-properties/layout.tsx

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function GlobalPropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}