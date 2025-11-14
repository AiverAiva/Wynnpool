import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider"
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { ScrollArea } from "@/components/ui/scroll-area"
import { SponsoredWhale } from "@/components/custom/sponsor-tab";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google"
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Wynnpool",
  description: "An integration that provides utilities/tools for Wynncraft, using the up-to-date data with global statistics and more!",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
        <div className="h-24"/>  {/* Spacer for footer, this should be temporary and remove later on*/}
        <Footer />
      </body>
    </html>
  );
}
