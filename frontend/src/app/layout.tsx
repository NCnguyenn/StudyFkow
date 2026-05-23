import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "AI StudyFlow",
  description: "Next-generation focus session manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="antialiased">
        {/* Global Animated Mesh Gradient - renders behind everything */}
        <div className="ethereal-mesh-bg" aria-hidden="true">
          <div className="mesh-blob-1" />
          <div className="mesh-blob-2" />
          <div className="mesh-blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
