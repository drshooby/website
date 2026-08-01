import "./globals.css";

import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

const jost = Jost({ subsets: ["latin"] });

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
    <html lang="en" className={jost.className}>
      <body>
        <ViewTransitions>
          <div className="pageContainer">
            <main className="mainContent">{children}</main>
          </div>
        </ViewTransitions>
      </body>
    </html>
  );
}
