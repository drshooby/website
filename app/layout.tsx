import "./globals.css";

import { Jost } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

const jost = Jost({ subsets: ["latin"] });

export const metadata = {
  title: "David Shubov",
  description: "David's Project Portfolio",
};

// Runs before first paint so a stored/system dark preference can never
// flash the light theme. Must stay inline and blocking.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jost.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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
