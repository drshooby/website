import "./globals.css";

import { Jost } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

const jost = Jost({ subsets: ["latin"] });

export const metadata = {
  title: "David Shubov",
  description: "David's Project Portfolio",
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
