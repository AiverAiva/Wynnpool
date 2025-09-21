import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider"
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { ScrollArea } from "@/components/ui/scroll-area"
import { SponsoredWhale } from "@/components/custom/sponsor-tab";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Wynnpool",
  description: "A utility integration for Wynncraft, using the up-to-date data with global statistics and more.",
  keywords: ["Wynncraft", "Lootrun", "Raid", "Aspect", "Annihilation"],
  openGraph: {
    images: '/images/og-image.png',
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics Script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FCQ4YPPLEP"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-FCQ4YPPLEP');
            `,
          }}
        />
      </head>
      <body
        className={`font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Navbar />
          <SponsoredWhale />
          <Toaster />
          {children}
          {modal}
        </ThemeProvider>
        <footer className="border-t mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
            <p>Copyright Wynnpool &copy; 2024 - 2025. All rights reserved. Not affiliated with Wynncraft.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
