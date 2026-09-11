import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SetPassword from "@/components/SetPassword";

export const metadata: Metadata = {
  title: "Set your password — Cross Platform Terminal",
  description: "Choose the password you sign in to Cross Platform Terminal with.",
  alternates: { canonical: "/set-password" },
  // Reached from an email, with a token in the address. Nothing here belongs in a search index,
  // and the token must not leave in a Referer header if the reader clicks a link on the page.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function SetPasswordPage({
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
        <SetPassword email={first(params.email)} token={first(params.token)} />
      </main>
      <Footer />
    </>
  );
}
