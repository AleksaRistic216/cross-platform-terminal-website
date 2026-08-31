import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Pillars from "@/components/Pillars";
import Features from "@/components/Features";
import CrossPlatform from "@/components/CrossPlatform";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cross Platform Terminal (CPT)",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, Windows, macOS",
  description:
    "GPU-accelerated cross-platform terminal and developer workspace with dockable panels, AI workflow integration for Claude Code and GitHub Copilot, and automatic cross-platform quirks resolution.",
  // A single perpetual licence, bought once. Deliberately not a UnitPriceSpecification: there is no
  // recurring billing anywhere in the checkout, and describing one to search engines advertises a
  // subscription that does not exist.
  offers: {
    "@type": "Offer",
    price: "24",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "GPU-accelerated terminal rendering",
    "Full VT/PTY support with tabbed sessions",
    "Dockable panels and widgets",
    "AI Workflow Pipeline with Claude Code and GitHub Copilot",
    "Cross-platform quirks resolution",
    "In-app auto-update",
    "No installation required",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <Features />
        <CrossPlatform />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
