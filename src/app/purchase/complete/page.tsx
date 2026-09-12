import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PurchaseComplete from "@/components/PurchaseComplete";

export const metadata: Metadata = {
  title: "Payment complete — Cross Platform Terminal",
  description: "Setting up your Cross Platform Terminal subscription.",
  // Reached only by a redirect from Polar, with a checkout id in the address. Nothing here belongs
  // in a search index, and the id must not leave in a Referer header.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function PurchaseCompletePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <Navbar />
      {/* pt-14 reserves the fixed header's height; the section supplies its own breathing room. */}
      <main className="pt-14">
        <PurchaseComplete checkoutId={first(params.checkout_id)} />
      </main>
      <Footer />
    </>
  );
}
