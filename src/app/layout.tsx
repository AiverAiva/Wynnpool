import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider"
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/custom/navbar";

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
  keywords: ["Wynncraft", "Lootrun", "Raid", "Aspect", "Wynndata"],
  openGraph: {
    images: '/images/og-image.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
