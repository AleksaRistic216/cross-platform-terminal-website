/*
 * Every answer here is sourced from what the code actually does — the licence grant in
 * `lib/client-api.ts`, the provisioning path in `lib/provision.ts`, and the emails in `lib/email.ts`.
 * If one of those changes, this changes with it. Do not add an answer the backend cannot back up.
 */

const faqs = [
  {
    q: "Is this a subscription?",
    a: "No. You pay €24 once. The licence is perpetual — it never expires, there is nothing to renew, and every future update is included.",
  },
  {
    q: "Can I try it before buying?",
    a: "No. There is no trial and no free tier — CPT needs a licence from the first launch. What that buys is a single €24 payment rather than an ongoing commitment: the licence is perpetual, so there is no renewal to forget about and nothing to cancel.",
  },
  {
    q: "What happens after I pay?",
    a: "We create your account and email your sign-in details to the address you paid with. Open the app and sign in when it asks. If you already have a Limitless Soft account, the licence is added to it and you keep the password you already use.",
  },
  {
    q: "Can I use it on more than one machine?",
    a: "The licence covers your account. To move to another machine, release the current device from the licence dialog in the app and sign in on the new one.",
  },
  {
    q: "How do I pay?",
    a: "Crypto, through NOWPayments. That is the only payment method today. Cards are not supported yet.",
  },
  {
    q: "Do I need to install anything?",
    a: "No installer. Extract the archive and run it — Linux ships as an AppImage and a tar.gz, Windows as a plain ZIP, with no admin rights and no system-wide changes. You do need a licence: the app asks you to sign in the first time you open it.",
  },
  {
    q: "Is there a macOS build?",
    a: "Not yet. macOS is in progress; the download page will list it as soon as there is a build to ship.",
  },
  {
    q: "Do you offer refunds?",
    a: "No — all sales are final. Crypto payments cannot be reversed once they confirm, so there is no mechanism to send one back. Since there is no trial either, ask anything you need to know before you buy: open an issue on the release repository and you will get an answer.",
  },
  {
    q: "I lost my password.",
    a: "Reply to the email your licence came in and we will sort it out. You can also manage the account from the customer portal.",
  },
  {
    q: "I found a bug.",
    a: "Open an issue on the release repository. Reported bugs are fixed and shipped within a day.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FAQ() {
  return (
    <section id="faq" className="py-24 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-accent)" }}
          >
            FAQ
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            The things people ask before buying
          </h2>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          {faqs.map(({ q, a }) => (
            <details key={q} className="group border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
              <summary
                className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium cpt-quiet"
                style={{ color: "var(--color-foreground)" }}
              >
                {q}
                <svg
                  className="w-4 h-4 shrink-0 transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--color-accent)" }}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="px-5 pb-4 -mt-1 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
