import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="en" className="dark">
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
