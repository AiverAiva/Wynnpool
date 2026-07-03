import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";
import localFont from "next/font/local"
import { Pixelify_Sans } from "next/font/google"
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import { getCurrentUser } from "@/lib/server-auth";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
})

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
  display: "swap",
  weight: "700",
})

export const metadata: Metadata = {
  title: "Wynnpool",
  description: "An integration that provides utilities/tools for Wynncraft, using the up-to-date data with global statistics and more!",
  keywords: ["Wynncraft", "Lootrun", "Raid", "Aspect", "Annihilation"],
  openGraph: {
    images: '/images/og-image.png',
  },
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${pixelifySans.variable}`} suppressHydrationWarning>
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
        <Providers>
          <Navbar user={user} />
          <Toaster />
          {children}
          {modal}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
