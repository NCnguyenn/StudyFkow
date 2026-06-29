import "./globals.css";
import type { Metadata } from "next";
import { Geist, Inter, Merriweather, Fira_Code, Noto_Serif, Caveat, Lexend, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merriweather' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });
const notoSerif = Noto_Serif({ subsets: ['latin'], variable: '--font-noto-serif' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: "AI StudyFlow",
  description: "Next-generation academic study and note-taking platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable, inter.variable, merriweather.variable, firaCode.variable, notoSerif.variable, caveat.variable, lexend.variable, playfair.variable, plusJakarta.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#6366f1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
          }}
        />
      </head>
      <body className="antialiased">
        {/* Global Animated Mesh Gradient - renders behind everything */}
        <div className="ethereal-mesh-bg" aria-hidden="true">
          <div className="ambient-mesh" />
        </div>
        {children}
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js"></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
