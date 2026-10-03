import "./globals.css";

import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Jost } from "next/font/google";

const jost = Jost({ subsets: ["latin"] });

// Display serif for the name and titles; mono for dates, tech lines, labels.
// Exposed as CSS variables and wired into the --font-* tokens in globals.css.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
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
      className={`${jost.className} ${instrumentSerif.variable} ${plexMono.variable}`}
    >
      <body>
        <div className="pageContainer">
          <main className="mainContent">{children}</main>
        </div>
      </body>
    </html>
  );
}
