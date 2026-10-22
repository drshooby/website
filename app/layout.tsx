import "./globals.css";

import type { Metadata } from "next";
import { EB_Garamond, IBM_Plex_Mono } from "next/font/google";

// EB Garamond for everything set in type (titles take its true small caps
// via font-feature-settings "smcp"); Plex Mono for dates, tech lines, labels.
// Exposed as CSS variables and wired into the --font-* tokens in globals.css.
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// metadataBase resolves relative URLs (and silences Next's warning about them);
// openGraph/twitter are what render the preview card when the link is pasted
// into Slack, iMessage, LinkedIn, or Discord instead of a bare URL.
export const metadata: Metadata = {
  metadataBase: new URL("https://davidshubov.com"),
  title: "David Shubov",
  description: "Cloud and infrastructure engineer.",
  openGraph: {
    title: "David Shubov",
    description: "Cloud and infrastructure engineer.",
    url: "https://davidshubov.com",
    siteName: "David Shubov",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "David Shubov",
    description: "Cloud and infrastructure engineer.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${garamond.variable} ${plexMono.variable}`}
      // The home page's MODE_SCRIPT (app/page.tsx) sets data-mode and
      // data-phase on <html> before React hydrates.
      suppressHydrationWarning
    >
      <body>
        <div className="pageContainer">
          <main className="mainContent">{children}</main>
        </div>
      </body>
    </html>
  );
}
