import type { Metadata } from "next";
import "./globals.css";
import AgentationWrapper from "@/components/AgentationWrapper";

export const metadata: Metadata = {
  title: "Smart Home Fuzzy Temperature Controller",
  description: "Intuitive Multi-Zone Smart Home Heating & Cooling Powered by Fuzzy Logic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" style={{ scrollbarGutter: "stable" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body 
        className="bg-background text-foreground font-sans antialiased min-h-screen selection:bg-sky-200 selection:text-sky-900"
        suppressHydrationWarning
      >
        {children}
        <AgentationWrapper />
      </body>
    </html>
  );
}

